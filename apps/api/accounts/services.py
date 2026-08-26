import random
import string

from django.core.cache import cache

OTP_TTL_SECONDS = 5 * 60           # код живёт 5 минут
OTP_RESEND_COOLDOWN_SECONDS = 60   # повторную отправку можно запросить не чаще раза в минуту
OTP_MAX_ATTEMPTS = 5               # столько попыток ввода кода даём
OTP_LOCKOUT_SECONDS = 15 * 60      # после превышения — блокировка на 15 минут


def _code_key(email):
    return f"otp:code:{email.lower()}"


def _cooldown_key(email):
    return f"otp:cooldown:{email.lower()}"


def _attempts_key(email):
    return f"otp:attempts:{email.lower()}"


class OTPCooldownError(Exception):
    pass


class OTPLockedError(Exception):
    pass


class OTPInvalidError(Exception):
    pass


def generate_and_store_otp(email):
    # Защита от спама: если код уже запрашивали недавно — не шлём новый.
    if cache.get(_cooldown_key(email)):
        raise OTPCooldownError()

    code = "".join(random.choices(string.digits, k=4))
    cache.set(_code_key(email), code, timeout=OTP_TTL_SECONDS)
    cache.set(_cooldown_key(email), True, timeout=OTP_RESEND_COOLDOWN_SECONDS)
    cache.delete(_attempts_key(email))
    return code


def verify_otp(email, code):
    attempts = cache.get(_attempts_key(email)) or 0
    if attempts >= OTP_MAX_ATTEMPTS:
        raise OTPLockedError()

    stored_code = cache.get(_code_key(email))
    if not stored_code or stored_code != code:
        cache.set(_attempts_key(email), attempts + 1, timeout=OTP_LOCKOUT_SECONDS)
        raise OTPInvalidError()

    # Код одноразовый — сразу гасим, чтобы его нельзя было переиспользовать.
    cache.delete(_code_key(email))
    cache.delete(_attempts_key(email))
