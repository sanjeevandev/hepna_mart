from app.core.config import settings


class PaymentConfig:
    """
    Dedicated payment configuration access layer for HEPNA MART.
    """
    UPI_ID: str = settings.HEPNA_UPI_ID
    UPI_DISPLAY_NAME: str = settings.HEPNA_UPI_DISPLAY_NAME
    UPI_QR_PATH: str = settings.HEPNA_UPI_QR_PATH
    CURRENCY: str = settings.HEPNA_PAYMENT_CURRENCY
    MANUAL_UPI_ENABLED: bool = settings.HEPNA_MANUAL_UPI_ENABLED
    COD_ENABLED: bool = settings.HEPNA_COD_ENABLED
    GATEWAY_ENABLED: bool = settings.HEPNA_PAYMENT_GATEWAY_ENABLED

    @classmethod
    def get_public_config(cls) -> dict:
        return {
            "upi_id": cls.UPI_ID,
            "upi_display_name": cls.UPI_DISPLAY_NAME,
            "upi_qr_path": cls.UPI_QR_PATH,
            "currency": cls.CURRENCY,
            "manual_upi_enabled": cls.MANUAL_UPI_ENABLED,
            "cod_enabled": cls.COD_ENABLED,
            "gateway_enabled": cls.GATEWAY_ENABLED,
        }


payment_config = PaymentConfig()
