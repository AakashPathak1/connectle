#!/usr/bin/env python3
"""
Word Pair Generator for Connectle

This script generates word pairs for the Connectle game and stores them in Supabase.
Each word pair consists of a start word, an end word, and their definitions.

Usage:
    python word_pair_generator.py [--count COUNT] [--daily] [--set-daily ID] [--random-daily] [--list] [--list-limit LIMIT]

Options:
    --count COUNT    Number of word pairs to generate (default: 1)
    --daily          Mark the first generated puzzle as the daily puzzle
    --set-daily ID   Set an existing puzzle as daily by its ID
    --random-daily   Set a random puzzle as daily
    --list           List the most recent puzzles
    --list-limit LIMIT  Number of puzzles to list (default: 10)

Examples:
    # Generate one word pair
    python word_pair_generator.py

    # Generate 5 word pairs
    python word_pair_generator.py --count 5

    # Generate 3 word pairs and mark the first one as the daily puzzle
    python word_pair_generator.py --count 3 --daily

    # Set an existing puzzle as daily
    python word_pair_generator.py --set-daily <puzzle_id>

    # Set a random puzzle as daily
    python word_pair_generator.py --random-daily

    # List the most recent puzzles
    python word_pair_generator.py --list
"""

import logging
import random
import ssl
import nltk
import uuid
from datetime import datetime, timedelta
from collections import defaultdict, deque
from nltk.corpus import wordnet
from nltk.corpus import brown
import sys
import os
import certifi
from supabase import create_client, Client
import argparse

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(levelname)s - %(message)s')

# Configure SSL for NLTK
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data
nltk.data.path.append(certifi.where())
nltk.download('wordnet', quiet=True)

# Add the parent directory to sys.path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.supabase_config import PUZZLES_TABLE
from app.config import Config

# Debug logging for Supabase configuration
logging.info(f"Supabase URL: {Config.SUPABASE_URL}")
logging.info(f"Has valid Supabase config: {Config.has_valid_supabase_config()}")

# Create a local Supabase client
supabase_client = None
if Config.has_valid_supabase_config():
    try:
        supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        logging.info("Local Supabase client created successfully")
    except Exception as e:
        logging.error(f"Failed to create local Supabase client: {e}")
else:
    logging.warning("Invalid Supabase configuration")

# Constants
MIN_WORD_SIMILARITY = 0.6
MAX_ATTEMPTS = 100

def load_embeddings():
    """Load words and their frequencies from Brown corpus"""
    logging.info("Loading words from Brown corpus...")
    word_freq = defaultdict(int)
    for word in brown.words():
        if word.isalpha():
            word_freq[word.lower()] += 1
    return word_freq

def load_common_words(word_freq):
    """Load and filter common words, excluding overly specific nouns and rare adjectives"""
    filtered_words = []
    MAX_HYPERNYM_DEPTH = 8  # Adjust this to control noun specificity
    MIN_WORD_FREQ = 5  # Minimum frequency in Brown corpus
    
    # Sort words by frequency
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    for word, freq in sorted_words:
        # Skip rare words
        if freq < MIN_WORD_FREQ:
            continue
            
        # Only consider single words
        if ' ' in word or '-' in word:
            continue
            
        # Check if it's a noun or adjective
        synsets = wordnet.synsets(word)
        if not synsets:
            continue
            
        primary_synset = synsets[0]
        pos = primary_synset.pos()
        
        # For nouns, check the hypernym depth
        if pos == 'n':
            # Get the hypernym path length to root
            hypernym_paths = primary_synset.hypernym_paths()
            if hypernym_paths:
                min_depth = min(len(path) for path in hypernym_paths)
                if min_depth > MAX_HYPERNYM_DEPTH:
                    continue
            filtered_words.append(word)
        # For adjectives, include if they're common enough
        elif pos == 'a':
            # More stringent frequency requirement for adjectives
            if freq >= MIN_WORD_FREQ * 2:
                filtered_words.append(word)
    
    return filtered_words

