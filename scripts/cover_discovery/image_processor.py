"""
Advanced Image Processing & Perceptual Hashing Engine
Provides image validation, geometry checks, aspect ratio filtering, duplicate detection, and format optimization.
"""
import io
import math
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageStat
import numpy as np
from scipy.fftpack import dct

class ImageProcessor:
    def __init__(self, min_width: int = 240, min_height: int = 340, target_max_width: int = 800):
        self.min_width = min_width
        self.min_height = min_height
        self.target_max_width = target_max_width
        # Known placeholder hashes (Google Books blank, Open Library missing, 1x1 transparent)
        self.known_placeholder_hashes = set()

    def validate_and_inspect(self, raw_bytes: bytes) -> Tuple[bool, Optional[Image.Image], str, Dict[str, Any]]:
        """
        Validates raw image bytes: format, dimensions, entropy, aspect ratio.
        Returns: (is_valid, image_obj, failure_reason, metrics)
        """
        if not raw_bytes or len(raw_bytes) < 1200:
            return False, None, "File too small (< 1.2KB) or empty", {}

        try:
            img = Image.open(io.BytesIO(raw_bytes))
            img.load()  # Ensure entire raster is decoded
        except Exception as e:
            return False, None, f"Corrupted or invalid image raster: {e}", {}

        width, height = img.size
        metrics = {
            "width": width,
            "height": height,
            "format": img.format or "UNKNOWN",
            "mode": img.mode,
            "byte_size": len(raw_bytes)
        }

        # 1. Dimension validation
        if width < self.min_width or height < self.min_height:
            return False, img, f"Resolution below minimum threshold: {width}x{height} < {self.min_width}x{self.min_height}", metrics

        # 2. Aspect Ratio Check (Standard portrait book cover: width / height is approx 0.52 to 0.82)
        aspect_ratio = width / height
        metrics["aspect_ratio"] = round(aspect_ratio, 3)

        if aspect_ratio < 0.45:
            return False, img, f"Image too tall/skinny for book cover (aspect ratio: {aspect_ratio:.2f})", metrics

        if aspect_ratio > 0.95:
            # Over 0.95 is either square or landscape (banners, slides), not standard book portrait
            return False, img, f"Image too wide/landscape for standard portrait book cover (aspect ratio: {aspect_ratio:.2f})", metrics

        # 3. Entropy & Color Variance Check (Rejects blank, solid color, or monochrome placeholders)
        stat = ImageStat.Stat(img.convert('L'))
        stddev = stat.stddev[0]
        metrics["stddev_entropy"] = round(stddev, 2)

        if stddev < 10.0:
            return False, img, f"Extremely low color variance (stddev: {stddev:.1f}) - likely a blank/solid placeholder", metrics

        return True, img, "Valid Book Cover", metrics

    def compute_phash(self, img: Image.Image, hash_size: int = 8, highfreq_factor: int = 4) -> str:
        """
        Compute Perceptual Hash (pHash) using discrete cosine transform (DCT).
        Robust against scaling, minor compression, and watermarks.
        """
        img_gray = img.convert('L').resize(
            (hash_size * highfreq_factor, hash_size * highfreq_factor),
            Image.Resampling.LANCZOS
        )
        pixels = np.asarray(img_gray, dtype=float)
        dct_vals = dct(dct(pixels, axis=0), axis=1)
        dctlowfreq = dct_vals[:hash_size, :hash_size]
        med = np.median(dctlowfreq)
        diff = dctlowfreq > med
        # Convert boolean 8x8 matrix to 64-bit hex string
        return "".join(f"{int(''.join(row.astype(int).astype(str)), 2):02x}" for row in diff)

    def compute_dhash(self, img: Image.Image, hash_size: int = 8) -> str:
        """
        Compute Difference Hash (dHash) tracking horizontal luminance gradients.
        """
        img_gray = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        pixels = np.asarray(img_gray, dtype=int)
        diff = pixels[:, 1:] > pixels[:, :-1]
        return "".join(f"{int(''.join(row.astype(int).astype(str)), 2):02x}" for row in diff)

    def hamming_distance(self, hash1: str, hash2: str) -> int:
        """Calculate bit differences between two hex hashes (0 = identical)."""
        if len(hash1) != len(hash2):
            return 999
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        xor = val1 ^ val2
        return bin(xor).count('1')

    def optimize_for_web(self, img: Image.Image, quality: int = 88) -> bytes:
        """
        Normalizes and compresses cover to optimized WebP or JPEG for storefront fast delivery.
        """
        # Convert RGBA/P to RGB for standard JPEG/WebP
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if width exceeds target_max_width
        width, height = img.size
        if width > self.target_max_width:
            new_height = int(height * (self.target_max_width / width))
            img = img.resize((self.target_max_width, new_height), Image.Resampling.LANCZOS)

        output_io = io.BytesIO()
        img.save(output_io, format='JPEG', quality=quality, optimize=True)
        return output_io.getvalue()
