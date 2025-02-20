import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [inputWord, setInputWord] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [similarity, setSimilarity] = useState(null);
  const [remainingPaths, setRemainingPaths] = useState(null);
  const [remainingMoves, setRemainingMoves] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [possiblePaths, setPossiblePaths] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:5001/game_state')
      .then(response => {
        setGameState(response.data);
        setCurrentPath([response.data.start]);
      })
      .catch(error => {
        setMessage({ text: 'Failed to load game state. Please try again.', type: 'error' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const startGame = () => {
    if (!selectedDifficulty) {
      setMessage({ text: 'Please select a difficulty level', type: 'error' });
      return;
    }
    setGameStarted(true);
    setCurrentPath([gameState.start]);
    updatePathInfo(gameState.start);
  };

  const updatePathInfo = async (word) => {
    try {
      const response = await axios.post('http://localhost:5001/validate', {
        currentWord: word,
        proposedWord: gameState.end,
        difficulty: selectedDifficulty,
        currentPath: currentPath
      });
      setRemainingPaths(response.data.remainingPaths);
    } catch (error) {
      console.error('Error updating path info:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputWord || !gameStarted) return;

    setIsLoading(true);
    setIsCalculating(true);
    setSimilarity(null);
    setPossiblePaths([]);
    
    try {
      const response = await axios.post('http://localhost:5001/validate', {
        currentWord: currentPath.slice(-1)[0],
        proposedWord: inputWord.toLowerCase(),
        difficulty: selectedDifficulty,
        currentPath: currentPath
      });

      setSimilarity(response.data.similarity);
      setRemainingPaths(response.data.remainingPaths);
      setRemainingMoves(response.data.remainingMoves);
      setPossiblePaths(response.data.possiblePaths);

      if (response.data.valid) {
        const newWord = inputWord.toLowerCase();
        setCurrentPath([...currentPath, newWord]);
        setInputWord('');
        setMessage({ text: 'Valid word!', type: 'success' });
        
        if (response.data.isFinal) {
          setMessage({ text: 'Congratulations! You won! 🎉', type: 'success' });
          setGameStarted(false);
        }
      } else {
        setMessage({ 
          text: response.data.error || 'Invalid word. Try another one!', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
      console.error('Error:', error);
    }
    setIsLoading(false);
    setIsCalculating(false);
  };

  const handleStepBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      updatePathInfo(newPath[newPath.length - 1]);
      setSimilarity(null);
    }
  };

  if (!gameState) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading game...</p>
    </div>
  );

  return (
    <div className="App">
      <h1>Word Chain Game</h1>
      <div className="game-info">
        <h2>From <span className="highlight">{gameState.start}</span> to <span className="highlight">{gameState.end}</span></h2>
      </div>

      {!gameStarted ? (
        <div className="difficulty-selection">
          <h3>Select Difficulty</h3>
          <div className="difficulty-buttons">
            {gameState.difficulties.map(diff => (
              <div key={diff} className="difficulty-option">
                <button
                  className={`difficulty-btn ${selectedDifficulty === diff ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
                <div className="chain-length">
                  Chain Length: {gameState.chainLengths[diff]} words
                </div>
              </div>
            ))}
          </div>
          <button 
            className="start-btn"
            onClick={startGame}
            disabled={!selectedDifficulty}
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="game-container">
          <div className="path-display">
            {currentPath.map((word, index) => (
              <React.Fragment key={index}>
                <span className="word">{word}</span>
                {index < currentPath.length - 1 && <span className="arrow">→</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="game-stats">
            <div className="stats-row">
              {isCalculating ? (
                <p className="calculating">
                  <span className="loading-dots">Calculating similarity</span>
                </p>
              ) : similarity !== null && (
                <p className={`similarity ${similarity < 50 ? 'low-similarity' : ''}`}>
                  Word Similarity: <span className="highlight">{similarity}%</span>
                </p>
              )}
              <p className="moves">
                Moves Left: <span className="highlight">{remainingMoves}</span>
              </p>
            </div>
            {remainingPaths !== null && (
              <div className="paths-container">
                <p className="paths">
                  Possible Solutions: <span className="highlight">{remainingPaths}</span>
                  {remainingPaths === 0 && <span className="no-paths">(No valid paths to target)</span>}
                </p>
                {possiblePaths.length > 0 && (
                  <div className="possible-paths">
                    <h4>Example paths to target:</h4>
                    {possiblePaths.map((path, index) => (
                      <div key={index} className="path-option">
                        {currentPath.join(' → ')} → <span className="future-path">{path.join(' → ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="controls">
            <form onSubmit={handleSubmit} className="input-form">
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="Enter next word"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !inputWord}>
                {isLoading ? 'Checking...' : 'Submit'}
              </button>
            </form>

            <button 
              className="step-back-btn"
              onClick={handleStepBack}
              disabled={currentPath.length <= 1 || isLoading}
            >
              Step Back
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;