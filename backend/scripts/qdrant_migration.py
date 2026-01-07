import sys
import time
from pathlib import Path

# Add parent directory to path to allow imports from core
sys.path.insert(0, str(Path(__file__).parent.parent))

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PayloadSchemaType
from loguru import logger
from core.configs.rag import qdrant_settings, rag_settings


def wait_for_qdrant(max_retries=30, delay=2):
    """Wait for Qdrant to be ready"""
    for attempt in range(max_retries):
        try:
            client = QdrantClient(url=qdrant_settings.host)
            client.get_collections()
            logger.info(f"Qdrant is ready after {attempt + 1} attempts")
            return client
        except Exception as e:
            if attempt < max_retries - 1:
                logger.info(f"Waiting for Qdrant... (attempt {attempt + 1}/{max_retries}): {e}")
                time.sleep(delay)
            else:
                raise Exception(f"Qdrant is not available after {max_retries} attempts")


def migrate_qdrant():
    logger.info("Starting Qdrant migration...")
    client = wait_for_qdrant()

    collections = [c.name for c in client.get_collections().collections]
    logger.info(f"Existing collections: {collections}")

    if qdrant_settings.collection not in collections:
        logger.info(f"Creating collection: {qdrant_settings.collection}")
        client.create_collection(
            collection_name=qdrant_settings.collection,
            vectors_config=VectorParams(size=rag_settings.embedding_size, distance=Distance.COSINE)
        )
        try:
            client.create_payload_index(
                collection_name=qdrant_settings.collection,
                field_name="document_id",
                field_schema=PayloadSchemaType.KEYWORD
            )
        except Exception as e:
            logger.warning(f"Warning: Could not create payload index (may already exist): {e}")
        logger.info(f"Collection {qdrant_settings.collection} created successfully")
    else:
        logger.info(f"Collection {qdrant_settings.collection} already exists")


if __name__ == "__main__":
    migrate_qdrant()