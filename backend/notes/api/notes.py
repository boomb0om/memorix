from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from notes.schema.notes import NoteCreate, NoteResponse, NoteUpdateRequest, NoteListResponse

import notes.service.notes as note_service


router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse)
async def create_note(note: NoteCreate, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.state.user_id
    return await note_service.create_note(db, note, user_id)


@router.get("", response_model=NoteListResponse)
async def get_all_notes(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.state.user_id
    notes = await note_service.get_all_notes(db, user_id)
    return NoteListResponse(notes=[NoteResponse(
        id=note.id,
        path=note.path,
        title=note.title,
        content=note.content
    ) for note in notes])


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.state.user_id
    return await note_service.get_note(db, note_id, user_id)


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, note: NoteUpdateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.state.user_id
    return await note_service.update_note(db, note_id, note, user_id)


@router.delete("/{note_id}")
async def delete_note(note_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.state.user_id
    return await note_service.delete_note(db, note_id, user_id)
