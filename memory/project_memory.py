from langchain_chroma import Chroma # type: ignore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader # type: ignore
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb # type: ignore
import os
from dotenv import load_dotenv # type: ignore

load_dotenv()

def get_vector_store() -> Chroma:
    """
    Initializes and returns the Chroma VectorStore for the RAG agents.
    This acts as the "Company History" and "Policy" memory bank.
    """
    # Ensure directory exists
    db_path = os.getenv("CHROMA_DB_PATH", "./memory/chroma_db")
    os.makedirs(db_path, exist_ok=True)
    
    # We use Google's embedding model to match our Gemini agents
    # Explicitly pass the API key to avoid pydantic validation errors
    api_key = os.getenv("GOOGLE_API_KEY")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key
    )
    
    # Initialize the Chroma DB
    persistent_client = chromadb.PersistentClient(path=db_path)
    
    vector_store = Chroma(
        client=persistent_client,
        collection_name="enterprise_history",
        embedding_function=embeddings,
    )
    
    return vector_store

def ingest_pdf_to_memory(pdf_path: str):
    """
    Utility to read a real PDF Knowledge Base, chunk it, and embed it into ChromaDB.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return
        
    print(f"Ingesting Knowledge Base from: {pdf_path}...")
    
    # 1. Load the PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"Loaded {len(documents)} pages.")
    
    # 2. Split the text into manageable chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    docs = text_splitter.split_documents(documents)
    print(f"Split into {len(docs)} text chunks.")
    
    # 3. Embed and Store
    store = get_vector_store()
    
    # We add metadata identifying the source so the LLM knows where it came from
    for doc in docs:
        if "source" not in doc.metadata:
             doc.metadata["source"] = pdf_path
             
    store.add_documents(docs)
    print("✅ Ingestion Complete. Data embedded into ChromaDB.")

def clear_database():
    """Utility to wipe the DB clean before a fresh ingestion."""
    db_path = os.getenv("CHROMA_DB_PATH", "./memory/chroma_db")
    persistent_client = chromadb.PersistentClient(path=db_path)
    try:
        persistent_client.delete_collection("enterprise_history")
        print("Cleared old database collection.")
    except BaseException:
        pass


if __name__ == "__main__":
    # Wipe the old mock data
    clear_database()
    
    # Ingest the real Corporate Knowledge Base we just generated
    kb_path = "../Company_Knowledge_Base.pdf" 
    # adjust path if testing locally inside the folder vs project root.
    if not os.path.exists(kb_path):
         kb_path = "Company_Knowledge_Base.pdf"
         
    ingest_pdf_to_memory(kb_path)
    
    # Test retrieval
    print("\n--- Testing Retrieval ---")
    store = get_vector_store()
    results = store.similarity_search("What is our policy on Aluminum?", k=2)
    for i, res in enumerate(results):
         print(f"Result {i+1}: {res.page_content}\n")
