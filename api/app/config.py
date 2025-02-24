import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Try to load environment variables from root directory first, then api directory
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
api_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')

if os.path.exists(root_env_path):
    load_dotenv(root_env_path)
    logger.info(f"Loaded environment variables from root .env file")
elif os.path.exists(api_env_path):
    load_dotenv(api_env_path)
    logger.info(f"Loaded environment variables from api .env file")
else:
    logger.warning(f"No .env file found in root or api directory. Using default values.")

class Config:
    # Supabase configuration with defaults for development
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    @classmethod
    def is_development(cls):
        return cls.FLASK_ENV == 'development'

    @classmethod
    def has_valid_supabase_config(cls):
        return ('your-project' not in cls.SUPABASE_URL and 
                'your-anon-key' not in cls.SUPABASE_KEY)
