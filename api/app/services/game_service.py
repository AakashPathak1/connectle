from flask import jsonify
import logging
import requests
from ..config import Config

logger = logging.getLogger(__name__)

class GameService:
    def __init__(self):
        self.default_puzzle = {
            "startWord": "cold",
            "endWord": "warm",
            "startDefinition": "Having a low temperature.\nLacking affection or warmth of feeling.",
            "endDefinition": "Having or giving out a moderate degree of heat.\nCharacterized by lively or excited activity."
        }

    def get_daily_puzzle(self):
        """Get today's puzzle directly from HuggingFace space."""
        try:
            response = requests.get(
                f"{Config.HF_SPACE_URL}/api/daily-puzzle",
                timeout=15
            )
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Got daily puzzle from HuggingFace: {data.get('startWord')} -> {data.get('endWord')}")
                return jsonify(data)
            else:
                logger.error(f"HuggingFace returned {response.status_code}: {response.text}")
                return jsonify({**self.default_puzzle, "source": "default"})
        except Exception as e:
            logger.error(f"Error fetching puzzle from HuggingFace: {e}")
            return jsonify({**self.default_puzzle, "source": "default"})

    def validate_word(self, data):
        """Validate if the word can be used in the current chain"""
        if not data or not isinstance(data, dict):
            logger.error(f"Invalid data format received: {data}")
            return jsonify({"error": "Invalid request format"}), 400

        word1 = data.get('current_word')
        word2 = data.get('next_word')

        if not word1 and not word2 and data.get('word'):
            return jsonify({"error": "Please provide both current_word and next_word"}), 400

        if not word1 or not word2:
            logger.warning(f"Missing words in request: {data}")
            return jsonify({"error": "Missing words"}), 400

        try:
            response = requests.get(
                f"{Config.HF_SPACE_URL}/check-similarity",
                params={"word1": word1, "word2": word2}
            )

            if response.status_code == 200:
                result = response.json()
                is_valid = result.get("valid", result.get("similarity", 0) > 0.47)
                response_data = {"is_valid": is_valid, "similarity": result["similarity"]}
                if result.get("message"):
                    response_data["message"] = result["message"]
                return jsonify(response_data)
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_hint(self, data):
        """Get hint for the current word chain"""
        current_word = data.get('current_word')
        target_word = data.get('target_word')

        if not current_word or not target_word:
            return jsonify({"error": "Missing current_word or target_word"}), 400

        try:
            response = requests.get(
                f"{Config.HF_SPACE_URL}/hint",
                params={"current_word": current_word, "target_word": target_word, "threshold": 0.47}
            )
            if response.status_code == 200:
                return jsonify(response.json())
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def check_similarity(self, data):
        """Check similarity between two words"""
        word1 = data.get('word1')
        word2 = data.get('word2')

        if not word1 or not word2:
            return jsonify({"error": "Missing word1 or word2"}), 400

        try:
            response = requests.get(
                f"{Config.HF_SPACE_URL}/check-similarity",
                params={"word1": word1, "word2": word2}
            )
            if response.status_code == 200:
                return jsonify(response.json())
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500
