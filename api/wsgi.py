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
    
    # Log all headers for debugging
    logger.info(f"Cron job triggered. Headers: {dict(request.headers)}")
    
    # Check for Vercel cron authentication header
    cron_secret = os.environ.get('CRON_SECRET')
    if cron_secret:
        # Check multiple possible auth methods
        auth_header = request.headers.get('Authorization')
        vercel_cron_header = request.headers.get('x-vercel-cron')
        
        is_authorized = False
        
        # Check standard Authorization header
        if auth_header and (auth_header == f"Bearer {cron_secret}" or auth_header == f"Basic {cron_secret}"):
            logger.info("Authorized via Authorization header")
            is_authorized = True
        
        # Check Vercel-specific header
        elif vercel_cron_header and vercel_cron_header == cron_secret:
            logger.info("Authorized via x-vercel-cron header")
            is_authorized = True
        
        # If running locally or in development, allow without auth
        elif os.environ.get('VERCEL_ENV') != 'production':
            logger.info("Running in development mode, bypassing auth")
            is_authorized = True
        
        # If not authorized through any method
        if not is_authorized:
            logger.warning("Unauthorized cron job attempt")
            return {'status': 'error', 'message': 'Unauthorized'}, 401
    else:
        logger.warning("CRON_SECRET not set, proceeding without authentication")
    
    # Execute the cron job
    logger.info("Executing cron job: set_random_daily()")
    result = set_random_daily()
    logger.info(f"Cron job result: {result}")
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
