from flask import jsonify
from datetime import datetime
import random
import os
from ..models.supabase_config import supabase, PUZZLES_TABLE

class GameService:
    def __init__(self):
        pass

    def get_daily_puzzle(self):
        """Get a random puzzle from Supabase"""
        try:
            # Check if environment variables are set
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            if not supabase_url or not supabase_key:
                return jsonify({"error": "Missing Supabase configuration"}), 500

            response = supabase.table(PUZZLES_TABLE).select("*").execute()
            if response.data:
                # Get a random puzzle from the available ones
                puzzle = random.choice(response.data)
                return jsonify({
                    "start_word": puzzle["start_word"],
                    "end_word": puzzle["end_word"],
                    "start_definition": puzzle["start_definition"],
                    "end_definition": puzzle["end_definition"]
                })
            return jsonify({"error": "No puzzles found"}), 404
        except Exception as e:
            import traceback
            error_msg = f"Error: {str(e)}\nTraceback: {traceback.format_exc()}"
            print(error_msg)  # This will show in Vercel logs
            return jsonify({"error": error_msg}), 500

    def validate_word(self, data):
        """Validate if the word can be used in the current chain"""
        import requests
        import os
        
        word1 = data.get('current_word')
        word2 = data.get('next_word')
        
        if not word1 or not word2:
            return jsonify({"error": "Missing words"}), 400
            
        try:
            # Get the Hugging Face space URL from environment variable
            hf_space_url = os.getenv('HF_SPACE_URL')
            response = requests.get(
                f"{hf_space_url}/check-similarity",
                params={"word1": word1, "word2": word2}
            )
            
            if response.status_code == 200:
                result = response.json()
                similarity = result["similarity"]
                # You can adjust this threshold based on your requirements
                is_valid = similarity > 0.4
                return jsonify({
                    "valid": is_valid,
                    "similarity": similarity
                })
            else:
                return jsonify({"error": response.json().get("detail", "Unknown error")}), response.status_code
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
