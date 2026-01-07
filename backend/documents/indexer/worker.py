import asyncio
from loguru import logger
from core.db.sqlalchemy import AsyncSessionLocal
from documents.dao import DocumentDAO
from core.llm.rag.langchain_qdrant import RAGLangChain
from core.llm.rag.base import DocumentExtension
from core.files import files_repository


def get_file_extension(filename: str) -> DocumentExtension:
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    if ext in ["pdf", "txt", "doc", "docx", "md"]:
        return ext
    return "txt"


async def wait_for_qdrant(max_retries: int = 10, delay: int = 5):
    """Ожидание доступности Qdrant перед началом работы"""
    from qdrant_client import QdrantClient
    from core.configs.rag import qdrant_settings
    
    for attempt in range(max_retries):
        try:
            client = QdrantClient(url=qdrant_settings.host)
            # Проверяем доступность через получение списка коллекций
            client.get_collections()
            logger.info("Qdrant is available")
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                logger.info(f"Waiting for Qdrant... (attempt {attempt + 1}/{max_retries}): {str(e)}")
                await asyncio.sleep(delay)
            else:
                logger.exception(f"Failed to connect to Qdrant after {max_retries} attempts: {str(e)}")
                return False
    return False


async def index_document(document_id: int, s3_path: str, filename: str, user_id: int):
    try:
        document_bytes = await files_repository.download_file(s3_path)
    except Exception as e:
        logger.exception(f"Failed to download document {document_id} from S3: {str(e)}")
        return False
    
    extension = get_file_extension(filename)
    
    try:
        rag = RAGLangChain()
    except Exception as e:
        logger.exception(f"Failed to initialize RAG client for document {document_id}: {str(e)}")
        return False
    
    try:
        rag.index_document(
            document_bytes=document_bytes,
            extension=extension,
            document_id=str(document_id),
            user_id=user_id
        )
        return True
    except Exception as e:
        logger.exception(f"Failed to index document {document_id}: {str(e)}")
        return False


async def process_unindexed_documents():
    async with AsyncSessionLocal() as session:
        unindexed = await DocumentDAO.get_all_unindexed(session)
        
        for document in unindexed:
            logger.info(f"Indexing document {document.id}: {document.name}")
            
            success = await index_document(
                document.id,
                document.s3_path,
                document.filename,
                document.user_id
            )
            
            if success:
                await DocumentDAO.mark_as_indexed(session, document.id)
                await session.commit()
                logger.info(f"Successfully indexed document {document.id}")
            else:
                logger.exception(f"Failed to index document {document.id}")


async def main():
    # Ждем доступности Qdrant перед началом работы
    if not await wait_for_qdrant():
        logger.error("Cannot start indexing worker: Qdrant is not available")
        return
    
    while True:
        try:
            await process_unindexed_documents()
        except Exception as e:
            logger.exception(f"Error in indexing worker: {str(e)}")
        
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(main())

