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
            "startDefinition": "Having a low temperature",
            "endDefinition": "Having or giving out a moderate degree of heat"
        }

    def get_daily_puzzle(self):
        """Get today's puzzle from Supabase or fallback to default"""
        try:
            # Try to get puzzles from database
            puzzles = get_puzzles()
            if puzzles:
                # Use today's date as seed for consistent daily puzzle
                today = datetime.now().date()
                random.seed(int(today.strftime('%Y%m%d')))
                puzzle = random.choice(puzzles)
                
                return jsonify({
                    "startWord": puzzle["start_word"],
                    "endWord": puzzle["end_word"],
                    "startDefinition": puzzle["start_definition"],
                    "endDefinition": puzzle["end_definition"],
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
        
        word1 = data.get('current_word')
        word2 = data.get('next_word')
        
        if not word1 or not word2:
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
                    is_valid = similarity > 0.5
                
                # Check if there's an error message
                message = result.get("message", None)
                
                response_data = {
                    "valid": is_valid,
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
                params={"current_word": current_word, "target_word": target_word}
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
