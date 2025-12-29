from pydantic_settings import BaseSettings
from pydantic import Field


class QdrantSettings(BaseSettings):
    host: str = Field(
        default="http://qdrant:6333",
        env="QDRANT_HOST"
    )
    collection: str = Field(
        default="documents",
        env="QDRANT_COLLECTION"
    )


class RAGSettings(BaseSettings):
    embedding_size: int = Field(
        default=768,
        env="RAG_EMBEDDING_SIZE"
    )
    chunk_size: int = Field(
        default=1000,
        env="RAG_CHUNK_SIZE"
    )
    chunk_overlap: int = Field(
        default=200,
        env="RAG_CHUNK_OVERLAP"
    )
    model_name: str = Field(
        default="sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
        env="RAG_MODEL_NAME"
    )


qdrant_settings = QdrantSettings()
rag_settings = RAGSettings()