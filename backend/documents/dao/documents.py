from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from .models import Document, DocumentStatus


class DocumentDAO:

    @classmethod
    async def get_by_id(cls, session: AsyncSession, document_id: int) -> Document | None:
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_id_and_user(
        cls,
        session: AsyncSession,
        document_id: int,
        user_id: int
    ) -> Document | None:
        result = await session.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_user(
        cls,
        session: AsyncSession,
        user_id: int
    ) -> list[Document]:
        result = await session.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    @classmethod
    async def get_all_unindexed(cls, session: AsyncSession) -> list[Document]:
        result = await session.execute(
            select(Document).where(
                Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.INDEXING])
            )
        )
        return list(result.scalars().all())

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        filename: str,
        name: str,
        s3_path: str,
        user_id: int,
        status: DocumentStatus = DocumentStatus.UPLOADED
    ) -> Document:
        db_document = Document(
            filename=filename,
            name=name,
            s3_path=s3_path,
            user_id=user_id,
            status=status
        )
        session.add(db_document)
        await session.flush()
        await session.refresh(db_document)
        return db_document

    @classmethod
    async def mark_as_indexed(
        cls,
        session: AsyncSession,
        document_id: int
    ) -> Document | None:
        stmt = (
            update(Document)
            .where(Document.id == document_id)
            .values(
                indexed_at=func.now(),
                status=DocumentStatus.FINISHED
            )
        )
        await session.execute(stmt)
        await session.flush()
        return await cls.get_by_id(session, document_id)

    @classmethod
    async def update_status(
        cls,
        session: AsyncSession,
        document_id: int,
        status: DocumentStatus
    ) -> Document | None:
        stmt = (
            update(Document)
            .where(Document.id == document_id)
            .values(status=status)
        )
        await session.execute(stmt)
        await session.flush()
        return await cls.get_by_id(session, document_id)
