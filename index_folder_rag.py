import os
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams


def get_embedder():
    # Мультиязычный SOTA-эмбеддер
    model_name = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    return HuggingFaceEmbeddings(model_name=model_name)


def init_qdrant(collection="lectures", host="http://localhost:6333"):
    client = QdrantClient(url=host)

    if collection not in [c.name for c in client.get_collections().collections]:
        client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE)
        )
    return client


def load_documents(folder: str) -> List[Document]:
    docs = []

    for path in os.listdir(folder):
        if path.endswith(".pdf"):
            docs.extend(PyPDFLoader(os.path.join(folder, path)).load())
        elif path.endswith(".docx"):
            docs.extend(Docx2txtLoader(os.path.join(folder, path)).load())
        elif path.endswith(".txt"):
            docs.extend(TextLoader(os.path.join(folder, path), encoding="utf-8").load())

    return docs


def chunk_documents(docs: List[Document], embedder) -> List[Document]:
    # 1) Семантический чанкер
    semantic_chunker = SemanticChunker(
        embeddings=embedder,
    )

    semantically_split_docs = []
    for d in docs:
        pieces = semantic_chunker.split_text(d.page_content)
        for p in pieces:
            semantically_split_docs.append(Document(page_content=p, metadata=d.metadata))

    docs = semantically_split_docs

    # 2) Recursive character splitter — для ровных размеров и overlap
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )

    final_docs = splitter.split_documents(semantically_split_docs)
    return final_docs


def index_folder(folder: str, collection: str = "lectures"):
    embedder = get_embedder()
    client = init_qdrant(collection)

    docs = load_documents(folder)
    print(f"Loaded {len(docs)} raw documents")

    chunks = chunk_documents(docs, embedder)
    print(f"Created {len(chunks)} chunks")

    qdrant = QdrantVectorStore(
        client=client,
        collection_name=collection,
        embedding=embedder,
    )

    qdrant.add_documents(chunks)
    print("Indexing finished!")



if __name__ == "__main__":
    folder = "docs"
    index_folder(folder)