def get_word_definition(word):
    """Get the 3 most relevant definitions of a word based on sense frequency"""
    synsets = wordnet.synsets(word)
    if not synsets:
        return None
        
    # Sort synsets by their sense count (higher count = more common usage)
    sorted_synsets = sorted(
        [(syn, syn.lemmas()[0].count() if syn.lemmas() else 0) for syn in synsets],
        key=lambda x: x[1],
        reverse=True
    )
    
    # Get unique definitions from the most common senses
    seen_defs = set()
    relevant_defs = []
    for syn, _ in sorted_synsets:
        definition = syn.definition()
        if definition not in seen_defs:
            seen_defs.add(definition)
            relevant_defs.append(definition)
            if len(relevant_defs) == 3:  # Limit to top 3
                break
    
    return '\n'.join(f"- {d}" for d in relevant_defs)

class WordPairGenerator:
    def __init__(self, model, common_words):
        self.model = model
        self.common_words = common_words
        self.reset()
    
    def reset(self):
        """Reset the transition graph"""
        self.transition_graph = defaultdict(list)
    
    def are_words_semantically_unrelated(self, word1, word2):
        """Check if two words are semantically unrelated using WordNet"""
        try:
            synsets1 = wordnet.synsets(word1)
            synsets2 = wordnet.synsets(word2)
            if not synsets1 or not synsets2:
                return True
                
            # Get max similarity between any synset pair
            max_sim = max(
                s1.path_similarity(s2) or 0
                for s1 in synsets1
                for s2 in synsets2
            )
            return max_sim < 0.2  # Lower threshold since path_similarity is different
        except:
            return True
    
    def generate_word_pair(self):
        """Generate a pair of semantically unrelated words"""
        max_attempts = 50
        attempts = 0
        
        while attempts < max_attempts:
            attempts += 1
            
            # Select two random common words
            start = random.choice(self.common_words)
            end = random.choice(self.common_words)
            
            # Skip if they're the same word
            if start == end:
                continue
                
            # Check if they're semantically unrelated
            if not self.are_words_semantically_unrelated(start, end):
                continue
                
            # Get definitions
            start_def = get_word_definition(start)
            end_def = get_word_definition(end)
            
            if not start_def or not end_def:
                continue
                
            return start, end, start_def, end_def
            
        return None, None, None, None

def word_pair_exists(start_word, end_word):
    """Check if a word pair already exists in the database"""
    try:
        if not supabase_client:
            logging.error("No valid Supabase client available")
            return False
            
        # Query for existing pairs with the same start and end words
        response = supabase_client.table(PUZZLES_TABLE) \
            .select("*") \
            .eq("start_word", start_word) \
            .eq("end_word", end_word) \
            .execute()
            
        # Return True if any matching pairs were found
        return len(response.data) > 0
    except Exception as e:
        logging.error(f"Error checking for existing word pair: {e}")
        return False

def store_puzzle(start_word, end_word, start_def, end_def, is_daily=False):
    """Store a puzzle in Supabase"""
    try:
        # Check if we have a valid Supabase client
        if not supabase_client:
            logging.error("No valid Supabase client available")
            return False
            
        # Check if this word pair already exists
        if word_pair_exists(start_word, end_word):
            logging.warning(f"Word pair already exists: {start_word} -> {end_word}")
            return False
        
        # Prepare data matching the schema
        data = {
            'id': str(uuid.uuid4()),  # Generate a new UUID
            'start_word': start_word,
            'end_word': end_word,
            'start_definition': start_def,
            'end_definition': end_def,
            'created_at': datetime.now().isoformat(),  # Current timestamp
            'is_daily': is_daily,  # Set the is_daily flag
        }
        
        # Store in Supabase
        response = supabase_client.table(PUZZLES_TABLE).insert(data).execute()
        
        logging.info(f"Stored puzzle: {start_word} -> {end_word}")
        return True
    except Exception as e:
        logging.error(f"Failed to store puzzle: {e}")
        return False

