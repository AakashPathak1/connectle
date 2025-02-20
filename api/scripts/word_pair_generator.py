import logging
import random
import ssl
import nltk
from datetime import datetime, timedelta
from collections import defaultdict, deque
from gensim.models import KeyedVectors
from nltk.corpus import wordnet
from supabase_config import supabase, PUZZLES_TABLE
import certifi

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

# Download NLTK data with SSL verification
nltk.data.path.append(certifi.where())
nltk.download('wordnet', quiet=True)

# Constants
MIN_WORD_SIMILARITY = 0.6
MAX_ATTEMPTS = 100
EMBEDDINGS_FILE = "glove.word2vec.txt"

def load_embeddings():
    """Load word embeddings from file"""
    logging.info("Loading embeddings...")
    return KeyedVectors.load_word2vec_format(EMBEDDINGS_FILE)

def load_common_words(model):
    """Load and filter common words"""
    words = []
    
    for word in model.key_to_index:
        # Only consider single words
        if ' ' in word or '-' in word:
            continue
            
        # Check if it's a noun or adjective
        synsets = wordnet.synsets(word)
        if not synsets:
            continue
            
        pos = synsets[0].pos()
        if pos in ['n', 'a']:  # noun or adjective
            words.append(word)
    
    return words

def get_word_definition(word):
    """Get the primary definition of a word"""
    synsets = wordnet.synsets(word)
    if not synsets:
        return None
    return synsets[0].definition()

class WordPairGenerator:
    def __init__(self, model, common_words):
        self.model = model
        self.common_words = common_words
        self.reset()
    
    def reset(self):
        """Reset the transition graph"""
        self.transition_graph = defaultdict(list)
    
    def are_words_semantically_unrelated(self, word1, word2):
        """Check if two words are semantically unrelated"""
        try:
            similarity = self.model.similarity(word1, word2)
            return similarity < 0.3  # Words with less than 30% similarity are considered unrelated
        except KeyError:
            return False
    
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

def store_puzzle(start_word, end_word, start_def, end_def, is_daily=False):
    """Store a puzzle in Supabase"""
    try:
        # Prepare data
        data = {
            'start_word': start_word,
            'end_word': end_word,
            'start_definition': start_def,
            'end_definition': end_def,
            'is_daily': is_daily,
            'transition_graph': {}  # Empty graph, will be built during gameplay
        }
        
        # If it's a daily puzzle, add tomorrow's date
        if is_daily:
            data['date'] = (datetime.now() + timedelta(days=1)).date().isoformat()
        
        # Store in Supabase with RLS bypass
        response = supabase.table(PUZZLES_TABLE).insert(data).execute()
        
        logging.info(f"Stored puzzle: {start_word} -> {end_word}")
        return True
    except Exception as e:
        logging.error(f"Failed to store puzzle: {e}")
        return False

if __name__ == "__main__":
    try:
        model = load_embeddings()
        common_words = load_common_words(model)
        generator = WordPairGenerator(model, common_words)
        
        # Generate and store one daily puzzle
        start, end, start_def, end_def = generator.generate_word_pair()
        
        if start and end:
            if store_puzzle(start, end, start_def, end_def, is_daily=True):
                logging.info("Successfully generated and stored daily puzzle!")
            else:
                logging.error("Failed to store daily puzzle")
        else:
            logging.error("Failed to generate suitable word pair")
            
    except Exception as e:
        logging.error(f"An error occurred: {e}")
