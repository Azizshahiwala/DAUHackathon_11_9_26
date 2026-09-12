import os
from pathlib import Path 
from dotenv import load_dotenv
base_dir = Path(__file__).parent.resolve()
env_path = os.path.join(base_dir,"keys.env")
load_dotenv(os.path.join(base_dir,"keys.env"))
DATABASEURL = ""
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
                        'DBPORT',
                        'FLASK_ENV'
                        ]
            for var in required_variables:
                if os.getenv(var) is None:
                    raise ConfigError(error=f"{var} environment variable is not set.")
                      
            cls.DBHOSTNAME = os.getenv("DBHOSTNAME")
            cls.DBDATABASE = os.getenv("DBDATABASE")
            cls.DBUSERNAME = os.getenv("DBUSERNAME")
            cls.DBPASSWORD = os.getenv("DBPASSWORD")
            cls.DBPORT = os.getenv("DBPORT")
            cls.FLASK_ENV = os.getenv("FLASK_ENV")
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

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = None
    DEBUG = False
    
    # Secure cookie settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = 'Lax'

def build_db_url():
    try:
        Config.loadvariables()
        dbvar = Config.getDBvariables()
        if dbvar.get('HOSTNAME') and dbvar.get('USERNAME') and dbvar.get('DATABASE'):
            DATABASEURL = fr"postgresql://{dbvar['USERNAME']}:{dbvar['PASSWORD']}@{dbvar['HOSTNAME']}:{dbvar['PORT']}/{dbvar['DATABASE']}"
            return DATABASEURL
        
        # If variables are missing, fallback to SQLite for dev or empty string for prod
        return ""
    except Exception as e:
        print(e)

DevelopmentConfig.SQLALCHEMY_DATABASE_URI = build_db_url() or 'sqlite:///dev.db'
ProductionConfig.SQLALCHEMY_DATABASE_URI = build_db_url()

config_by_name = dict(
    development=DevelopmentConfig,
    production=ProductionConfig
)
