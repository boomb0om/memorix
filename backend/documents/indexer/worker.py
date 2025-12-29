import asyncio
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


async def index_document(document_id: int, s3_path: str, filename: str, user_id: int):
    try:
        document_bytes = await files_repository.download_file(s3_path)
    except Exception as e:
        print(f"Failed to download document {document_id} from S3: {str(e)}")
        return False
    
    extension = get_file_extension(filename)
    rag = RAGLangChain()
    
    try:
        rag.index_document(
            document_bytes=document_bytes,
            extension=extension,
            document_id=str(document_id),
            user_id=user_id
        )
        return True
    except Exception as e:
        print(f"Failed to index document {document_id}: {str(e)}")
        return False


async def process_unindexed_documents():
    async with AsyncSessionLocal() as session:
        unindexed = await DocumentDAO.get_all_unindexed(session)
        
        for document in unindexed:
            print(f"Indexing document {document.id}: {document.name}")
            
            success = await index_document(
                document.id,
                document.s3_path,
                document.filename,
                document.user_id
            )
            
            if success:
                await DocumentDAO.mark_as_indexed(session, document.id)
                await session.commit()
                print(f"Successfully indexed document {document.id}")
            else:
                print(f"Failed to index document {document.id}")


async def main():
    while True:
        try:
            await process_unindexed_documents()
        except Exception as e:
            print(f"Error in indexing worker: {str(e)}")
        
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(main())

