# Word Chain Game

A word chain game where players need to find a path between two unrelated words by making single-word steps, ensuring each consecutive pair of words has at least 60% semantic similarity.

## Project Structure

```
game/
├── api/                    # Backend API
│   ├── app/               # Flask application
│   ├── scripts/           # Utility scripts
│   └── tests/             # Backend tests
├── frontend/              # React frontend
└── supabase/             # Database migrations
```

## Features

- Daily word pairs with definitions
- Unlimited attempts to solve the chain
- LLM-powered hints and explanations
- Best chain tracking
- User authentication via Supabase
- Semantic similarity based on GloVe word embeddings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
