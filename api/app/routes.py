from flask import Blueprint, request, jsonify
from .services.game_service import GameService
from . import limiter
import logging

main = Blueprint('main', __name__)
logger = logging.getLogger(__name__)
game_service = GameService()

@main.route('/api/daily-puzzle', methods=['GET'])
@limiter.limit("30 per minute")
def get_daily_puzzle():
    return game_service.get_daily_puzzle()

@main.route('/api/validate-word', methods=['GET', 'POST'])
@limiter.limit("60 per minute")
def validate_word():
    logger.info(f"Received validate-word request: {request.data}")
    try:
        # Handle both GET and POST requests
        if request.method == 'POST':
            data = request.get_json()
            logger.info(f"Parsed JSON data: {data}")
        else:  # GET request
            data = {
                'current_word': request.args.get('current_word'),
                'next_word': request.args.get('next_word')
            }
            logger.info(f"GET request data: {data}")
        
        return game_service.validate_word(data)
    except Exception as e:
        logger.error(f"Error in validate_word: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@main.route('/api/get-hint', methods=['GET'])
@limiter.limit("20 per minute")
def get_hint():
    data = {
        'current_word': request.args.get('current_word'),
        'target_word': request.args.get('target_word')
    }
    return game_service.get_hint(data)

@main.route('/api/check-similarity', methods=['GET'])
@limiter.limit("60 per minute")
def check_similarity():
    data = {
        'word1': request.args.get('word1'),
        'word2': request.args.get('word2')
    }
    return game_service.check_similarity(data)

@main.route('/api/check-word', methods=['GET'])
@limiter.limit("60 per minute")
def check_word():
    word = request.args.get('word')
    logger.info(f"Checking word validity: {word}")
    
    if not word:
        logger.warning("Missing word parameter")
        return jsonify({"error": "Missing word parameter"}), 400
    
    # Use the game service to check if the word is valid
    try:
        # Simple validation - check if the word exists in the dictionary
        import requests
        from .config import Config
        
        hf_space_url = Config.HF_SPACE_URL
        logger.info(f"Making request to HF Space: {hf_space_url}/check-word?word={word}")
        
        response = requests.get(
            f"{hf_space_url}/check-word",
            params={"word": word}
        )
        
        if response.status_code == 200:
            result = response.json()
            is_valid = result.get("is_valid", False)
            logger.info(f"Word '{word}' validity: {is_valid}")
            return jsonify({"is_valid": is_valid})
        else:
            logger.error(f"Error from HF Space: {response.text}")
            # Fallback validation if the API fails
            logger.warning(f"Using fallback validation for '{word}'")
            return jsonify({"is_valid": True})  # Assume valid as a fallback
            
    except Exception as e:
        logger.error(f"Error checking word validity: {str(e)}")
        # In case of error, assume the word is valid to not block the user
        logger.warning(f"Exception occurred, assuming '{word}' is valid")
        return jsonify({"is_valid": True})
