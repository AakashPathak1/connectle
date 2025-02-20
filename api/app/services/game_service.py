from flask import jsonify
from datetime import datetime
from ..models.supabase_config import supabase, PUZZLES_TABLE

class GameService:
    def __init__(self):
        pass

    def get_daily_puzzle(self):
        """Get a random puzzle from Supabase"""
        try:
            response = supabase.table(PUZZLES_TABLE).select("*").execute()
            if response.data:
                # Get a random puzzle from the available ones
                puzzle = response.data[0]  # For now, just get the first one
                return jsonify({
                    "start_word": puzzle["start_word"],
                    "end_word": puzzle["end_word"],
                    "start_definition": puzzle["start_definition"],
                    "end_definition": puzzle["end_definition"]
                })
            return jsonify({"error": "No puzzles found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def validate_word(self, data):
        """Validate if the word can be used in the current chain"""
        # This is a placeholder - implement actual validation logic later
        return jsonify({"valid": True})
