from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError

from core.configs.auth import password_settings


ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,   # 64 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16,
    type=Type.ID,        # Argon2id
)
# Фейковый хеш для сглаживания таймингов, когда пользователя нет
_FAKE_HASH = ph.hash("a81nBSj4#d7gv" + password_settings.pepper)


def verify_password(stored_hash: str, password: str) -> bool:
    try:
        return ph.verify(stored_hash, password + password_settings.pepper)
    except VerifyMismatchError:
        return False


def hash_password(password: str) -> str:
    return ph.hash(password + password_settings.pepper)
