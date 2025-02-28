from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from .config import Config

# Initialize limiter with default limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

def create_app():
    app = Flask(__name__)
    
    # Configure CORS to allow requests from any origin in development
    # and from specific origins in production
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    app.config.from_object(Config)

    # Initialize limiter with the Flask app
    limiter.init_app(app)
    
    # Register error handler for rate limiting
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "error": "Rate limit exceeded",
            "message": str(e.description),
            "retry_after": e.headers.get('Retry-After', 60)
        }), 429

    # Register blueprints
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