def set_puzzle_as_daily(puzzle_id):
    """Set a puzzle as the daily puzzle and unset any other daily puzzles"""
    try:
        # Check if we have a valid Supabase client
        if not supabase_client:
            logging.error("No valid Supabase client available")
            return False
            
        # First, check if the puzzle exists
        check_response = supabase_client.table(PUZZLES_TABLE).select("*").eq("id", puzzle_id).execute()
        if not check_response.data:
            logging.error(f"Puzzle with ID {puzzle_id} not found")
            return False
            
        logging.info(f"Found puzzle: {check_response.data[0]['start_word']} -> {check_response.data[0]['end_word']}")
            
        # Reset all existing daily puzzles
        reset_response = supabase_client.table(PUZZLES_TABLE).update({"is_daily": False}).eq("is_daily", True).execute()
        logging.info("Reset all daily puzzles")
        
        # Set the specified puzzle as daily
        update_response = supabase_client.table(PUZZLES_TABLE).update({"is_daily": True}).eq("id", puzzle_id).execute()
        
        # The update might return an empty data array even if successful
        # Consider it a success if we got a 200 OK response
        logging.info(f"Set puzzle {puzzle_id} as daily")
        return True
    except Exception as e:
        logging.error(f"Failed to set puzzle as daily: {e}")
        return False

def set_random_daily_puzzle():
    """Set a random puzzle as daily"""
    try:
        # Check if we have a valid Supabase client
        if not supabase_client:
            logging.error("No valid Supabase client available")
            return False
            
        # Get all puzzles
        puzzles = list_puzzles(limit=100)  # Get up to 100 puzzles to choose from
        if not puzzles:
            logging.error("No puzzles found to set as daily")
            return False
            
        # Choose a random puzzle
        import random
        random_puzzle = random.choice(puzzles)
        puzzle_id = random_puzzle['id']
        
        logging.info(f"Selected random puzzle: {random_puzzle['start_word']} -> {random_puzzle['end_word']}")
        
        # Try to set it as daily
        success = set_puzzle_as_daily(puzzle_id)
        
        if success:
            logging.info(f"Successfully set puzzle {puzzle_id} as daily")
            return True
        else:
            logging.error(f"Failed to set puzzle {puzzle_id} as daily")
            
            # Provide SQL instructions for manual update
            print("\nTo manually set this puzzle as daily, run these SQL commands in the Supabase SQL Editor:")
            print("\n-- Reset all daily puzzles")
            print("UPDATE puzzles SET is_daily = FALSE WHERE is_daily = TRUE;")
            print(f"\n-- Set puzzle {puzzle_id} as daily")
            print(f"UPDATE puzzles SET is_daily = TRUE WHERE id = '{puzzle_id}';")
            
            # Provide policy instructions
            print("\nYou may need to add an UPDATE policy to your puzzles table:")
            print("1. Go to the Authentication > Policies section")
            print("2. Find the 'puzzles' table")
            print("3. Click 'New Policy'")
            print("4. Create a policy named 'Service can update daily puzzles'")
            print("5. Set the policy type to 'UPDATE'")
            print("6. Set the policy definition to 'true' or a more restrictive condition if needed")
            print("7. Apply it to the 'service_role' or appropriate role")
            
            return False
            
    except Exception as e:
        logging.error(f"Failed to set random daily puzzle: {e}")
        return False

def list_puzzles(limit=10):
    """List the most recent puzzles from Supabase"""
    try:
        # Check if we have a valid Supabase client
        if not supabase_client:
            logging.error("No valid Supabase client available")
            return []
            
        # Fetch puzzles from Supabase, ordered by creation date
        response = supabase_client.table(PUZZLES_TABLE).select("*").order("created_at", desc=True).limit(limit).execute()
        
        if response.data:
            return response.data
        else:
            logging.warning("No puzzles found in database")
            return []
    except Exception as e:
        logging.error(f"Failed to list puzzles: {e}")
        return []

