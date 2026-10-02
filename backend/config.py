import os

basedir = os.path.abspath(os.path.dirname(__file__))

def get_database_uri():
    raw_url = os.environ.get('DATABASE_URL')
    env = os.environ.get('FLASK_ENV') or os.environ.get('ENVIRONMENT')
    is_prod = (env == 'production' or os.environ.get('RENDER') == 'true')

    if is_prod and not raw_url:
        raise RuntimeError(
            "FATAL: DATABASE_URL must be configured in production environments. "
            "Silent SQLite fallback is disabled in production to protect against data loss on container restarts."
        )

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
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-flash-latest')
    ENABLE_DEMO_SEED = os.environ.get('ENABLE_DEMO_SEED', 'false' if (os.environ.get('FLASK_ENV') == 'production' or os.environ.get('RENDER') == 'true') else 'true').lower() in ('true', '1')

