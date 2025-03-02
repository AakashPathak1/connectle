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

def set_random_puzzle():
    """
    Set a random puzzle as the current active puzzle.
    This function is called by the scheduler every 2 minutes.
    """
    logger.info("Scheduled task: Setting random puzzle")
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

# Scheduler function to change word every 2 minutes
def start_scheduler():
    """
    Start a background thread that runs set_random_puzzle every 2 minutes at every even minute.
    """
    def run_scheduler():
        logger.info("Starting scheduler thread for changing word every 2 minutes")
        
        while True:
            try:
                # Get current time
                now = datetime.now()
                
                # Calculate time until next even minute (0, 2, 4, ..., 58)
                current_minute = now.minute
                # Calculate the next even minute
                next_even_minute = current_minute + (2 - current_minute % 2)
                if next_even_minute == current_minute and now.second > 0:
                    next_even_minute += 2
                if next_even_minute >= 60:
                    next_even_minute = 0
                    next_hour = now.hour + 1
                    if next_hour >= 24:
                        next_hour = 0
                else:
                    next_hour = now.hour
                
                next_time = now.replace(hour=next_hour, minute=next_even_minute, second=0, microsecond=0)
                
                # Calculate seconds until next even minute
                seconds_until_next = (next_time - now).total_seconds()
                if seconds_until_next <= 0:
                    seconds_until_next += 120  # Add 2 minutes if we calculated a negative time
                
                logger.info(f"Scheduled next puzzle update in {seconds_until_next:.1f} seconds (at {next_time.strftime('%H:%M:%S')})")
                
                # Sleep until next even minute
                time.sleep(seconds_until_next)
                
                # It's time to change the puzzle
                logger.info(f"It's {datetime.now().strftime('%H:%M:%S')}! Setting new random puzzle")
                set_random_puzzle()
                
                # Sleep for a second to avoid running multiple times
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in scheduler: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Sleep for 10 seconds before retrying
                time.sleep(10)
    
    # Start the scheduler in a background thread
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    logger.info("Scheduler thread started")
