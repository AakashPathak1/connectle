"""
Check the current daily puzzle.
This script queries the database to check which puzzle is currently set as daily.
"""

import os
import sys
import logging
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the parent directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

# Import the Supabase config
from app.models.supabase_config import init_supabase
from app.config import Config
from supabase import create_client

def check_daily_puzzle():
    """Check which puzzle is currently set as daily"""
    try:
        logger.info("Checking current daily puzzle")
        
        # Initialize Supabase client
        if not init_supabase():
            logger.error("Failed to initialize Supabase client")
            return False
        
        # Create Supabase client
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        
        # Get the current daily puzzle
        response = supabase.table("puzzles").select("*").eq("is_daily", True).execute()
        daily_puzzles = response.data
        
        if not daily_puzzles:
            logger.warning("No daily puzzle found")
            return None
        
        if len(daily_puzzles) > 1:
            logger.warning(f"Multiple daily puzzles found: {len(daily_puzzles)}")
        
        # Print the daily puzzle(s)
        for puzzle in daily_puzzles:
            logger.info(f"Daily puzzle: {puzzle['start_word']} -> {puzzle['end_word']}")
            logger.info(f"Puzzle ID: {puzzle['id']}")
            logger.info(f"Created at: {puzzle['created_at']}")
            logger.info(f"Updated at: {puzzle.get('updated_at', 'N/A')}")
            logger.info(json.dumps(puzzle, indent=2))
        
        return daily_puzzles
    except Exception as e:
        logger.error(f"Error checking daily puzzle: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

if __name__ == "__main__":
    check_daily_puzzle()
