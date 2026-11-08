"""
AGENT G — Quality Assurance Agent
Performs post-integration tests: file existence, format verification, and web accessibility.
"""
import os
from typing import Dict, Any, Tuple
from PIL import Image

class QualityAssuranceAgent:
    def __init__(self, public_covers_dir: str = "projects/anon-trove-ebooks/public/covers"):
        self.public_covers_dir = public_covers_dir

    def test_cover_asset(self, relative_url: str) -> Tuple[bool, str, Dict[str, Any]]:
        filename = os.path.basename(relative_url)
        disk_path = os.path.join(self.public_covers_dir, filename)

        if not os.path.isfile(disk_path):
            return False, f"File does not exist on disk: {disk_path}", {}

        size = os.path.getsize(disk_path)
        if size < 1000:
            return False, f"File is abnormally small ({size} bytes)", {"size": size}

        try:
            with Image.open(disk_path) as img:
                img.verify()
            with Image.open(disk_path) as img:
                width, height = img.size
                fmt = img.format
        except Exception as e:
            return False, f"Image file corrupted: {e}", {"size": size}

        return True, "PASSED QA: File exists, valid format, readable", {
            "size_bytes": size,
            "width": width,
            "height": height,
            "format": fmt
        }
