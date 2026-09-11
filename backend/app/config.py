import os
from pathlib import Path 
from dotenv import load_dotenv
base_dir = Path(__file__).parent.resolve()
env_path = os.path.join(base_dir,"keys.env")
load_dotenv(os.path.join(base_dir,"keys.env"))
print("Base directory containing env file:",base_dir)
print("ENV file found:",env_path)
class ConfigError(Exception):
    def __init__(self,error="Config file environment issue.") -> None:
        super().__init__(error)
class Config:
    FLASK_APP=None 
    FLASK_DEBUG=None
    SECRET_KEY=None 
    JWT_SECRET_KEY=None 
    DBHOSTNAME = None
    DBDATABASE = None
    DBUSERNAME = None
    DBPASSWORD = None
    DBPORT = None
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True}

    @classmethod
    def loadvariables(cls):
        try:
            required_variables=['FLASK_APP',
                        'FLASK_DEBUG',
                        'SECRET_KEY',
                        'JWT_SECRET_KEY',
                        'DBHOSTNAME',
                        'DBDATABASE',
                        'DBUSERNAME',
                        'DBPASSWORD',
                        'DBPORT'
                        ]
            for var in required_variables:
                # if os.getenv(var) is None:
                #     raise ConfigError(error=f"{var} environment variable is not set.")
                pass        
            cls.DBHOSTNAME = os.getenv("DBHOSTNAME")
            cls.DBDATABASE = os.getenv("DBDATABASE")
            cls.DBUSERNAME = os.getenv("DBUSERNAME")
            cls.DBPASSWORD = os.getenv("DBPASSWORD")
            cls.DBPORT = os.getenv("DBPORT")

        except ConfigError as err:
            print(err)
        except Exception as err:
            print(err)

    @classmethod
    def getDBvariables(cls):
        return {
                "HOSTNAME": cls.DBHOSTNAME,
                "DATABASE": cls.DBDATABASE,
                "USERNAME": cls.DBUSERNAME,
                "PASSWORD": cls.DBPASSWORD,
                "PORT": cls.DBPORT}

class DevelopmentConfig(Config):
    DEBUG = True
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql+psycopg://', 1)
    elif db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    SQLALCHEMY_DATABASE_URI = db_url

class ProductionConfig(Config):
    DEBUG = False
    db_url = os.environ.get('DATABASE_URL', '')
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql+psycopg://', 1)
    elif db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    SQLALCHEMY_DATABASE_URI = db_url
    
    # Secure cookie settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = 'Lax'

config_by_name = dict(
    development=DevelopmentConfig,
    production=ProductionConfig
)
