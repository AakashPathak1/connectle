import sys
import os
from flask import Flask, request
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

@app.route('/api/health')
def health_check():
    return {'status': 'healthy'}

@app.route('/api/admin/set-random-puzzle', methods=['POST', 'GET'])
def admin_set_random_puzzle():
    from app.cron import set_random_puzzle
    logger.info("Manual trigger: set_random_puzzle()")
    result = set_random_puzzle()
    logger.info(f"Manual trigger result: {result}")
    return result

if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
    logger.info("Running in Vercel production environment")
    from app.cron import start_scheduler
    start_scheduler()
else:
    app.debug = True
    logger.info("Running in development environment")
    from app.cron import start_scheduler
    start_scheduler()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
