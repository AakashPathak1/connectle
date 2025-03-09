import inflect
import logging

logger = logging.getLogger(__name__)
p = inflect.engine()

def singularize_word(word):
    """
    Convert a word to its singular form if it's plural.
    
    Args:
        word (str): The word to singularize
        
    Returns:
        str: The singular form of the word, or the original word if it's already singular
    """
    if not word:
        return word
    
    try:
        # Check if the word is plural
        if p.singular_noun(word):
            singular = p.singular_noun(word)
            logger.info(f"Singularized '{word}' to '{singular}'")
            return singular
        else:
            # Word is already singular
            logger.debug(f"Word '{word}' is already singular")
            return word
    except Exception as e:
        logger.error(f"Error singularizing word '{word}': {str(e)}")
        # Return the original word if there's an error
        return word
