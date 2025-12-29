import uuid
import tempfile

from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient

from core.configs.rag import qdrant_settings, rag_settings
from .base import RAGBase, DocumentChunk, DocumentExtension


class RAGLangChain(RAGBase):
    
    def __init__(self):
        self.embedder = self._get_embedder()
        self.client = self._init_qdrant_client()
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=qdrant_settings.collection,
            embedding=self.embedder,
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=rag_settings.chunk_size,
            chunk_overlap=rag_settings.chunk_overlap,
            length_function=len,
        )
    
    def _get_embedder(self) -> HuggingFaceEmbeddings:
        model_name = rag_settings.model_name
        return HuggingFaceEmbeddings(model_name=model_name)
    
    def _init_qdrant_client(self) -> QdrantClient:
        return QdrantClient(url=qdrant_settings.host)
    
    def _get_loader(self, file_path: str, extension: DocumentExtension):
        loaders = {
            "pdf": PyPDFLoader,
            "txt": TextLoader,
            "doc": Docx2txtLoader,
            "docx": Docx2txtLoader,
            "md": TextLoader,
        }
        loader_class = loaders.get(extension, TextLoader)
        return loader_class(file_path)
    
    def index_document(
        self,
        document_bytes: bytes,
        extension: DocumentExtension,
        document_id: str | None = None,
        user_id: int | None = None,
    ) -> bool:
        if document_id is None:
            document_id = str(uuid.uuid4())
        
        with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=True) as tmp_file:
            tmp_file.write(document_bytes)
            tmp_file.flush()
            
            loader = self._get_loader(tmp_file.name, extension)
            documents = loader.load()
        
        chunks = self.text_splitter.split_documents(documents)
        
        for chunk in chunks:
            if document_id is not None:
                chunk.metadata["document_id"] = str(document_id)
            if user_id is not None:
                chunk.metadata["user_id"] = user_id
        
        self.vector_store.add_documents(chunks)
        return True
    
    def search(self, query: str, k: int = 10, document_id: str | None = None) -> list[DocumentChunk]:
        if document_id:
            filter_dict = {
                "must": [
                    {
                        "key": "document_id",
                        "match": {
                            "value": document_id
                        }
                    }
                ]
            }
            docs = self.vector_store.similarity_search(
                query, 
                k=k,
                filter=filter_dict
            )
        else:
            docs = self.vector_store.similarity_search(query, k=k)
        
        chunks = []
        for doc in docs:
            chunk = DocumentChunk(
                id=doc.metadata.get("_id", str(uuid.uuid4())),
                document_id=doc.metadata.get("document_id", ""),
                content=doc.page_content,
                metadata=doc.metadata
            )
            chunks.append(chunk)
        
        return chunks
