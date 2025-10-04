from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from core.configs.db import db_settings

# Создаем асинхронный движок
engine = create_async_engine(
    db_settings.database_uri.replace("postgresql://", "postgresql+asyncpg://"),
    echo=True
)

# Создаем фабрику асинхронных сессий
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
