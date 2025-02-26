#!/usr/bin/env python3
"""
Word Pair Generator for Connectle

This script generates word pairs for the Connectle game and stores them in Supabase.
Each word pair consists of a start word, an end word, and their definitions.

Usage:
    python word_pair_generator.py [--count COUNT] [--daily]

Options:
    --count COUNT    Number of word pairs to generate (default: 1)
    --daily          Mark the first generated puzzle as the daily puzzle

Examples:
    # Generate one word pair
    python word_pair_generator.py

    # Generate 5 word pairs
    python word_pair_generator.py --count 5

    # Generate 3 word pairs and mark the first one as the daily puzzle
    python word_pair_generator.py --count 3 --daily
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
        }
        
        # Store in Supabase
        response = supabase_client.table(PUZZLES_TABLE).insert(data).execute()
        
        logging.info(f"Stored puzzle: {start_word} -> {end_word}")
        return True
    except Exception as e:
        logging.error(f"Failed to store puzzle: {e}")
        return False

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate word pairs for Connectle puzzles')
    parser.add_argument('--count', type=int, default=1, help='Number of word pairs to generate (default: 1)')
    parser.add_argument('--daily', action='store_true', help='Mark the first generated puzzle as daily')
    args = parser.parse_args()
    
    try:
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
