from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PayloadType
from core.configs.rag import qdrant_settings, rag_settings


def init_qdrant():
    client = QdrantClient(url=qdrant_settings.host)
    return client


def migrate_qdrant():
    client = init_qdrant()

    if qdrant_settings.collection not in [c.name for c in client.get_collections().collections]:
        client.create_collection(
            collection_name=qdrant_settings.collection,
            vectors_config=VectorParams(size=rag_settings.embedding_size, distance=Distance.COSINE)
        )
        client.create_payload_index(
            collection_name=qdrant_settings.collection,
            field="document_id",
            payload_type=PayloadType.KEYWORD
        )


if __name__ == "__main__":
    migrate_qdrant()