from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.payment import Payment, PaymentStatus


class PaymentProvider(ABC):
    """
    Provider-agnostic abstract interface for payment processors.
    Enables future integrations (Razorpay, Cashfree, PhonePe) without database redesign.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the unique identifier for the provider."""
        pass

    @abstractmethod
    def create_payment(
        self,
        db: Session,
        order_id: str,
        user_id: str,
        amount: Decimal,
        currency: str = "INR",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Payment:
        """Initializes a new payment transaction."""
        pass

    @abstractmethod
    def verify_payment(
        self,
        db: Session,
        payment: Payment,
        verification_data: Optional[Dict[str, Any]] = None,
        verified_by_user_id: Optional[str] = None,
    ) -> Payment:
        """Verifies an existing payment."""
        pass

    @abstractmethod
    def handle_webhook(
        self,
        db: Session,
        payload: Dict[str, Any],
        signature: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Processes incoming webhooks from external gateways."""
        pass

    @abstractmethod
    def refund_payment(
        self,
        db: Session,
        payment: Payment,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        refunded_by_user_id: Optional[str] = None,
    ) -> Payment:
        """Processes a refund for a verified payment."""
        pass

    @abstractmethod
    def get_payment_status(
        self,
        db: Session,
        payment: Payment,
    ) -> PaymentStatus:
        """Queries the provider for the latest transaction status."""
        pass
