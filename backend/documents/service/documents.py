import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from documents.dao import DocumentDAO
from documents.schema import DocumentCreate, DocumentResponse
from core.files import files_repository
from core.configs.deployment import deployment_settings


def get_file_extension(filename: str) -> str:
    return filename.split('.')[-1].lower() if '.' in filename else ''


def get_s3_path(filename: str) -> str:
    return f"{deployment_settings.environment}/documents/{filename}"


async def upload_document(
    db: AsyncSession,
    file: UploadFile,
    document_data: DocumentCreate,
    user_id: int
) -> DocumentResponse:
    file_extension = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    s3_path = get_s3_path(unique_filename)
    
    file_content = await file.read()
    await files_repository.upload_file(file_content, s3_path)
    
    db_document = await DocumentDAO.create(
        db,
        filename=file.filename,
        name=document_data.name,
        s3_path=s3_path,
        user_id=user_id
    )
    await db.commit()
    
    return DocumentResponse.model_validate(db_document)


async def get_document(
    db: AsyncSession,
    document_id: int,
    user_id: int
) -> DocumentResponse:
    document = await DocumentDAO.get_by_id_and_user(db, document_id, user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


async def get_all_documents(
    db: AsyncSession,
    user_id: int
) -> list[DocumentResponse]:
    documents = await DocumentDAO.get_all_by_user(db, user_id)
    return [DocumentResponse.model_validate(doc) for doc in documents]

