import pymupdf # type: ignore

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Ingests a PDF document and extracts all text content.
    This will be used by the Librarian Agent for deconstruction.
    """
    try:
        doc = pymupdf.open(pdf_path)
        full_text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            full_text += page.get_text("text") + "\n"
        return full_text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

if __name__ == "__main__":
    # Quick test if run directly
    sample_path = "../Agentic RFQ System README.pdf"
    print(extract_text_from_pdf(sample_path)[:500]) # type: ignore
