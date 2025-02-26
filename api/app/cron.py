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

# Add the parent directory to the Python path to import from scripts
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

# Import the function to set a random daily puzzle
from scripts.word_pair_generator import set_random_daily_puzzle

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
