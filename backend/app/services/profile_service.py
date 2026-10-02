import logging
from typing import Optional, Union
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import BusinessProfile, ContractorProfile
from app.models.user import User
from app.schemas.profile import (
    BusinessProfileCreate,
    BusinessProfileUpdate,
    ContractorProfileCreate,
    ContractorProfileUpdate,
)

logger = logging.getLogger("hepna.services.profile")


class ProfileService:
    """
    Domain service for authenticated customer Business & Contractor profiles.
    Strictly enforces single-user ownership isolation.
    """

    @staticmethod
    def get_business_profile(db: Session, user_id: str) -> Optional[BusinessProfile]:
        """
        Retrieves the business profile for the specified authenticated user.
        """
        stmt = select(BusinessProfile).where(BusinessProfile.user_id == user_id)
        profile = db.scalar(stmt)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business profile not found for this account.",
            )
        return profile

    @staticmethod
    def upsert_business_profile(
        db: Session,
        user_id: str,
        payload: Union[BusinessProfileCreate, BusinessProfileUpdate],
    ) -> BusinessProfile:
        """
        Creates or updates a business profile for the authenticated user.
        Ensures strict 1:1 user-to-business-profile cardinality.
        """
        stmt = select(BusinessProfile).where(BusinessProfile.user_id == user_id)
        profile = db.scalar(stmt)

        update_dict = payload.model_dump(exclude_unset=True)

        # Compute tax verification status based on GSTIN presence (administrative status)
        if "gstin" in update_dict and update_dict["gstin"]:
            tax_status = "pending"
        elif "gstin" in update_dict and not update_dict["gstin"]:
            tax_status = "not_provided"
        else:
            tax_status = profile.tax_verification_status if profile else "not_provided"

        if profile is None:
            # Create new business profile
            create_data = payload.model_dump()
            profile = BusinessProfile(
                user_id=user_id,
                business_name=create_data.get("business_name", "My Business"),
                business_type=create_data.get("business_type", "Private Limited Company"),
                gstin=create_data.get("gstin"),
                pan=create_data.get("pan"),
                registered_address=create_data.get("registered_address", ""),
                city=create_data.get("city", ""),
                state=create_data.get("state", ""),
                pincode=create_data.get("pincode", ""),
                contact_person=create_data.get("contact_person", ""),
                contact_phone=create_data.get("contact_phone", ""),
                contact_email=create_data.get("contact_email"),
                tax_verification_status=tax_status,
            )
            db.add(profile)
            logger.info("Created new business profile for user_id=%s", user_id)
        else:
            # Update existing business profile
            for field, val in update_dict.items():
                setattr(profile, field, val)
            profile.tax_verification_status = tax_status
            logger.info("Updated business profile id=%s for user_id=%s", profile.id, user_id)

        # Also sync company_name on user if provided
        user = db.get(User, user_id)
        if user and profile.business_name:
            user.company_name = profile.business_name

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def get_contractor_profile(db: Session, user_id: str) -> Optional[ContractorProfile]:
        """
        Retrieves the contractor profile for the specified authenticated user.
        """
        stmt = select(ContractorProfile).where(ContractorProfile.user_id == user_id)
        profile = db.scalar(stmt)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contractor profile not found for this account.",
            )
        return profile

    @staticmethod
    def upsert_contractor_profile(
        db: Session,
        user_id: str,
        payload: Union[ContractorProfileCreate, ContractorProfileUpdate],
    ) -> ContractorProfile:
        """
        Creates or updates a contractor profile for the authenticated user.
        """
        stmt = select(ContractorProfile).where(ContractorProfile.user_id == user_id)
        profile = db.scalar(stmt)

        update_dict = payload.model_dump(exclude_unset=True)

        if profile is None:
            # Create new contractor profile
            create_data = payload.model_dump()
            profile = ContractorProfile(
                user_id=user_id,
                business_name=create_data.get("business_name", "My Contracting Firm"),
                specialization=create_data.get("specialization", []),
                years_of_experience=create_data.get("years_of_experience", 1),
                service_area=create_data.get("service_area", "Local District"),
                license_number=create_data.get("license_number"),
                project_count=create_data.get("project_count", 0),
                preferred_materials=create_data.get("preferred_materials", []),
                verification_status="pending" if create_data.get("license_number") else "not_provided",
            )
            db.add(profile)
            logger.info("Created new contractor profile for user_id=%s", user_id)
        else:
            # Update existing contractor profile
            for field, val in update_dict.items():
                setattr(profile, field, val)
            if "license_number" in update_dict and update_dict["license_number"]:
                if profile.verification_status == "not_provided":
                    profile.verification_status = "pending"
            logger.info("Updated contractor profile id=%s for user_id=%s", profile.id, user_id)

        # Also sync company_name on user if contractor firm name provided
        user = db.get(User, user_id)
        if user and profile.business_name:
            user.company_name = profile.business_name

        db.commit()
        db.refresh(profile)
        return profile
