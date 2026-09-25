import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User, AccountType, UserRole
from app.schemas.auth import RegisterRequest

logger = logging.getLogger("hepna.auth_service")

# Safe predefined seed users for development environments (activated ONLY when ENABLE_DEV_SEED_USERS=True)
DEV_SEED_PERSONAS = [
    {
        "email": "sanjeevan@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Sanjeevan",
        "last_name": "Admin",
        "phone": "+91 99000 00001",
        "role": UserRole.SUPER_ADMIN,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART HQ",
    },
    {
        "email": "kavita.v@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Kavita",
        "last_name": "Verma",
        "phone": "+91 99000 11111",
        "role": UserRole.ADMIN,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART Operations",
    },
    {
        "email": "rajesh.k@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Rajesh",
        "last_name": "Kumar",
        "phone": "+91 99000 22222",
        "role": UserRole.PROCUREMENT_MANAGER,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART Procurement Division",
    },
    {
        "email": "sneha.j@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Sneha",
        "last_name": "Joshi",
        "phone": "+91 99000 33333",
        "role": UserRole.INVENTORY_MANAGER,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART Central Yard",
    },
    {
        "email": "vikram.s@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Vikram",
        "last_name": "Singh",
        "phone": "+91 99000 44444",
        "role": UserRole.ORDER_MANAGER,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART Logistics Hub",
    },
    {
        "email": "ananya.r@hepnamart.com",
        "password": "AdminPassword123!",
        "first_name": "Ananya",
        "last_name": "Rao",
        "phone": "+91 99000 55555",
        "role": UserRole.SUPPORT_STAFF,
        "account_type": AccountType.BUSINESS,
        "company_name": "HEPNA MART Customer Care",
    },
    {
        "email": "priya.sharma@apexinfra.com",
        "password": "CustomerPassword123!",
        "first_name": "Priya",
        "last_name": "Sharma",
        "phone": "+91 98112 34567",
        "role": UserRole.CUSTOMER,
        "account_type": AccountType.BUSINESS,
        "company_name": "Apex Infrastructure Pvt Ltd",
    },
    {
        "email": "john.doe@buildright.in",
        "password": "CustomerPassword123!",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+91 98765 43210",
        "role": UserRole.CUSTOMER,
        "account_type": AccountType.CONTRACTOR,
        "company_name": "BuildRight Constructions",
    },
    {
        "email": "rahul.mehta@gmail.com",
        "password": "CustomerPassword123!",
        "first_name": "Rahul",
        "last_name": "Mehta",
        "phone": "+91 98220 12345",
        "role": UserRole.CUSTOMER,
        "account_type": AccountType.INDIVIDUAL,
        "company_name": None,
    },
]


class AuthService:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        normalized = email.lower().strip()
        return db.scalar(select(User).where(User.email == normalized))

    @staticmethod
    def register_customer(db: Session, req: RegisterRequest) -> User:
        """
        Creates a new customer user. Strictly enforces role = UserRole.CUSTOMER.
        """
        existing = AuthService.get_by_email(db, req.email)
        if existing:
            raise ValueError("An account with this email address already exists.")

        hashed = hash_password(req.password)
        new_user = User(
            email=req.email.lower().strip(),
            password_hash=hashed,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            phone=req.phone.strip() if req.phone else None,
            account_type=req.account_type,
            role=UserRole.CUSTOMER,  # Public signup can NEVER create staff roles
            company_name=req.company_name.strip() if req.company_name else None,
            is_active=True,
            is_email_verified=False,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Validates user credentials against server-side Argon2 hash.
        Updates last_login_at timestamp upon success.
        """
        user = AuthService.get_by_email(db, email)
        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        if not user.is_active:
            return None

        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
        """
        Updates password after verifying the active password.
        """
        if not verify_password(current_password, user.password_hash):
            return False

        user.password_hash = hash_password(new_password)
        db.commit()
        db.refresh(user)
        return True

    @staticmethod
    def seed_dev_users_if_enabled(db: Session) -> int:
        """
        Explicitly seeds test personas in local development mode only.
        Never executes in production unless ENABLE_DEV_SEED_USERS is set to True.
        """
        if not settings.ENABLE_DEV_SEED_USERS:
            return 0

        created_count = 0
        for persona in DEV_SEED_PERSONAS:
            existing = AuthService.get_by_email(db, persona["email"])
            if not existing:
                u = User(
                    email=persona["email"].lower(),
                    password_hash=hash_password(persona["password"]),
                    first_name=persona["first_name"],
                    last_name=persona["last_name"],
                    phone=persona["phone"],
                    role=persona["role"],
                    account_type=persona["account_type"],
                    company_name=persona["company_name"],
                    is_active=True,
                    is_email_verified=True,
                )
                db.add(u)
                created_count += 1

        if created_count > 0:
            db.commit()
            logger.info("Successfully seeded %d development personas.", created_count)

        return created_count
