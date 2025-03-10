import inflect
import logging
import requests
from .config import Config

logger = logging.getLogger(__name__)
p = inflect.engine()

def is_valid_english_word(word):
    """
    Check if a word is a valid English word using the Hugging Face API.
    
    Args:
        word (str): The word to check
        
    Returns:
        bool: True if the word is valid, False otherwise
    """
    if not word or len(word) <= 1:
        return False
        
    try:
        # Use the same API endpoint that's used in the check_word route
        hf_space_url = Config.HF_SPACE_URL
        response = requests.get(
            f"{hf_space_url}/check-word",
            params={"word": word}
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("is_valid", False)
        return False
    except Exception as e:
        logger.error(f"Error checking word validity: {str(e)}")
        # If API call fails, use a simple heuristic
        return len(word) > 2  # Most valid English words are at least 3 characters

def singularize_word(word):
    """
    Convert a word to its singular form if it's plural, with validation to prevent incorrect singularization.
    Uses the Hugging Face API to validate that the singularized form is a valid English word.
    
    Args:
        word (str): The word to singularize
        
    Returns:
        str: The singular form of the word, or the original word if it's already singular
    """
    if not word:
        return word
    
    try:
        # First check if the original word is valid
        original_is_valid = is_valid_english_word(word)
        
        # Check if the word is plural according to inflect
        singular_form = p.singular_noun(word)
        
        if not singular_form:
            # Word is already singular according to inflect
            logger.debug(f"Word '{word}' is already singular")
            return word
        
        # Check if the singularized form is a valid English word
        singular_is_valid = is_valid_english_word(singular_form)
        
        # If the original word is valid but the singular form isn't, keep the original
        if original_is_valid and not singular_is_valid:
            logger.info(f"Prevented incorrect singularization of '{word}' to '{singular_form}' - singular form is not valid")
            return word
        
        # Special case for words ending with 's' where removing just the 's' creates the singular
        # These are often incorrectly singularized by the library (like 'glass' -> 'glas')
        if word.lower().endswith('s') and singular_form.lower() == word.lower()[:-1]:
            # If the original word is valid and ends with 's', it's likely a singular word
            # that the library is incorrectly trying to singularize (like 'glass', 'class', etc.)
            if original_is_valid and len(word) >= 4:
                logger.info(f"Prevented suspicious singularization of '{word}' to '{singular_form}'")
                return word
        
        # If we get here and both forms are valid, or original is invalid but singular is valid,
        # return the singular form
        if singular_is_valid:
            logger.info(f"Singularized '{word}' to '{singular_form}'")
            return singular_form
        else:
            # If neither form is valid, prefer the original
            logger.info(f"Kept original word '{word}' as singularization '{singular_form}' is not valid")
            return word
            
    except Exception as e:
        logger.error(f"Error singularizing word '{word}': {str(e)}")
        # Return the original word if there's an error
        return word


def are_singular_forms_same(word1, word2):
    """
    Check if two words have the same singular form.
    
    Args:
        word1 (str): First word to compare
        word2 (str): Second word to compare
        
    Returns:
        bool: True if both words have the same singular form, False otherwise
    """
    if not word1 or not word2:
        return False
    
    try:
        # Get singular forms of both words
        singular1 = singularize_word(word1.lower())
        singular2 = singularize_word(word2.lower())
        
        # Check if the singular forms are the same
        if singular1 == singular2:
            logger.info(f"Words '{word1}' and '{word2}' have the same singular form: '{singular1}'")
            return True
        else:
            logger.debug(f"Words '{word1}' and '{word2}' have different singular forms: '{singular1}' vs '{singular2}'")
            return False
    except Exception as e:
        logger.error(f"Error comparing singular forms of '{word1}' and '{word2}': {str(e)}")
        # Default to False if there's an error
        return False
