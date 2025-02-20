from flask import Blueprint, request, jsonify
from .services.game_service import GameService
from .services.hint_service import HintService

main = Blueprint('main', __name__)
game_service = GameService()
hint_service = HintService()

@main.route('/api/daily-puzzle', methods=['GET'])
def get_daily_puzzle():
    return game_service.get_daily_puzzle()

@main.route('/api/validate-word', methods=['POST'])
def validate_word():
    data = request.get_json()
    return game_service.validate_word(data)

@main.route('/api/hint', methods=['POST'])
def get_hint():
    data = request.get_json()
    return hint_service.generate_hint(data)
