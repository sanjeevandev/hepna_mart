from typing import Dict
from app.models.payment import PaymentProvider as PaymentProviderEnum
from app.services.payment_providers.base import PaymentProvider
from app.services.payment_providers.manual_upi import ManualUPIProvider
from app.services.payment_providers.cod import CODProvider

PROVIDERS: Dict[str, PaymentProvider] = {
    PaymentProviderEnum.MANUAL_UPI.value: ManualUPIProvider(),
    PaymentProviderEnum.COD.value: CODProvider(),
}


def get_payment_provider(provider_name: str) -> PaymentProvider:
    provider = PROVIDERS.get(provider_name.lower())
    if not provider:
        # Fallback to manual_upi if not found
        return PROVIDERS[PaymentProviderEnum.MANUAL_UPI.value]
    return provider


__all__ = [
    "PaymentProvider",
    "ManualUPIProvider",
    "CODProvider",
    "get_payment_provider",
]
