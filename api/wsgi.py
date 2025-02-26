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

# Add a cron job endpoint to set a random daily puzzle
@app.route('/api/cron/set-random-daily', methods=['GET', 'POST'])
def cron_set_random_daily():
    # Import here to avoid circular imports
    from app.cron import set_random_daily
    
    # Check for Vercel cron authentication header
    cron_secret = os.environ.get('CRON_SECRET')
    if cron_secret:
        authorization = request.headers.get('Authorization')
        if not authorization or authorization != f"Bearer {cron_secret}":
            logger.warning("Unauthorized cron job attempt")
            return {'status': 'error', 'message': 'Unauthorized'}, 401
    
    # Execute the cron job
    result = set_random_daily()
    return result

# Handle Vercel serverless environment
if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
    logger.info("Running in Vercel production environment")
else:
    app.debug = True
    logger.info("Running in development environment")

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with the Next.js dev server on 3000
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
