import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// Get the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001';
  }
  return '';
};

function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${getBaseUrl()}/api/daily-puzzle`)
      .then(response => {
        setPuzzle({
          startWord: response.data.start_word,
          endWord: response.data.end_word,
          startDefinition: response.data.start_definition,
          endDefinition: response.data.end_definition
        });
      })
      .catch(error => {
        setError("Failed to load puzzle. Please try again.");
        console.error("Error:", error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Connectle</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : puzzle ? (
          <div className="puzzle-container">
            <div className="word-box">
              <h2>Start Word</h2>
              <p className="word">{puzzle.startWord}</p>
              <p className="definition">{puzzle.startDefinition}</p>
            </div>
            <div className="word-box">
              <h2>End Word</h2>
              <p className="word">{puzzle.endWord}</p>
              <p className="definition">{puzzle.endDefinition}</p>
            </div>
          </div>
        ) : (
          <p>No puzzle available</p>
        )}
      </header>
    </div>
  );
}

export default App;
