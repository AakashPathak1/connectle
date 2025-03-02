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

# Add a manual trigger endpoint for setting a random daily puzzle
@app.route('/api/admin/set-random-daily', methods=['POST', 'GET'])
def admin_set_random_daily():
    # Import here to avoid circular imports
    from app.cron import set_random_daily
    
    logger.info("Manual trigger: set_random_daily()")
    result = set_random_daily()
    logger.info(f"Manual trigger result: {result}")
    return result

# Add a cron endpoint that can be called by external cron services (e.g., cron-job.org)
@app.route('/api/cron/set-random-daily', methods=['GET'])
def cron_set_random_daily():
    # Import here to avoid circular imports
    from app.cron import set_random_daily
    
    logger.info("Cron service trigger: set_random_daily()")
    result = set_random_daily()
    logger.info(f"Cron service trigger result: {result}")
    return result

# Handle Vercel serverless environment
if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
    logger.info("Running in Vercel production environment")
    # Start the daily scheduler even in production
    from app.cron import start_daily_scheduler
    start_daily_scheduler()
else:
    app.debug = True
    logger.info("Running in development environment")
    # Start the daily scheduler in development environment
    from app.cron import start_daily_scheduler
    start_daily_scheduler()

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with the Next.js dev server on 3000
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
