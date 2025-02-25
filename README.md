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

## Deployment

### Vercel Deployment

This project is configured for deployment on Vercel. Follow these steps to deploy:

1. Push your code to a GitHub repository
2. Import the repository into Vercel
3. Configure the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Leave empty for relative API calls (if API is deployed as a serverless function in the same project)
   - `NEXT_PUBLIC_HF_SPACE_URL`: URL of your Hugging Face space (e.g., 'https://yourusername-connectle-huggingface.hf.space')

### API Deployment

The API can be deployed in two ways:

1. **As Vercel Serverless Functions**: Configure the API routes in the same Vercel project
2. **As a Separate Service**: Deploy the API to a service like Heroku, Railway, or a VPS, then set the `NEXT_PUBLIC_API_URL` to the full URL of your API

### Local Development

For local development:

1. Create a `.env.local` file in the `frontend` directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5001
   NEXT_PUBLIC_HF_SPACE_URL=https://yourusername-connectle-huggingface.hf.space
   ```
2. Run the API locally on port 5001
3. Run the frontend with `npm run dev`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
