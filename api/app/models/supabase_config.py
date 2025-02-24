import os
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
from ..config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Table names
PUZZLES_TABLE = "puzzles"
USER_PUZZLE_STATS_TABLE = "user_puzzle_stats"
PUZZLE_STATS_TABLE = "puzzle_stats"

# Mock data for development/fallback
MOCK_PUZZLES = [{
    "start_word": "cold",
    "end_word": "warm",
    "start_definition": "Having a low temperature",
    "end_definition": "Having or giving out a moderate degree of heat"
}]

# Supabase client instance
supabase: Client = None

def init_supabase():
    """Initialize Supabase client with error handling"""
    global supabase
    try:
        if Config.has_valid_supabase_config():
            supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
            return True
        else:
            logger.warning("Invalid Supabase configuration. Using mock data.")
            return False
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return False

def get_puzzles():
    """Get all puzzles from Supabase with fallback to mock data"""
    try:
        # In development without valid Supabase config, return mock data
        if Config.is_development() and not Config.has_valid_supabase_config():
            logger.info("Development mode: Using mock puzzle data")
            return MOCK_PUZZLES

        # Try to initialize Supabase if not already initialized
        if not supabase and not init_supabase():
            logger.warning("Using mock puzzle data due to Supabase initialization failure")
            return MOCK_PUZZLES

        # Fetch puzzles from Supabase
        response = supabase.table(PUZZLES_TABLE).select("*").execute()
        if response.data:
            return response.data
        
        logger.warning("No puzzles found in database, using mock data")
        return MOCK_PUZZLES
        
    except Exception as e:
        logger.error(f"Error fetching puzzles: {str(e)}")
        return MOCK_PUZZLES
