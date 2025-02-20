from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from collections import deque
from gensim.models import KeyedVectors
from supabase_config import supabase, DAILY_WORDS_TABLE, BEST_CHAINS_TABLE, USER_ATTEMPTS_TABLE
from llm_hints import HintGenerator
import time
import os

# Load the GloVe model
print("Loading word embeddings...")
model = KeyedVectors.load_word2vec_format("glove.word2vec.txt")
print("Word embeddings loaded!")

# Initialize hint generator
hint_generator = HintGenerator()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type", "Authorization"]}})  # Enable CORS with auth headers

# Load pre-generated chains
with open("word_chains.json") as f:
    game_data = json.load(f)

def get_daily_words():
    """Get the current day's word pair from Supabase"""
    today = datetime.now().date().isoformat()
    response = supabase.table(DAILY_WORDS_TABLE)\
        .select('*')\
        .eq('date', today)\
        .execute()
    
    if not response.data:
        return None
    return response.data[0]

def get_best_chain(word_pair_id):
    """Get the best chain for a word pair"""
    response = supabase.table(BEST_CHAINS_TABLE)\
        .select('*')\
        .eq('word_pair_id', word_pair_id)\
        .order('chain_length', ascending=True)\
        .limit(1)\
        .execute()
    
    return response.data[0] if response.data else None

def calculate_similarity(word1, word2):
    """Calculate semantic similarity between two words using GloVe"""
    try:
        similarity = model.similarity(word1, word2)
        return round(similarity * 100, 2)
    except KeyError:
        return 0.0

def build_valid_moves(chains):
    """Precompute valid moves for each step"""
    valid_moves = {}
    for difficulty, chain in chains.items():
        for i in range(len(chain)-1):
            current = chain[i]
            next_word = chain[i+1]
            if current not in valid_moves:
                valid_moves[current] = {}
            if difficulty not in valid_moves[current]:
                valid_moves[current][difficulty] = []
            if next_word not in valid_moves[current][difficulty]:
                valid_moves[current][difficulty].append(next_word)
    return valid_moves

def get_chain_length(difficulty):
    """Get the maximum chain length for a given difficulty"""
    return len(game_data['chains'][difficulty])

def get_remaining_moves(current_path, difficulty):
    """Get the number of remaining moves allowed"""
    max_length = get_chain_length(difficulty)
    return max_length - len(current_path)

def find_possible_paths(current_word, target_word, difficulty, current_path):
    """Find all valid paths that contain the current path and lead to target"""
    # Get all possible paths for this difficulty
    all_paths = game_data['all_paths'][difficulty]
    current_path_str = '->'.join(current_path)
    
    # Filter paths that contain our current path and lead to target
    valid_paths = []
    remaining_moves = get_chain_length(difficulty) - len(current_path)
    
    for path in all_paths:
        path_str = '->'.join(path)
        if current_path_str in path_str and path[-1] == target_word:
            # Check if the remaining path length fits within our moves
            remaining_path = path[len(current_path):]
            if len(remaining_path) <= remaining_moves:
                valid_paths.append(remaining_path)
    
    return valid_paths

def is_valid_next_word(current_word, proposed_word, difficulty, current_path):
    """Check if the proposed word is a valid next word"""
    # Check if word is already in path
    if proposed_word in current_path:
        return False, "Word already used in chain"

    # Calculate semantic similarity
    similarity = calculate_similarity(current_word, proposed_word)
    if similarity < 50:  # Using same threshold as model_runner.py
        return False, f"Word similarity too low ({similarity}%)"

    # Get the chain for this difficulty
    chain = game_data['chains'][difficulty]
    
    # Find current and proposed word positions in the chain
    try:
        current_idx = chain.index(current_word)
        proposed_idx = chain.index(proposed_word)
    except ValueError:
        return False, "Word not in valid chain for this difficulty"

    # Check if proposed word comes after current word in the chain
    if proposed_idx <= current_idx or proposed_idx > current_idx + 1:
        return False, "Invalid word sequence for this difficulty"

    # Check if word exists in transition graph
    if current_word not in game_data['transition_graph'] or \
       proposed_word not in game_data['transition_graph'][current_word]:
        return False, "Invalid word transition"

    return True, similarity

