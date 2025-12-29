from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Literal


@dataclass(slots=True)
class DocumentChunk:
    id: str
    document_id: str
    content: str
    embedding: list[float] | None = None
    metadata: dict[str, Any] | None = None


DocumentExtension = Literal["pdf", "txt", "doc", "docx", "md"]


class RAGBase(ABC):

    @abstractmethod
    def index_document(
        self,
        document_bytes: bytes,
        extension: DocumentExtension,
        document_id: str | None = None,
        user_id: int | None = None,
    ) -> bool:
        pass

    @abstractmethod
    def search(self, query: str, k: int, document_id: str | None = None) -> list[DocumentChunk]:
        pass
