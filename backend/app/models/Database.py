from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Float, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import uuid
from urllib.parse import quote_plus

from datetime import datetime,UTC
import os, sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config 

#Now load the variables first.
DATABASEURL = ""
Config.loadvariables()
dbvar=Config.getDBvariables()    

DATABASEURL = fr"postgresql://{dbvar['USERNAME']}:{dbvar['PASSWORD']}@{dbvar['HOSTNAME']}:{dbvar['PORT']}/{dbvar['DATABASE']}"

#Now check if the database exists or not if not, create it.
#To do, we need to connect to the default 'postgres' database first, then check if our target database exists, and create it if it doesn't. This is because you cannot connect to a database that doesn't exist yet. 
try:
    conn = psycopg2.connect(
        host=dbvar['HOSTNAME'],
        port=dbvar['PORT'],
        user=dbvar['USERNAME'],
        password=dbvar['PASSWORD'],
        dbname='postgres') 

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    #This code is only for development environment. NOT in production
    with conn.cursor() as cursor: 
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname='{dbvar['DATABASE']}'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f'CREATE DATABASE "{dbvar["DATABASE"]}"')
            print(f"Database '{dbvar['DATABASE']}' created successfully.")
        else:
            print(f"Database '{dbvar['DATABASE']}' already exists.")
        print("Loop executed")

except psycopg2.OperationalError as e:
        print(f"Error occurred: {e}")

# 1. Create the SQLAlchemy Engine
engine = create_engine(DATABASEURL)

# 2. Create a SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base class for your models
Base = declarative_base()

def create_tables():
    try: 
        Base.metadata.create_all(bind=engine)
    except Exception as e:
         print(e)

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    