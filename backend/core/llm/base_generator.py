from abc import ABC, abstractmethod


class BaseLLMGenerator(ABC):

    @abstractmethod
    async def generate_notes(self, user_notes: str) -> str:
        pass

    @abstractmethod
    async def generate_test(self, notes: str) -> str:
        pass
