import sys
import os
from flask import Flask, request
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

# Add a health check endpoint
@app.route('/api/health')
def health_check():
    return {'status': 'healthy'}

# Add a manual trigger endpoint for setting a random puzzle
@app.route('/api/admin/set-random-puzzle', methods=['POST', 'GET'])
def admin_set_random_puzzle():
    # Import here to avoid circular imports
    from app.cron import set_random_puzzle
    
    logger.info("Manual trigger: set_random_puzzle()")
    result = set_random_puzzle()
    logger.info(f"Manual trigger result: {result}")
    return result

# Handle Vercel serverless environment
if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
    logger.info("Running in Vercel production environment")
    # Start the scheduler even in production
    from app.cron import start_scheduler
    start_scheduler()
else:
    app.debug = True
    logger.info("Running in development environment")
    # Start the scheduler in development environment
    from app.cron import start_scheduler
    start_scheduler()

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with the Next.js dev server on 3000
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
