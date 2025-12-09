from abc import ABC, abstractmethod
from pathlib import Path
import pdfplumber
from docx import Document


class BaseDocumentParser(ABC):
    @abstractmethod
    def parse(self, file_path: str) -> str:
        pass


class PDFParser(BaseDocumentParser):
    def parse(self, file_path: str) -> str:
        text_chunks = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_chunks.append(page_text)
        return "\n".join(text_chunks).strip()


class DOCXParser(BaseDocumentParser):
    def parse(self, file_path: str) -> str:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()


class TXTParser(BaseDocumentParser):
    def parse(self, file_path: str) -> str:
        return Path(file_path).read_text(encoding="utf-8", errors="ignore").strip()


class DocumentReader:
    def __init__(self):
        self.parsers = {
            ".pdf": PDFParser,
            ".docx": DOCXParser,
            ".txt": TXTParser,
        }

    def read(self, file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        if ext not in self.parsers:
            raise ValueError(f"Неизвестный формат файла: {ext}")
        parser = self.parsers[ext]()
        return parser.parse(file_path)
