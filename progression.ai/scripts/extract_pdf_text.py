#!/usr/bin/env python3
import sys

try:
    from pdfminer.high_level import extract_text
except Exception as e:
    sys.stderr.write("pdfminer.six not installed. Install with: pip install pdfminer.six\n")
    sys.exit(2)

def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: extract_pdf_text.py <pdf_path>\n")
        sys.exit(2)
    path = sys.argv[1]
    try:
        text = extract_text(path) or ""
        print(text)
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()


