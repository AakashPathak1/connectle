import requests
import sys

def test_similarity(space_url, word1, word2):
    try:
        response = requests.get(
            f"{space_url}/check-similarity",
            params={"word1": word1, "word2": word2}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Similarity between '{word1}' and '{word2}': {result['similarity']:.4f}")
        else:
            print(f"Error: {response.json().get('detail', 'Unknown error')}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python test_similarity.py <space_url> <word1> <word2>")
        sys.exit(1)
        
    space_url = sys.argv[1]
    word1 = sys.argv[2]
    word2 = sys.argv[3]
    
    test_similarity(space_url, word1, word2)
