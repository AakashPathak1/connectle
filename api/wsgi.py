import sys
import os
from flask import Flask

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

# Add a health check endpoint
@app.route('/api/health')
def health_check():
    return {'status': 'healthy'}

# Handle Vercel serverless environment
if os.environ.get('VERCEL_ENV') == 'production':
    app.debug = False
else:
    app.debug = True

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with the Next.js dev server on 3000
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
