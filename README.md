# Connectle: Semantic Word Chain Game

## 📖 Overview

Connectle is an engaging word chain game that challenges players to find a path between two seemingly unrelated words by making single-word steps. The unique twist: each consecutive pair of words must have at least 50% semantic similarity, as determined by advanced NLP algorithms. This creates a puzzle that tests both vocabulary and creative thinking.

Unlike traditional word association games that rely on direct relationships, Connectle leverages semantic similarity to create more nuanced connections between words, making for a deeper and more intellectually stimulating experience.

## ✨ Features

### Core Gameplay
- **Daily Word Pairs**: A new start and end word pair each day with definitions
- **Semantic Validation**: Words must have at least 50% semantic similarity to be accepted
- **Unlimited Attempts**: Players can try as many times as needed to solve the puzzle
- **Word Validation**: Real-time checking against an English dictionary
- **Chain Visualization**: Visual representation of the word chain as it's built
- **Backtracking**: Option to remove the last word and try a different path

### Player Assistance
- **NLP-Powered Hints**: Get suggestions when stuck based on semantic proximity
- **Word Definitions**: Access to definitions for better understanding of word meanings
- **Similarity Scores**: See exactly how similar your words are to guide your choices
- **Progress Tracking**: Visual indication of how close you are to the target word

### User Experience
- **Responsive Design**: Optimized for both desktop and mobile play
- **Dark/Light Themes**: Toggle between visual modes for comfort
- **Animations**: Smooth transitions and feedback using Framer Motion
- **Error Handling**: Clear feedback when words don't meet criteria
- **Loading States**: Visual indicators during API calls

### Game Statistics
- **Best Chain Tracking**: Records your shortest successful path
- **Completion Time**: Tracks how long it takes to solve the puzzle
- **Hints Used**: Counts how many hints were requested
- **Share Results**: Option to share your success on social media
- **Daily Stats**: View your performance compared to other players

## 🎮 How to Play

1. **Start**: You'll see the starting word and the target word, each with its definition
2. **Enter Words**: Type a word that is semantically similar to the current word (at least 60% similarity)
3. **Build Chain**: Continue adding words that are similar to your previous word
4. **Reach Target**: Keep building your chain until you reach the target word
5. **Optimize**: Try to find the shortest possible path between the words

### Example Chain

Starting word: **ocean** → **water** → **drink** → **food** → **meal** → Target word: **dinner**

Each consecutive pair of words has at least 50% semantic similarity, creating a valid path from "ocean" to "dinner".

## 🏗️ Architecture
- I wanted to play around with GPT 4o's image capabilities, so here's a system architecture diagram it generated

<img src="https://github.com/user-attachments/assets/a7a53120-b051-4abe-93e4-deebda16aba0" alt="architecture diagram" width="300"/>


Connectle is built with a modern, scalable architecture consisting of five main components:

### 1. Frontend Client
- **React/TypeScript Application**: Built with Next.js for server-side rendering
- **Responsive UI**: Designed with Tailwind CSS and Framer Motion
- **State Management**: React Context API for global state
- **Analytics**: Vercel Analytics for tracking user interactions
- **Error Boundary**: Comprehensive error handling

### 2. Backend API
- **Flask Application**: RESTful API endpoints for game logic
- **Rate Limiting**: Protection against abuse
- **Caching**: Performance optimization for common requests
- **Error Handling**: Graceful error responses
- **Logging**: Comprehensive activity logging

### 3. Supabase Database
- **Daily Puzzles**: Storage for pre-generated word pairs
- **User Statistics**: Anonymous game completion data
- **Game History**: Record of past puzzles
- **Authentication**: Optional user accounts (future feature)

### 4. HuggingFace NLP Model
- **Sentence Transformer**: all-MiniLM-L6-v2 model for semantic similarity
- **Word Embeddings**: 10,000+ pre-computed word vectors
- **FastAPI Service**: High-performance API for NLP operations
- **Caching**: Optimized response times for common words

### 5. Utility Scripts
- **Puzzle Generation**: Scripts to create semantically interesting word pairs
- **Cron Jobs**: Automated daily puzzle updates
- **Data Processing**: Tools for managing word embeddings
- **Admin Tools**: Maintenance and monitoring utilities

## 🛠️ Technologies

### Frontend
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe JavaScript
- **Next.js 13**: React framework with SSR/SSG capabilities
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Vercel Analytics**: User behavior tracking
- **React Testing Library**: Component testing

### Backend
- **Python 3.9+**: Core programming language
- **Flask 2.0+**: Lightweight web framework
- **Flask-Limiter**: API rate limiting
- **Requests**: HTTP client for API calls
- **Logging**: Comprehensive logging

