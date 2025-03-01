from flask import jsonify
from datetime import datetime
import random
import os
import logging
from ..models.supabase_config import get_puzzles
from ..config import Config

logger = logging.getLogger(__name__)

class GameService:
    def __init__(self):
        # Default puzzle in case of database issues
        self.default_puzzle = {
            "startWord": "cold",
            "endWord": "warm",
            "startDefinition": "Having a low temperature.\nLacking affection or warmth of feeling.",
            "endDefinition": "Having or giving out a moderate degree of heat.\nCharacterized by lively or excited activity."
        }

    def get_daily_puzzle(self):
        """Get today's puzzle from Supabase or fallback to default"""
        try:
            # Try to get puzzles from database
            puzzles = get_puzzles()
            if puzzles:
                # First, try to find a puzzle marked as daily
                daily_puzzles = [p for p in puzzles if p.get('is_daily', False)]
                
                if daily_puzzles:
                    # Use the first puzzle marked as daily
                    puzzle = daily_puzzles[0]
                    logger.info("Using puzzle marked as daily")
                else:
                    # Fallback to random selection if no puzzle is marked as daily
                    logger.info("No puzzle marked as daily, using random selection")
                    today = datetime.now().date()
                    random.seed(int(today.strftime('%Y%m%d')))
                    puzzle = random.choice(puzzles)
                
                # Ensure definitions have proper line breaks
                start_definition = puzzle["start_definition"].replace(". ", ".\n")
                end_definition = puzzle["end_definition"].replace(". ", ".\n")
                
                return jsonify({
                    "startWord": puzzle["start_word"],
                    "endWord": puzzle["end_word"],
                    "startDefinition": start_definition,
                    "endDefinition": end_definition,
                    "source": "database"
                })
            
            # Log warning and use default puzzle if database is empty
            logger.warning("No puzzles found in database, using default puzzle")
            return jsonify({**self.default_puzzle, "source": "default"})
            
        except Exception as e:
            # Log the full error for debugging
            logger.error(f"Error fetching puzzle: {str(e)}")
            
            # Return default puzzle with error indication
            return jsonify({
                **self.default_puzzle,
                "source": "default",
                "note": "Using default puzzle due to technical difficulties"
            })

    def validate_word(self, data):
        """Validate if the word can be used in the current chain"""
        import requests
        
        # Handle case where data might be None or not a dict
        if not data or not isinstance(data, dict):
            logger.error(f"Invalid data format received: {data}")
            return jsonify({"error": "Invalid request format"}), 400
        
        # Handle both formats: {"current_word": "...", "next_word": "..."} and {"word": "..."}
        word1 = data.get('current_word')
        word2 = data.get('next_word')
        
        # If we received data in the format {"word": "..."}, we need to handle it differently
        # This appears to be happening in the Vercel deployment
        if not word1 and not word2 and data.get('word'):
            # In this case, we're likely receiving a single word to validate
            # We'll need to get the current word from somewhere else or use a default
            word2 = data.get('word')
            # For debugging purposes, log what we received
            logger.info(f"Received single word format: {data}")
            return jsonify({"error": "Please provide both current_word and next_word"}), 400
        
        if not word1 or not word2:
            logger.warning(f"Missing words in request: {data}")
            return jsonify({"error": "Missing words"}), 400
            
        try:
            # Get the Hugging Face space URL from config
            hf_space_url = Config.HF_SPACE_URL
            response = requests.get(
                f"{hf_space_url}/check-similarity",
                params={"word1": word1, "word2": word2}
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if the API returned a valid field
                if "valid" in result:
                    is_valid = result["valid"]
                else:
                    # If not, calculate it based on similarity threshold
                    similarity = result["similarity"]
                    is_valid = similarity > 0.47
                
                # Check if there's an error message
                message = result.get("message", None)
                
                response_data = {
                    "is_valid": is_valid,
                    "similarity": result["similarity"]
                }
                
                # Add message if present
                if message:
                    response_data["message"] = message
                    
                return jsonify(response_data)
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_hint(self, data):
        """Get hint for the current word chain"""
        import requests
        
        current_word = data.get('current_word')
        target_word = data.get('target_word')
        
        if not current_word or not target_word:
            return jsonify({"error": "Missing current_word or target_word"}), 400
            
        try:
            # Get the Hugging Face space URL from config
            hf_space_url = Config.HF_SPACE_URL
            response = requests.get(
                f"{hf_space_url}/hint",
                params={
                    "current_word": current_word, 
                    "target_word": target_word,
                    "threshold": 0.47  # Use the new threshold for finding hints
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return jsonify(result)
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    def check_similarity(self, data):
        """Check similarity between two words"""
        import requests
        
        word1 = data.get('word1')
        word2 = data.get('word2')
        
        if not word1 or not word2:
            return jsonify({"error": "Missing word1 or word2"}), 400
            
        try:
            # Get the Hugging Face space URL from config
            hf_space_url = Config.HF_SPACE_URL
            response = requests.get(
                f"{hf_space_url}/check-similarity",
                params={"word1": word1, "word2": word2}
            )
            
            if response.status_code == 200:
                result = response.json()
                return jsonify(result)
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
