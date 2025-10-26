from abc import ABC, abstractmethod
from .schema import NotesGenerateContext, Note


class BaseNotesGenerator(ABC):

    @abstractmethod
    async def generate_notes(self, user_notes: str) -> str:
        pass
