import os

basedir = os.path.abspath(os.path.dirname(__file__))

def get_database_uri():
    raw_url = os.environ.get('DATABASE_URL')
    if raw_url:
        # Standardize PostgreSQL URI to explicitly use psycopg2
        if raw_url.startswith('postgres://'):
            return raw_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        if raw_url.startswith('postgresql://'):
            return raw_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        return raw_url
    # Stable SQLite database file path with forward slashes
    sqlite_path = os.path.join(basedir, 'farmdirect.db').replace('\\', '/')
    return f'sqlite:///{sqlite_path}'

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'farmdirect-hackathon-supersecret-jwt-key-2026')
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'timeout': 30} if 'sqlite' in get_database_uri() else {}
    }
    JWT_EXPIRATION_HOURS = 48
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