def check_daily_puzzle_api():
    """Check the daily puzzle API to see which puzzle is currently being returned"""
    try:
        import requests
        
        # Get the API URL from environment or use localhost
        api_url = os.getenv("API_URL", "http://localhost:5001")
        
        # Call the daily puzzle API
        response = requests.get(f"{api_url}/api/daily-puzzle")
        
        if response.status_code >= 200 and response.status_code < 300:
            puzzle_data = response.json()
            print("\nCurrent daily puzzle from API:")
            print(f"  Start word: {puzzle_data.get('startWord')}")
            print(f"  End word: {puzzle_data.get('endWord')}")
            print(f"  Source: {puzzle_data.get('source')}")
            return puzzle_data
        else:
            print(f"Failed to get daily puzzle: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error checking daily puzzle API: {e}")
        return None

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate word pairs for Connectle puzzles')
    parser.add_argument('--count', type=int, default=1, help='Number of word pairs to generate (default: 1)')
    parser.add_argument('--daily', action='store_true', help='Mark the first generated puzzle as daily')
    parser.add_argument('--set-daily', type=str, help='Set an existing puzzle as daily by its ID')
    parser.add_argument('--random-daily', action='store_true', help='Set a random puzzle as daily')
    parser.add_argument('--check-api', action='store_true', help='Check which puzzle is currently being returned by the daily puzzle API')
    parser.add_argument('--list', action='store_true', help='List the most recent puzzles')
    parser.add_argument('--list-limit', type=int, default=10, help='Number of puzzles to list (default: 10)')
    args = parser.parse_args()
    
    try:
        # Initialize Supabase client
        if not supabase_client:
            logging.error("Failed to initialize Supabase client")
            sys.exit(1)
            
        # Check daily puzzle API if requested
        if args.check_api:
            check_daily_puzzle_api()
            sys.exit(0)
            
        # List puzzles if requested
        if args.list:
            puzzles = list_puzzles(args.list_limit)
            if puzzles:
                print(f"\nListing {len(puzzles)} most recent puzzles:")
                for p in puzzles:
                    daily_mark = "* " if p.get('is_daily', False) else "  "
                    print(f"{daily_mark}{p['id']} | {p['start_word']} -> {p['end_word']} | {p['created_at']} | is_daily: {p.get('is_daily', False)}")
                print("\n* = current daily puzzle")
            sys.exit(0)
            
        # Set an existing puzzle as daily
        if args.set_daily:
            if set_puzzle_as_daily(args.set_daily):
                print(f"Successfully set puzzle {args.set_daily} as daily")
            else:
                print(f"Failed to set puzzle {args.set_daily} as daily")
            sys.exit(0)
            
        # Set a random puzzle as daily
        if args.random_daily:
            if set_random_daily_puzzle():
                print("Successfully set a random puzzle as daily")
            else:
                print("Failed to set a random puzzle as daily")
            sys.exit(0)
        
        # Generate word pairs
        model = load_embeddings()
        common_words = load_common_words(model)
        generator = WordPairGenerator(model, common_words)
        
        # Track successful insertions
        successful_pairs = 0
        
        # Generate the specified number of word pairs
        for i in range(args.count):
            # Generate a word pair
            start, end, start_def, end_def = generator.generate_word_pair()
            
            if not start or not end:
                logging.error(f"Failed to generate word pair {i+1}/{args.count}")
                continue
                
            print(f"Pair {i+1}/{args.count}:")
            print(f"Start: {start}")
            print(f"Definition: {start_def}")
            print(f"End: {end}")
            print(f"Definition: {end_def}")
            print("---")
            
            # Determine if this should be marked as a daily puzzle
            is_daily = args.daily and i == 0
            
            # Store the puzzle
            if store_puzzle(start, end, start_def, end_def, is_daily=is_daily):
                logging.info(f"Successfully stored puzzle {i+1}/{args.count}")
                successful_pairs += 1
            else:
                logging.error(f"Failed to store puzzle {i+1}/{args.count}")
        
        # Summary
        logging.info(f"Generated and stored {successful_pairs}/{args.count} puzzles")
            
    except Exception as e:
        logging.error(f"An error occurred: {e}")
