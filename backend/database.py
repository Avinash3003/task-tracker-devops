import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Load the local environment variables from .env.dev if present
# By default, load_dotenv will NOT overwrite any existing environment variables,
# meaning that Docker Compose environment variables will correctly take precedence in production!
load_dotenv(".env.dev")

# Get connection string from environment variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("CRITICAL ERROR: DATABASE_URL environment variable is not set! Check your .env.dev file or Docker environment.")

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
