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
    
    # Check if this is a Vercel cron job request
    is_cron_job = request.headers.get('x-vercel-cron') == 'true'
    
    # If not a cron job, require authentication
    if not is_cron_job:
        # Simple admin authentication
        auth_header = request.headers.get('Authorization')
        admin_secret = os.environ.get('ADMIN_SECRET')
        
        if not admin_secret or not auth_header or auth_header != f"Bearer {admin_secret}":
            logger.warning("Unauthorized admin action attempt")
            return {'status': 'error', 'message': 'Unauthorized'}, 401
    else:
        logger.info("Received scheduled cron job request from Vercel")
    
    # Execute the function
    logger.info("Trigger: set_random_daily()")
    result = set_random_daily()
    logger.info(f"Trigger result: {result}")
    return result

# Handle Vercel serverless environment
if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
    logger.info("Running in Vercel production environment")
else:
    app.debug = True
    logger.info("Running in development environment")
    # Only start the background scheduler in development environment
    from app.cron import start_hourly_scheduler
    start_hourly_scheduler()
    logger.info("Started hourly scheduler in development environment")

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with the Next.js dev server on 3000
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
