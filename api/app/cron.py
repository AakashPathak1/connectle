"""
Cron job functionality for Connectle API.
This module contains functions that are executed on a schedule.
"""

import logging
import random
import os
import sys
import requests
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
        # Initialize Supabase client
        if not init_supabase():
            logger.error("Failed to initialize Supabase client")
            return False
        
        # Create Supabase client
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        
        # Get all puzzles
        response = supabase.table("puzzles").select("*").order("created_at", desc=True).limit(100).execute()
        puzzles = response.data
        
        if not puzzles:
            logger.error("No puzzles found in database")
            return False
        
        # Select a random puzzle
        random.seed(datetime.now().timestamp())
        selected_puzzle = random.choice(puzzles)
        logger.info(f"Selected random puzzle: {selected_puzzle['start_word']} -> {selected_puzzle['end_word']}")
        
        # Verify the puzzle exists
        puzzle_id = selected_puzzle['id']
        verify_response = supabase.table("puzzles").select("*").eq("id", puzzle_id).execute()
        if not verify_response.data:
            logger.error(f"Failed to verify puzzle with ID {puzzle_id}")
            return False
        
        logger.info(f"Found puzzle: {selected_puzzle['start_word']} -> {selected_puzzle['end_word']}")
        
        # Reset all daily puzzles
        reset_response = supabase.table("puzzles").update({"is_daily": False}).eq("is_daily", True).execute()
        logger.info("Reset all daily puzzles")
        
        # Set the selected puzzle as daily
        update_response = supabase.table("puzzles").update({"is_daily": True}).eq("id", puzzle_id).execute()
        logger.info(f"Set puzzle {puzzle_id} as daily")
        
        logger.info(f"Successfully set puzzle {puzzle_id} as daily")
        return True
    except Exception as e:
        logger.error(f"Error setting random daily puzzle: {str(e)}")
        return False

def set_random_daily():
    """
    Set a random puzzle as daily.
    This function is called by the cron job.
    """
    logger.info("Cron job: Setting random daily puzzle")
    try:
        # Set a random puzzle as daily
        success = set_random_daily_puzzle()
        
        if success:
            logger.info("Successfully set a random puzzle as daily via cron job")
            return {"status": "success", "message": "Set a random puzzle as daily"}
        else:
            logger.error("Failed to set a random puzzle as daily via cron job")
            return {"status": "error", "message": "Failed to set a random puzzle as daily"}
    except Exception as e:
        logger.error(f"Error in cron job: {e}")
        return {"status": "error", "message": str(e)}
