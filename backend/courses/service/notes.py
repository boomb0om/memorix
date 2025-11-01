from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from notes.schema.notes import NoteCreate, NoteUpdateRequest
from notes.dao.notes import NoteDAO


async def create_note(db: AsyncSession, note: NoteCreate, user_id: int):
    return await NoteDAO.create(db, note.title, note.content, user_id, note.path)


async def get_note(db: AsyncSession, note_id: int, user_id: int):
    note = await NoteDAO.get_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return note


async def get_all_notes(db: AsyncSession, user_id: int):
    return await NoteDAO.get_all_by_user(db, user_id)


async def update_note(db: AsyncSession, note_id: int, note: NoteUpdateRequest, user_id: int):
    existing_note = await NoteDAO.get_by_id(db, note_id)
    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if existing_note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return await NoteDAO.update(db, note_id, title=note.title, content=note.content, path=note.path)


async def delete_note(db: AsyncSession, note_id: int, user_id: int):
    note = await NoteDAO.get_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    await NoteDAO.delete(db, note_id)
    return {"message": "Note deleted successfully"}
