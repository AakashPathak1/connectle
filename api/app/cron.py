"""
Backend functionality for scheduled tasks in Connectle API.
This module contains functions that are executed on a schedule.
"""

import logging
import random
import os
import sys
import threading
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import Supabase config
from app.models.supabase_config import init_supabase
from app.config import Config
from supabase import create_client

def set_random_daily_puzzle():
    """
    Set a random puzzle as daily.
    This function selects a random puzzle from the database and marks it as daily.
    """
    try:
        logger.info("Starting set_random_daily_puzzle function")
        
        # Initialize Supabase client
        logger.info("Initializing Supabase client")
        if not init_supabase():
            logger.error("Failed to initialize Supabase client")
            return False
        
        # Create Supabase client
        logger.info(f"Creating Supabase client with URL: {Config.SUPABASE_URL[:15]}...")
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        
        # Get current daily puzzle first
        logger.info("Checking current daily puzzle")
        current_daily_response = supabase.table("puzzles").select("*").eq("is_daily", True).execute()
        current_daily = current_daily_response.data[0] if current_daily_response.data else None
        
        if current_daily:
            logger.info(f"Current daily puzzle: {current_daily['start_word']} -> {current_daily['end_word']} (ID: {current_daily['id']})")
        else:
            logger.info("No current daily puzzle found")
        
        # Get all puzzles
        logger.info("Fetching puzzles from database")
        response = supabase.table("puzzles").select("*").order("created_at", desc=True).limit(100).execute()
        puzzles = response.data
        
        if not puzzles:
            logger.error("No puzzles found in database")
            return False
        
        logger.info(f"Found {len(puzzles)} puzzles in database")
        
        # Filter out the current daily puzzle to ensure we select a different one
        if current_daily:
            puzzles = [p for p in puzzles if p['id'] != current_daily['id']]
            logger.info(f"Filtered out current daily puzzle, {len(puzzles)} puzzles remaining")
            
            if not puzzles:
                logger.error("No other puzzles available after filtering")
                return False
        
        # Select a random puzzle
        logger.info("Selecting a random puzzle")
        random.seed(datetime.now().timestamp())
        selected_puzzle = random.choice(puzzles)
        logger.info(f"Selected random puzzle: {selected_puzzle['start_word']} -> {selected_puzzle['end_word']}")
        
        # Verify the puzzle exists
        puzzle_id = selected_puzzle['id']
        logger.info(f"Verifying puzzle with ID {puzzle_id}")
        verify_response = supabase.table("puzzles").select("*").eq("id", puzzle_id).execute()
        if not verify_response.data:
            logger.error(f"Failed to verify puzzle with ID {puzzle_id}")
            return False
        
        logger.info(f"Found puzzle: {selected_puzzle['start_word']} -> {selected_puzzle['end_word']}")
        
        # Reset all daily puzzles
        logger.info("Resetting all daily puzzles")
        reset_response = supabase.table("puzzles").update({"is_daily": False}).eq("is_daily", True).execute()
        logger.info(f"Reset response: {reset_response}")
        
        # Set the selected puzzle as daily
        logger.info(f"Setting puzzle {puzzle_id} as daily")
        update_response = supabase.table("puzzles").update({"is_daily": True}).eq("id", puzzle_id).execute()
        logger.info(f"Update response: {update_response}")
        
        logger.info(f"Successfully set puzzle {puzzle_id} as daily")
        return True
    except Exception as e:
        logger.error(f"Error setting random daily puzzle: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def set_random_daily():
    """
    Set a random puzzle as daily.
    This function is called by the daily scheduler.
    """
    logger.info("Daily task: Setting random daily puzzle")
    try:
        # Set a random puzzle as daily
        success = set_random_daily_puzzle()
        
        if success:
            logger.info("Successfully set a random puzzle as daily")
            return {"status": "success", "message": "Set a random puzzle as daily"}
        else:
            logger.error("Failed to set a random puzzle as daily")
            return {"status": "error", "message": "Failed to set a random puzzle as daily"}
    except Exception as e:
        logger.error(f"Error in daily task: {e}")
        return {"status": "error", "message": str(e)}

# Global variable to track if scheduler is running
_scheduler_running = False

# Daily scheduler function
def start_daily_scheduler():
    """
    Start a background thread that runs set_random_daily at midnight every day.
    """
    global _scheduler_running
    
    # Only start if not already running
    if _scheduler_running:
        logger.info("Daily scheduler already running, skipping")
        return
    
    def run_scheduler():
        logger.info("Starting daily scheduler thread")
        
        while True:
            try:
                # Get current time
                now = datetime.now()
                
                # Calculate time until next midnight
                tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0)
                if tomorrow <= now:
                    # If it's already past midnight, set for next day
                    tomorrow = tomorrow.replace(day=tomorrow.day + 1)
                
                # Calculate seconds until midnight
                seconds_until_midnight = (tomorrow - now).total_seconds()
                
                logger.info(f"Scheduled next puzzle update in {seconds_until_midnight:.1f} seconds (at midnight)")
                
                # Sleep until midnight
                time.sleep(seconds_until_midnight)
                
                # It's midnight, set a new random puzzle
                logger.info("It's midnight! Setting new random daily puzzle")
                success = set_random_daily()
                logger.info(f"Midnight puzzle update result: {success}")
                
                # Sleep for a minute to avoid running multiple times
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in daily scheduler: {e}")
                # Sleep for a minute before retrying
                time.sleep(60)
    
    # Start the scheduler in a background thread
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    _scheduler_running = True
    logger.info("Daily scheduler thread started")
    
    # Check if we need to set a daily puzzle right now
    check_and_set_daily_if_needed()

def check_and_set_daily_if_needed():
    """
    Check if there's a daily puzzle, and set one if needed.
    This ensures we always have a daily puzzle, even if the server was down at midnight.
    """
    try:
        # Initialize Supabase client
        if not init_supabase():
            logger.error("Failed to initialize Supabase client when checking for daily puzzle")
            return False
        
        # Create Supabase client
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        
        # Check if there's a daily puzzle
        logger.info("Checking if daily puzzle exists")
        response = supabase.table('puzzles').select('*').eq('is_daily', True).execute()
        
        if not response.data:
            logger.info("No daily puzzle found, setting one now")
            return set_random_daily()
        else:
            logger.info(f"Daily puzzle exists: {response.data[0]['start_word']} -> {response.data[0]['end_word']}")
            return {"status": "success", "message": "Daily puzzle already exists"}
    except Exception as e:
        logger.error(f"Error checking daily puzzle: {str(e)}")
        return {"status": "error", "message": str(e)}