### NLP & Data Processing
- **HuggingFace Transformers**: State-of-the-art NLP models
- **Sentence-Transformers**: Semantic similarity calculation
- **NLTK**: Natural Language Toolkit for word processing
- **WordNet**: Lexical database for word relationships
- **NumPy**: Numerical operations for embeddings
- **FastAPI**: High-performance API framework

### Database & Storage
- **Supabase**: PostgreSQL database with real-time capabilities
- **JSON**: Data interchange format
- **Redis**: Optional caching layer (for production)

### DevOps & Deployment
- **Vercel**: Frontend and serverless backend hosting
- **HuggingFace Spaces**: NLP model hosting
- **GitHub Actions**: CI/CD pipeline
- **Docker**: Containerization for local development

## 📦 Installation

### Prerequisites
- Node.js 16+
- Python 3.9+
- Git

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/connectle.git
cd connectle/frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_HF_SPACE_URL=https://yourusername-connectle-huggingface.hf.space" > .env.local

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to API directory
cd ../api

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python run.py
```

### Huggingface Space Setup
```bash
# Navigate to HuggingFace directory
cd ../connectle-huggingface

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app:app --reload --port 8000
```

## 🚀 Development
Project Structure
```bash
connectle/
├── api/                    # Backend API
│   ├── app/                # Flask application
│   │   ├── __init__.py     # App initialization
│   │   ├── config.py       # Configuration
│   │   ├── routes.py       # API endpoints
│   │   └── services/       # Business logic
│   │       └── game_service.py  # Game logic implementation
│   ├── scripts/            # Utility scripts
│   │   └── generate_puzzles.py  # Puzzle generation
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   │   ├── favicon.ico     # Site favicon
│   │   └── logo.png        # Connectle logo
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   │   ├── connectle-game.tsx  # Main game component
│   │   │   ├── word-card.tsx       # Word display component
│   │   │   ├── word-chain.tsx      # Chain visualization
│   │   │   ├── word-input.tsx      # User input component
│   │   │   ├── hint-display.tsx    # Hint component
│   │   │   ├── stats-modal.tsx     # Statistics display
│   │   │   ├── info-button.tsx     # Help/info button
│   │   │   ├── feedback-link.tsx   # User feedback component
│   │   │   └── error-boundary.tsx  # Error handling
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useAnalytics.ts     # Analytics hook
│   │   │   └── useLocalStorage.ts  # Storage hook
│   │   ├── utils/          # Utility functions
│   │   │   └── analytics.ts        # Analytics implementation
│   │   ├── providers/      # Context providers
│   │   │   └── analytics-provider.tsx  # Analytics context
│   │   ├── config/         # Configuration
│   │   │   └── analytics.ts        # Analytics config
│   │   ├── styles/         # CSS styles
│   │   │   └── globals.css         # Global styles
│   │   └── pages/          # Next.js pages
│   │       ├── index.tsx           # Homepage
│   │       ├── _app.tsx            # App wrapper
│   │       └── api/                # API routes
│   ├── package.json        # NPM dependencies
│   └── tsconfig.json       # TypeScript config
├── connectle-huggingface/  # HuggingFace integration
│   ├── app.py              # FastAPI application
│   └── requirements.txt    # Python dependencies
├── supabase/               # Database migrations
│   └── migrations/         # SQL migrations
├── .github/                # GitHub configuration
│   └── workflows/          # CI/CD workflows
├── ANALYTICS.md            # Analytics documentation
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

## 📊 Analytics

Connectle uses Vercel Analytics to track user interactions and game events:

### Tracked Events
- Game starts and completions
- Word submissions (success/failure)
- Hint requests
- Theme toggling
- Error occurrences
- Page views

### Analytics Configuration
Analytics can be enabled/disabled via the `NEXT_PUBLIC_ANALYTICS_ENABLED` environment variable. For more details, see the [ANALYTICS.md](ANALYTICS.md) documentation.

## 🚢 Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Import the repository into Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Leave empty for relative API calls
   - `NEXT_PUBLIC_HF_SPACE_URL`: URL of your HuggingFace space

### HuggingFace Space Deployment

1. Create a new Space on HuggingFace
2. Connect your GitHub repository
3. Set the Space SDK to "FastAPI"
4. Configure build settings to use the `connectle-huggingface` directory

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations from the `supabase` directory
3. Set up the connection in your backend environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow the existing code style
- Write tests for new features
- Update documentation as needed

## 📜 License

This project is licensed under the MIT License

## 🙏 Acknowledgements

- [HuggingFace](https://huggingface.co/) for hosting my own NLP models
- [Vercel](https://vercel.com/) for hosting
- [Supabase](https://supabase.com/) for database services
- [WordNet](https://wordnet.princeton.edu/) for lexical database
- All contributors and players who make Connectle better every day

---

<p align="center">
  Made with ❤️ by <a href="https://www.linkedin.com/in/aakashpathak1/">Aakash Pathak</a>
</p>
