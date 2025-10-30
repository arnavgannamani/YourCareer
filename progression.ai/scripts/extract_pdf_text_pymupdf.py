#!/usr/bin/env python3
import sys

try:
    import fitz  # PyMuPDF
except Exception:
    sys.stderr.write("PyMuPDF not installed. Install with: pip install pymupdf\n")
    sys.exit(2)

def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: extract_pdf_text_pymupdf.py <pdf_path>\n")
        sys.exit(2)
    path = sys.argv[1]
    try:
        doc = fitz.open(path)
        texts = []
        for page in doc:
            texts.append(page.get_text("text"))
        print("\n".join(texts))
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()


