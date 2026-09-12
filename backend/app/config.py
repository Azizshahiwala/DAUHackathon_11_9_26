import os
from pathlib import Path
from dotenv import load_dotenv

base_dir = Path(__file__).parent.resolve()
env_path = os.path.join(base_dir, "keys.env")
load_dotenv(env_path)

DATABASEURL = ""


class ConfigError(Exception):
    def __init__(self, error="Config file environment issue.") -> None:
        super().__init__(error)


class Config:
    FLASK_APP = None
    FLASK_DEBUG = None
    SECRET_KEY = None
    JWT_SECRET_KEY = None
    DBHOSTNAME = None
    DBDATABASE = None
    DBUSERNAME = None
    DBPASSWORD = None
    DBPORT = None
    FLASK_ENV = None
    OPENMETEO_API = None
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    @classmethod
    def loadvariables(cls):
        """Validate all required env vars and populate class attributes.

        Raises ConfigError if any required variable is missing.
        """
        required_variables = [
            "FLASK_APP",
            "FLASK_DEBUG",
            "SECRET_KEY",
            "JWT_SECRET_KEY",
            "DBHOSTNAME",
            "DBDATABASE",
            "DBUSERNAME",
            "DBPASSWORD",
            "DBPORT",
            "FLASK_ENV",
            "OPENMETEO_API",
        ]
        try:
            for var in required_variables:
                if os.getenv(var) is None:
                    raise ConfigError(error=f"{var} environment variable is not set.")

            cls.DBHOSTNAME = os.getenv("DBHOSTNAME")
            cls.DBDATABASE = os.getenv("DBDATABASE")
            cls.DBUSERNAME = os.getenv("DBUSERNAME")
            cls.DBPASSWORD = os.getenv("DBPASSWORD")
            cls.DBPORT = os.getenv("DBPORT")
            cls.FLASK_ENV = os.getenv("FLASK_ENV")
            cls.OPENMETEO_API = os.getenv("OPENMETEO_API")
        except ConfigError as err:
            print(err)
        except Exception as err:
            print(err)

    @classmethod
    def getDBvariables(cls):
        """Return a dict of database connection variables."""
        return {
            "HOSTNAME": cls.DBHOSTNAME,
            "DATABASE": cls.DBDATABASE,
            "USERNAME": cls.DBUSERNAME,
            "PASSWORD": cls.DBPASSWORD,
            "PORT": cls.DBPORT,
        }

    @classmethod
    def load_openmeteo(cls):
        """Return the base URL for the Open-Meteo ECMWF API.

        Reads OPENMETEO_API from the environment at call-time so it always
        reflects the current value (useful in testing).
        Raises ConfigError if the variable is missing or empty.
        """
        url = os.getenv("OPENMETEO_API")
        if not url:
            raise ConfigError(error="OPENMETEO_API environment variable is not set.")
        return url


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = None
    DEBUG = False

    # Secure cookie settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = "Lax"


def build_db_url():
    """Build and return the PostgreSQL connection URL, or empty string on failure."""
    try:
        Config.loadvariables()
        dbvar = Config.getDBvariables()
        if dbvar.get("HOSTNAME") and dbvar.get("USERNAME") and dbvar.get("DATABASE"):
            return (
                f"postgresql://{dbvar['USERNAME']}:{dbvar['PASSWORD']}"
                f"@{dbvar['HOSTNAME']}:{dbvar['PORT']}/{dbvar['DATABASE']}"
            )
        return ""
    except Exception as e:
        print(e)
        return ""


DevelopmentConfig.SQLALCHEMY_DATABASE_URI = build_db_url() or "sqlite:///dev.db"
ProductionConfig.SQLALCHEMY_DATABASE_URI = build_db_url()

config_by_name = dict(
    development=DevelopmentConfig,
    production=ProductionConfig,
)
