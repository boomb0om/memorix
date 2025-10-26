from abc import ABC, abstractmethod
from .schema import TestGenerateContext, BaseQuestion


class BaseTestsGenerator(ABC):

    @abstractmethod
    async def generate_test(self, context: TestGenerateContext) -> list[BaseQuestion]:
        pass
