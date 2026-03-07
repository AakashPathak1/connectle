"""
Backend functionality for scheduled tasks in Connectle API.
"""

import logging
import threading
import time
import requests
from datetime import datetime

from app.config import Config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def set_random_daily_puzzle():
    """Tell the HuggingFace space to pick a new random daily puzzle."""
    try:
        hf_url = f"{Config.HF_SPACE_URL}/admin/set-random-puzzle"
        logger.info(f"Calling HuggingFace admin endpoint: {hf_url}")

        response = requests.get(
            hf_url,
            headers={"x-admin-secret": Config.ADMIN_SECRET},
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            logger.info(f"HuggingFace set daily puzzle: {data.get('start_word')} -> {data.get('end_word')}")
            return True
        else:
            logger.error(f"HuggingFace admin endpoint returned {response.status_code}: {response.text}")
            return False

    except Exception as e:
        logger.error(f"Error calling HuggingFace admin endpoint: {e}")
        return False


def set_random_puzzle():
    """Wrapper called by the scheduler and the manual admin endpoint."""
    logger.info("Scheduled task: setting random puzzle via HuggingFace")
    try:
        success = set_random_daily_puzzle()
        if success:
            return {"status": "success", "message": "Set a random puzzle as daily"}
        else:
            return {"status": "error", "message": "Failed to set a random puzzle as daily"}
    except Exception as e:
        logger.error(f"Error in set_random_puzzle: {e}")
        return {"status": "error", "message": str(e)}


def start_scheduler():
    """Start a background thread that rotates the puzzle once at midnight each day."""
    def run_scheduler():
        logger.info("Scheduler thread started — will rotate puzzle at midnight each day")
        while True:
            try:
                now = datetime.now()
                tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0)
                if tomorrow <= now:
                    tomorrow = tomorrow.replace(day=tomorrow.day + 1)

                seconds_until_midnight = (tomorrow - now).total_seconds()
                logger.info(f"Next puzzle rotation in {seconds_until_midnight:.0f}s (at {tomorrow.strftime('%Y-%m-%d %H:%M:%S')})")
                time.sleep(seconds_until_midnight)

                logger.info("Midnight reached — rotating daily puzzle")
                set_random_puzzle()

                time.sleep(60)  # avoid double-firing

            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)

    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    logger.info("Scheduler thread started")
