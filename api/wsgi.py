import sys
import os
from flask import Flask

# Add the api directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.app import create_app

app = create_app()

# Add a health check endpoint
@app.route('/api/health')
def health_check():
    return {'status': 'healthy'}

if __name__ == "__main__":
    app.run(port=5001)
