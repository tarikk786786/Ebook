"""
Embedded PDF Cover Extractor Provider
Uses PyMuPDF (fitz) to extract high-resolution cover art directly from the first page of PDF files.
"""
import os
import io
from typing import Optional, List
import fitz  # PyMuPDF
from PIL import Image
from .base_provider import BaseCoverProvider, CoverCandidate

class EmbeddedPdfProvider(BaseCoverProvider):
    def __init__(self, search_directories: Optional[List[str]] = None):
        super().__init__(name="EmbeddedPdfExtractor", timeout=5, rate_limit_delay=0.0)
        self.search_directories = search_directories or [
            "downloads",
            "data",
            "private_storage",
            "projects/anon-trove-ebooks/public/previews"
        ]

    def _find_matching_file(self, file_name: Optional[str], title: str) -> Optional[str]:
        # Check explicit file name first
        if file_name:
            for root_dir in self.search_directories:
                candidate = os.path.join(root_dir, file_name)
                if os.path.isfile(candidate):
                    return candidate

        return None

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        # Abstract search delegates to file matching when local file is known
        return []

    def extract_from_file_path(self, file_path: str, title: str) -> Optional[CoverCandidate]:
        """Direct extraction when a physical file is available."""
        if not os.path.isfile(file_path):
            return None

        try:
            doc = fitz.open(file_path)
            if len(doc) == 0:
                doc.close()
                return None

            # Render Page 0 at 200 DPI
            page = doc[0]
            zoom = 2.0  # ~144-200 DPI
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            img_bytes = pix.tobytes("jpeg")
            doc.close()

            if len(img_bytes) > 5000:
                return CoverCandidate(
                    source=self.name,
                    image_url=f"file:///{os.path.abspath(file_path)}#page=1",
                    source_url="Local Document Archive",
                    rights_type="EMBEDDED_ORIGINAL",
                    attribution="Original Embedded Document Cover (Page 1)",
                    provider_confidence=0.99,
                    image_bytes=img_bytes,
                    width=pix.width,
                    height=pix.height,
                    format="JPEG",
                    metadata={"file_path": file_path, "dpi": 150}
                )
        except Exception as e:
            self.logger.warning(f"Failed to extract cover from {file_path}: {e}")

        return None

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        if candidate.image_bytes:
            return candidate.image_bytes
        return None
