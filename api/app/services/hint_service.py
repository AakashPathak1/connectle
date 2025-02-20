import os
from typing import List, Optional
import openai
from datetime import datetime

# Configure OpenAI (can be easily swapped with another provider)
openai.api_key = os.environ.get("OPENAI_API_KEY")

class HintGenerator:
    def __init__(self):
        self.model = "gpt-4"  # Can be easily changed to other models
        
    def generate_hint(self, 
                     current_word: str,
                     target_word: str,
                     current_path: List[str],
                     similarity_threshold: float = 0.6) -> str:
        """
        Generate a hint for the next word in the chain.
        
        Args:
            current_word: The current word in the chain
            target_word: The target word to reach
            current_path: List of words already used in the chain
            similarity_threshold: Minimum similarity required between consecutive words
        
        Returns:
            str: A hint for the next word
        """
        prompt = f"""
        In the word chain game, help the player find the next word with these rules:
        1. The word must be somewhat common in English
        2. It must have at least {similarity_threshold * 100}% semantic similarity with '{current_word}'
        3. It should help progress towards the target word '{target_word}'
        4. It cannot be any of these already used words: {', '.join(current_path)}
        
        Give a subtle hint about what kind of word they should try next. 
        Don't give away the exact word, but help them think in the right direction.
        Make the hint one sentence only.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are a helpful assistant for a word chain game."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7,
                max_tokens=100
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Sorry, I couldn't generate a hint right now. Try thinking of words related to both {current_word} and {target_word}."
    
    def explain_connection(self, word1: str, word2: str, similarity: float) -> str:
        """
        Explain why two words are semantically connected.
        
        Args:
            word1: First word
            word2: Second word
            similarity: Calculated similarity between the words
        
        Returns:
            str: An explanation of the semantic connection
        """
        prompt = f"""
        Explain why the words '{word1}' and '{word2}' are semantically related 
        (they have a {similarity:.1f}% similarity score).
        Keep the explanation to one or two sentences.
        Focus on the semantic relationship between the words.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are a helpful assistant explaining semantic relationships between words."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7,
                max_tokens=100
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"These words are {similarity:.1f}% similar in meaning."
