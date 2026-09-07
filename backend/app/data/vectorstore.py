"""
Builds a small local vector database (Chroma) from the text files in app/docs/,
so the agent can retrieve relevant knowledge to answer questions.
"""

import logging
import os

os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")  # silence Chroma's posthog telemetry errors

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")

# Free, local embedding model (downloads once, then runs on CPU - no API key needed)
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def build_vectorstore():
    """
    Loads every .txt file in app/docs/, splits it into chunks, embeds the chunks,
    and returns a Chroma vector store ready for similarity search.
    """
    documents = []
    for filename in os.listdir(DOCS_DIR):
        if filename.endswith(".txt"):
            path = os.path.join(DOCS_DIR, filename)
            loader = TextLoader(path, encoding="utf-8")
            documents.extend(loader.load())

    logger.info("Building vectorstore from %d document(s) in %s", len(documents), DOCS_DIR)

    splitter = CharacterTextSplitter(separator="\n\n", chunk_size=300, chunk_overlap=0)
    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    vectorstore = Chroma.from_documents(chunks, embeddings)
    logger.info("Vectorstore ready (%d chunk(s) embedded)", len(chunks))
    return vectorstore


def get_retriever(k: int = 3):
    """Returns a retriever that fetches the top-k most relevant chunks for a query."""
    vectorstore = build_vectorstore()
    return vectorstore.as_retriever(search_kwargs={"k": k})
