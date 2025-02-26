"""
Test script for the cron job functionality.
This script manually triggers the cron job to set a random daily puzzle.
"""

import os
import sys
import logging
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the parent directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

# Import the cron job function
from app.cron import set_random_daily_puzzle

def test_local():
    """Test the cron job locally"""
    logger.info("Testing cron job locally")
    result = set_random_daily_puzzle()
    logger.info(f"Cron job result: {result}")
    return result

def test_vercel(url, secret=None):
    """Test the cron job on Vercel"""
    logger.info(f"Testing cron job on Vercel: {url}")
    
    headers = {}
    if secret:
        headers['Authorization'] = f"Bearer {secret}"
    
    try:
        response = requests.get(f"{url}/api/cron/set-random-daily", headers=headers)
        logger.info(f"Status code: {response.status_code}")
        logger.info(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Error testing cron job on Vercel: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test the cron job functionality')
    parser.add_argument('--mode', choices=['local', 'vercel'], default='local', help='Test mode')
    parser.add_argument('--url', help='Vercel URL (required for vercel mode)')
    parser.add_argument('--secret', help='CRON_SECRET for Vercel (optional)')
    
    args = parser.parse_args()
    
    if args.mode == 'local':
        test_local()
    elif args.mode == 'vercel':
        if not args.url:
            logger.error("URL is required for vercel mode")
            sys.exit(1)
        test_vercel(args.url, args.secret)
