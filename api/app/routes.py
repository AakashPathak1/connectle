from flask import Blueprint, request, jsonify
from .services.game_service import GameService

main = Blueprint('main', __name__)
game_service = GameService()

@main.route('/api/daily-puzzle', methods=['GET'])
def get_daily_puzzle():
    return game_service.get_daily_puzzle()

@main.route('/api/validate-word', methods=['POST'])
def validate_word():
    data = request.get_json()
    return game_service.validate_word(data)

@main.route('/api/hint', methods=['GET'])
def get_hint():
    data = {
        'current_word': request.args.get('current_word'),
        'target_word': request.args.get('target_word')
    }
    return game_service.get_hint(data)

@main.route('/api/check-similarity', methods=['GET'])
def check_similarity():
    data = {
        'word1': request.args.get('word1'),
        'word2': request.args.get('word2')
    }
    return game_service.check_similarity(data)