# Precompute valid moves
valid_moves = build_valid_moves(game_data["chains"])

@app.route('/auth/verify', methods=['POST'])
def verify_token():
    """Verify Supabase access token"""
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        return jsonify({'success': True, 'user': user})
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/game_state')
def get_game_state():
    daily_words = get_daily_words()
    if not daily_words:
        return jsonify({'error': 'No game available today'}), 404
    
    best_chain = get_best_chain(daily_words['id'])
    
    return jsonify({
        "id": daily_words['id'],
        "start": {
            "word": daily_words['start_word'],
            "definition": daily_words['start_definition']
        },
        "end": {
            "word": daily_words['end_word'],
            "definition": daily_words['end_definition']
        },
        "bestChain": best_chain['chain'] if best_chain else None,
        "bestChainUser": best_chain['user_name'] if best_chain else None,
        "dateGenerated": daily_words['date']
    })

@app.route('/validate', methods=['POST'])
def validate_word():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Not authenticated'}), 401
        
    data = request.json
    current_word = data.get('currentWord')
    proposed_word = data.get('proposedWord').lower()
    current_path = data.get('currentPath', [])
    word_pair_id = data.get('wordPairId')
    
    if not all([current_word, proposed_word, word_pair_id]):
        return jsonify({"valid": False, "error": "Missing parameters"})
    
    # Get current game data
    daily_words = get_daily_words()
    if not daily_words or daily_words['id'] != word_pair_id:
        return jsonify({"error": "Invalid game"}), 404
    
    # Calculate similarity
    similarity = calculate_similarity(current_word, proposed_word)
    
    # Check if word is already in path
    if proposed_word in current_path:
        return jsonify({
            "valid": False,
            "error": "Word already used in chain",
            "similarity": similarity
        })
    
    # Check similarity threshold
    if similarity < 60:  # 60% threshold
        return jsonify({
            "valid": False,
            "error": f"Word similarity too low ({similarity}%)",
            "similarity": similarity
        })
    
    # Get user info
    user = supabase.auth.get_user(token)
    
    # Check if chain is complete
    new_path = current_path + [proposed_word]
    is_complete = proposed_word == daily_words['end_word']
    
    # If chain is complete, check if it's the best chain
    is_best = False
    if is_complete:
        # Record the attempt
        supabase.table(USER_ATTEMPTS_TABLE).insert({
            'word_pair_id': word_pair_id,
            'user_id': user.id,
            'chain': new_path,
            'chain_length': len(new_path)
        }).execute()
        
        # Check if it's the best chain
        best_chain = get_best_chain(word_pair_id)
        if not best_chain or len(new_path) < best_chain['chain_length']:
            supabase.table(BEST_CHAINS_TABLE).upsert({
                'word_pair_id': word_pair_id,
                'user_id': user.id,
                'user_name': user.user_metadata.get('full_name', 'Anonymous'),
                'chain': new_path,
                'chain_length': len(new_path)
            }).execute()
            is_best = True
    
    # Get semantic explanation if words are connected
    explanation = hint_generator.explain_connection(current_word, proposed_word, similarity)
    
    return jsonify({
        "valid": True,
        "similarity": similarity,
        "isComplete": is_complete,
        "isBest": is_best,
        "explanation": explanation
    })

@app.route('/hint', methods=['POST'])
def get_hint():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    current_word = data.get('currentWord')
    current_path = data.get('currentPath', [])
    word_pair_id = data.get('wordPairId')
    
    if not all([current_word, word_pair_id]):
        return jsonify({"error": "Missing parameters"})
    
    # Get current game data
    daily_words = get_daily_words()
    if not daily_words or daily_words['id'] != word_pair_id:
        return jsonify({"error": "Invalid game"}), 404
    
    # Generate hint
    hint = hint_generator.generate_hint(
        current_word=current_word,
        target_word=daily_words['end_word'],
        current_path=current_path,
        similarity_threshold=0.6
    )
    
    return jsonify({
        "hint": hint
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)