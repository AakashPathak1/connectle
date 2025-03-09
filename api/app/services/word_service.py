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
