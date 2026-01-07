from fastapi import APIRouter, Depends, UploadFile, File, Form, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from documents.schema import DocumentResponse, DocumentCreate
from documents.service import upload_document, get_document, get_all_documents
from core.configs.backend import backend_settings


router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > backend_settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size: {backend_settings.max_file_size / (1024 * 1024):.2f}MB. Your file size: {file_size / (1024 * 1024):.2f}MB"
        )
    
    return await upload_document(db, file, DocumentCreate(name=name), request.state.user_id, file_content=file_content)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    user_id = request.state.user_id
    return await get_all_documents(db, user_id)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_by_id(
    document_id: int,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    user_id = request.state.user_id
    return await get_document(db, document_id, user_id)

