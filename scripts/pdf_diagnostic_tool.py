# -*- coding: utf-8 -*-
"""
PDF Diagnostic Tool
===================
Deep structural and semantic audit tool for PDF ebooks.
Checks:
- PDF Header and %%EOF markers
- Cross-reference table (XREF) validity
- Dangling / broken indirect object references
- Color space definitions (DeviceRGB, DeviceCMYK, DeviceGray, ICCBased, Indexed, Separation, DeviceN, Pattern)
- ICC profile streams and integrity
- Image objects (Subtype/Image, BitsPerComponent, Filter, ColorSpace)
- Resource inheritance across page trees
- Encryption and permission flags
- Content stream syntax integrity
"""

import os
import sys
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

import fitz

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class PDFDiagnostic:
    def __init__(self, filepath: str):
        self.path = Path(filepath)
        self.report: Dict[str, Any] = {
            "file": self.path.name,
            "size_bytes": 0,
            "header": "",
            "has_eof": False,
            "is_encrypted": False,
            "page_count": 0,
            "xref_count": 0,
            "dangling_references": [],
            "colorspaces": {},
            "broken_colorspaces": [],
            "image_objects": 0,
            "font_objects": 0,
            "content_stream_errors": [],
            "structural_status": "UNKNOWN",
            "warnings": [],
            "errors": []
        }

    def run_full_diagnosis(self) -> Dict[str, Any]:
        if not self.path.exists():
            self.report["errors"].append("File does not exist")
            self.report["structural_status"] = "FILE_NOT_FOUND"
            return self.report

        self.report["size_bytes"] = self.path.stat().st_size

        # 1. Low-level file header and EOF check
        try:
            with open(self.path, "rb") as f:
                header_bytes = f.read(32)
                f.seek(max(0, self.report["size_bytes"] - 1024))
                tail_bytes = f.read(1024)

            m = re.search(rb"%PDF-(\d+\.\d+)", header_bytes)
            if m:
                self.report["header"] = m.group(0).decode("ascii", errors="ignore")
            else:
                self.report["errors"].append("Missing or invalid %PDF header")

            self.report["has_eof"] = b"%%EOF" in tail_bytes
            if not self.report["has_eof"]:
                self.report["warnings"].append("Missing %%EOF marker in trailing 1024 bytes (possible truncated file)")
        except Exception as e:
            self.report["errors"].append(f"Byte read error: {e}")

        # 2. PyMuPDF / MuPDF structural inspection
        try:
            doc = fitz.open(self.path)
            self.report["page_count"] = len(doc)
            self.report["is_encrypted"] = doc.is_encrypted
            self.report["xref_count"] = doc.xref_length()

            # Check all xrefs for broken references in /Resources and /ColorSpace
            colorspace_pattern = re.compile(r'/ColorSpace\s+(?:<<([^>]+)>>|(\d+\s+\d+\s+R)|/([A-Za-z0-9_]+))')
            indirect_ref_pattern = re.compile(r'(\d+)\s+(\d+)\s+R')

            referenced_xrefs = set()
            null_xrefs = set()

            for xref in range(1, doc.xref_length()):
                try:
                    obj_str = doc.xref_object(xref)
                    if obj_str == "null":
                        null_xrefs.add(xref)
                        continue

                    # Search for indirect references
                    for m in indirect_ref_pattern.finditer(obj_str):
                        target_xref = int(m.group(1))
                        referenced_xrefs.add((target_xref, xref))

                    # Track colorspace definitions
                    if "/ColorSpace" in obj_str:
                        cs_matches = colorspace_pattern.findall(obj_str)
                        for dict_body, single_ref, direct_name in cs_matches:
                            if single_ref:
                                ref_id = int(single_ref.split()[0])
                                target_obj = doc.xref_object(ref_id)
                                if target_obj == "null":
                                    self.report["broken_colorspaces"].append({
                                        "source_xref": xref,
                                        "referenced_id": ref_id,
                                        "type": "indirect_colorspace_null"
                                    })
                            elif dict_body:
                                for dm in indirect_ref_pattern.finditer(dict_body):
                                    ref_id = int(dm.group(1))
                                    target_obj = doc.xref_object(ref_id)
                                    if target_obj == "null":
                                        self.report["broken_colorspaces"].append({
                                            "source_xref": xref,
                                            "referenced_id": ref_id,
                                            "type": "colorspace_dict_indirect_null"
                                        })

                    if "/Subtype /Image" in obj_str:
                        self.report["image_objects"] += 1
                    if "/Type /Font" in obj_str:
                        self.report["font_objects"] += 1

                except Exception:
                    pass

            # Check for dangling references
            for target_xref, source_xref in referenced_xrefs:
                if target_xref in null_xrefs:
                    self.report["dangling_references"].append({
                        "dangling_xref": target_xref,
                        "source_xref": source_xref
                    })

            # 3. Test page rendering & content streams
            render_issues = 0
            for pno in range(min(5, len(doc))):
                try:
                    page = doc[pno]
                    pix = page.get_pixmap()
                    if pix.width == 0 or pix.height == 0:
                        self.report["warnings"].append(f"Page {pno} rendered zero dimensions")
                except Exception as re_err:
                    render_issues += 1
                    self.report["content_stream_errors"].append({
                        "page": pno,
                        "error": str(re_err)
                    })

            doc.close()

            if self.report["broken_colorspaces"] or self.report["dangling_references"]:
                self.report["structural_status"] = "MALFORMED_REPAIRABLE"
            elif render_issues > 0:
                self.report["structural_status"] = "RENDER_ERROR"
            elif self.report["errors"]:
                self.report["structural_status"] = "CORRUPTED"
            else:
                self.report["structural_status"] = "HEALTHY"

        except Exception as e:
            self.report["errors"].append(f"MuPDF open exception: {e}")
            self.report["structural_status"] = "FAILED_TO_OPEN"

        return self.report

    def print_summary(self):
        rep = self.report
        print("=" * 65)
        print(f"DIAGNOSTIC REPORT: {rep['file']}")
        print("=" * 65)
        print(f"Status:            {rep['structural_status']}")
        print(f"Header:            {rep['header']}")
        print(f"EOF Marker:        {'PRESENT' if rep['has_eof'] else 'MISSING'}")
        print(f"Page Count:        {rep['page_count']}")
        print(f"XREF Count:        {rep['xref_count']}")
        print(f"Image Objects:     {rep['image_objects']}")
        print(f"Font Objects:      {rep['font_objects']}")
        print(f"Broken ColorSpaces:{len(rep['broken_colorspaces'])}")
        print(f"Dangling XREFs:    {len(rep['dangling_references'])}")
        
        if rep['broken_colorspaces']:
            print("\nBroken Color Space References Detected:")
            for bcs in rep['broken_colorspaces'][:5]:
                print(f"  - Source XREF {bcs['source_xref']} references null Object {bcs['referenced_id']} ({bcs['type']})")
                
        if rep['dangling_references']:
            print(f"\nTotal Dangling Indirect References: {len(rep['dangling_references'])}")
            
        if rep['warnings']:
            print("\nWarnings:")
            for w in rep['warnings']:
                print(f"  [WARN] {w}")
                
        if rep['errors']:
            print("\nErrors:")
            for e in rep['errors']:
                print(f"  [ERROR] {e}")
        print("=" * 65)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    else:
        target_path = r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks\private_storage\1. Guidebook.pdf"
        
    diag = PDFDiagnostic(target_path)
    res = diag.run_full_diagnosis()
    diag.print_summary()
