from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from notes.dao.models import Note


class NoteDAO:

    @classmethod
    async def get_by_id(cls, session: AsyncSession, note_id: int) -> Note:
        result = await session.execute(select(Note).where(Note.id == note_id))
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_user(cls, session: AsyncSession, user_id: int) -> list[Note]:
        result = await session.execute(
            select(Note).where(Note.user_id == user_id).order_by(Note.path)
        )
        return result.scalars().all()

    @classmethod
    async def create(cls, session: AsyncSession, title: str, content: str, user_id: int, path: str) -> Note:
        db_note = Note(title=title, content=content, user_id=user_id, path=path)
        session.add(db_note)
        await session.commit()
        await session.refresh(db_note)
        return db_note

    @classmethod
    async def update(cls, session: AsyncSession, note_id: int, **kwargs) -> Note:
        stmt = update(Note).where(Note.id == note_id).values(**kwargs)
        await session.execute(stmt)
        await session.commit()
        return await cls.get_by_id(session, note_id)

    @classmethod
    async def delete(cls, session: AsyncSession, note_id: int) -> bool:
        stmt = delete(Note).where(Note.id == note_id)
        await session.execute(stmt)
        await session.commit()
        return True