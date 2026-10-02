import logging
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.estimate import Estimate
from app.models.project import Project, ProjectMaterial
from app.models.product import Product
from app.models.organization import OrgRole
from app.schemas.estimate import (
    EstimateCreateRequest,
    EstimateUpdateRequest,
    EstimateResponse,
)
from app.services.project_service import ProjectService
from app.models.activity import ProjectAction
from app.services.activity_service import ProjectActivityService

logger = logging.getLogger("hepna.estimate_service")


class EstimateService:
    @staticmethod
    def calculate_live_summary(db: Session, raw_estimate: Estimate) -> Dict[str, Any]:
        """
        Compares an estimate snapshot against current product catalog prices.
        """
        materials = raw_estimate.materials or []
        refreshed_materials = []
        current_subtotal = Decimal("0.00")

        for m in materials:
            matched_prod_id = m.get("matchedProductId") or m.get("matched_product_id")
            price_at_est = Decimal(str(m.get("priceAtEstimate") or m.get("price_at_estimate") or 0))
            quantity = Decimal(str(m.get("quantity") or 0))

            product = None
            if matched_prod_id:
                product = db.scalar(select(Product).where(Product.id == matched_prod_id))

            if product:
                curr_price = product.price
                in_stock = product.is_active
                stock_count = 500  # Default catalog stock
                if curr_price != price_at_est:
                    price_status = "updated"
                else:
                    price_status = "current"
            else:
                curr_price = price_at_est
                in_stock = False
                stock_count = 0
                price_status = "unavailable" if price_at_est > 0 else "no-price"

            curr_line_total = curr_price * quantity
            current_subtotal += curr_line_total

            item_copy = dict(m)
            item_copy["currentPrice"] = float(curr_price)
            item_copy["currentLineTotal"] = float(curr_line_total)
            item_copy["priceStatus"] = price_status
            item_copy["inStock"] = in_stock
            item_copy["stockCount"] = stock_count
            refreshed_materials.append(item_copy)

        current_tax = current_subtotal * Decimal("0.18")
        current_delivery = Decimal("0.00") if current_subtotal > Decimal("5000.00") else Decimal("199.00")
        current_total = current_subtotal + current_tax + current_delivery

        total_at_est = raw_estimate.total_at_estimate or Decimal("0.00")
        price_diff = current_total - total_at_est
        has_price_changes = abs(price_diff) > Decimal("0.01")

        return {
            "materials": refreshed_materials,
            "current_subtotal": float(current_subtotal),
            "current_tax": float(current_tax),
            "current_delivery": float(current_delivery),
            "current_total": float(current_total),
            "price_difference": float(price_diff),
            "has_price_changes": has_price_changes,
        }

    @staticmethod
    def to_estimate_response(db: Session, raw_estimate: Estimate) -> EstimateResponse:
        live = EstimateService.calculate_live_summary(db, raw_estimate)
        return EstimateResponse(
            id=raw_estimate.id,
            user_id=raw_estimate.user_id,
            project_id=raw_estimate.project_id,
            project_type=raw_estimate.project_type,
            built_up_area=float(raw_estimate.built_up_area),
            area_unit=raw_estimate.area_unit,
            floors=raw_estimate.floors,
            quality=raw_estimate.quality,
            city=raw_estimate.city,
            project_name=raw_estimate.project_name,
            inputs=raw_estimate.inputs,
            materials=live["materials"],
            subtotal_at_estimate=float(raw_estimate.subtotal_at_estimate),
            tax_at_estimate=float(raw_estimate.tax_at_estimate),
            delivery_at_estimate=float(raw_estimate.delivery_at_estimate),
            total_at_estimate=float(raw_estimate.total_at_estimate),
            current_subtotal=live["current_subtotal"],
            current_tax=live["current_tax"],
            current_delivery=live["current_delivery"],
            current_total=live["current_total"],
            price_difference=live["price_difference"],
            has_price_changes=live["has_price_changes"],
            validity_days=raw_estimate.validity_days,
            price_snapshot_timestamp=raw_estimate.price_snapshot_timestamp,
            notes=raw_estimate.notes,
            created_at=raw_estimate.created_at,
            updated_at=raw_estimate.updated_at,
        )

    @staticmethod
    def list_estimates(db: Session, user_id: str) -> List[EstimateResponse]:
        """
        Fetches all estimates owned by the user.
        """
        stmt = (
            select(Estimate)
            .where(Estimate.user_id == user_id)
            .order_by(Estimate.created_at.desc())
        )
        raw_list = list(db.scalars(stmt).all())
        return [EstimateService.to_estimate_response(db, e) for e in raw_list]

    @staticmethod
    def get_estimate(db: Session, user_id: str, estimate_id: str) -> EstimateResponse:
        """
        Fetches a single estimate owned by the user.
        """
        stmt = select(Estimate).where(Estimate.id == estimate_id)
        estimate = db.scalar(stmt)
        if not estimate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estimate '{estimate_id}' not found.",
            )

        if estimate.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this estimate.",
            )

        return EstimateService.to_estimate_response(db, estimate)

    @staticmethod
    def create_estimate(db: Session, user_id: str, req: EstimateCreateRequest) -> EstimateResponse:
        """
        Saves a new calculation estimate snapshot to PostgreSQL.
        """
        inp = req.inputs
        project_type = inp.get("projectType") or inp.get("project_type") or "House"
        built_up_area = Decimal(str(inp.get("builtUpArea") or inp.get("built_up_area") or "1500"))
        area_unit = inp.get("areaUnit") or inp.get("area_unit") or "sq.ft"
        floors = int(inp.get("floors") or 1)
        quality = inp.get("quality") or "standard"
        city = inp.get("city") or "Pune"
        project_name = inp.get("projectName") or inp.get("project_name")
        project_id = req.project_id or inp.get("projectId") or inp.get("project_id")

        materials = req.materials or []
        subtotal = req.subtotal_at_estimate or Decimal("0.00")
        tax = req.tax_at_estimate or (subtotal * Decimal("0.18"))
        delivery = req.delivery_at_estimate or (Decimal("0.00") if subtotal > Decimal("5000.00") else Decimal("199.00"))
        total = req.total_at_estimate or (subtotal + tax + delivery)

        estimate_id = f"EST-{uuid.uuid4().hex[:5].upper()}"

        estimate = Estimate(
            id=estimate_id,
            user_id=user_id,
            project_id=project_id,
            project_type=project_type,
            built_up_area=built_up_area,
            area_unit=area_unit,
            floors=floors,
            quality=quality,
            city=city,
            project_name=project_name,
            inputs=inp,
            materials=materials,
            subtotal_at_estimate=subtotal,
            tax_at_estimate=tax,
            delivery_at_estimate=delivery,
            total_at_estimate=total,
            validity_days=req.validity_days,
            price_snapshot_timestamp=datetime.now(timezone.utc),
            notes=req.notes,
        )

        db.add(estimate)
        db.commit()
        db.refresh(estimate)
        logger.info("Saved estimate %s for user %s", estimate.id, user_id)
        return EstimateService.to_estimate_response(db, estimate)

    @staticmethod
    def update_estimate(
        db: Session,
        user_id: str,
        estimate_id: str,
        updates: EstimateUpdateRequest,
    ) -> EstimateResponse:
        """
        Updates estimate notes or linked project_id.
        """
        stmt = select(Estimate).where(Estimate.id == estimate_id)
        estimate = db.scalar(stmt)
        if not estimate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estimate '{estimate_id}' not found.",
            )

        if estimate.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this estimate.",
            )

        if updates.notes is not None:
            estimate.notes = updates.notes
        if updates.project_id is not None:
            estimate.project_id = updates.project_id

        estimate.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(estimate)
        return EstimateService.to_estimate_response(db, estimate)

    @staticmethod
    def delete_estimate(db: Session, user_id: str, estimate_id: str) -> bool:
        """
        Deletes a saved estimate.
        """
        stmt = select(Estimate).where(Estimate.id == estimate_id)
        estimate = db.scalar(stmt)
        if not estimate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estimate '{estimate_id}' not found.",
            )

        if estimate.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this estimate.",
            )

        db.delete(estimate)
        db.commit()
        logger.info("Deleted estimate %s for user %s", estimate_id, user_id)
        return True

    @staticmethod
    def refresh_pricing(db: Session, user_id: str, estimate_id: str) -> EstimateResponse:
        """
        Refreshes estimate material prices to current catalog rates and updates snapshot.
        """
        stmt = select(Estimate).where(Estimate.id == estimate_id)
        estimate = db.scalar(stmt)
        if not estimate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estimate '{estimate_id}' not found.",
            )

        if estimate.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this estimate.",
            )

        live = EstimateService.calculate_live_summary(db, estimate)
        estimate.materials = live["materials"]
        estimate.subtotal_at_estimate = Decimal(str(live["current_subtotal"]))
        estimate.tax_at_estimate = Decimal(str(live["current_tax"]))
        estimate.delivery_at_estimate = Decimal(str(live["current_delivery"]))
        estimate.total_at_estimate = Decimal(str(live["current_total"]))
        estimate.price_snapshot_timestamp = datetime.now(timezone.utc)
        estimate.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(estimate)
        return EstimateService.to_estimate_response(db, estimate)

    @staticmethod
    def transfer_to_project_boq(
        db: Session,
        user_id: str,
        estimate_id: str,
        target_project_id: str,
    ) -> Dict[str, Any]:
        """
        Transfers all matched materials from an estimate into a project's BOQ.
        """
        # 1. Verify estimate ownership
        stmt_est = select(Estimate).where(Estimate.id == estimate_id)
        estimate = db.scalar(stmt_est)
        if not estimate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estimate '{estimate_id}' not found.",
            )
        if estimate.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this estimate.",
            )

        # 2. Verify target project access and BOQ write permissions
        project = ProjectService.get_project_entity(
            db,
            user_id,
            target_project_id,
            required_roles=[
                OrgRole.PROJECT_MANAGER,
                OrgRole.PROCUREMENT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        # 3. Transfer materials
        added_count = 0
        for mat in estimate.materials:
            prod_id = mat.get("matchedProductId") or mat.get("matched_product_id")
            if not prod_id:
                continue

            product = db.scalar(select(Product).where(Product.id == prod_id))
            if not product:
                continue

            quantity = Decimal(str(mat.get("quantity") or 1))
            unit = mat.get("unit") or product.unit or "Piece"

            # Check existing in project
            existing = db.scalar(
                select(ProjectMaterial)
                .where(
                    ProjectMaterial.project_id == project.id,
                    ProjectMaterial.product_id == prod_id,
                )
            )
            if existing:
                existing.quantity += quantity
                existing.updated_at = datetime.now(timezone.utc)
            else:
                new_mat = ProjectMaterial(
                    id=str(uuid.uuid4()),
                    project_id=project.id,
                    product_id=prod_id,
                    quantity=quantity,
                    unit=unit,
                    stage=project.stage or "Foundation",
                    price_at_addition=product.price,
                    added_at=datetime.now(timezone.utc),
                )
                db.add(new_mat)
            added_count += 1

        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.ESTIMATE_TRANSFERRED_TO_BOQ,
            resource_type="estimate",
            resource_id=estimate.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "estimate_id": estimate.id,
                "estimate_name": estimate.project_name or estimate.id,
                "transferred_items": added_count,
                "estimate_total": float(estimate.total_at_estimate),
            },
        )

        db.commit()

        return {
            "status": "ok",
            "transferred_items": added_count,
            "project_id": project.id,
            "project_name": project.name,
        }
