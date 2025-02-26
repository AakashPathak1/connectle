# Vercel Deployment Guide for Connectle API

This guide provides instructions for deploying the Connectle API to Vercel and troubleshooting common issues.

## Prerequisites

- A Vercel account
- A GitHub repository with your Connectle code
- Supabase project with the necessary tables and policies

## Deployment Steps

1. Push your code to GitHub if you haven't already.

2. Log in to your Vercel account and create a new project.

3. Import your GitHub repository.

4. Configure the following settings:
   - **Framework Preset**: Other
   - **Root Directory**: `api`
   - **Build Command**: Leave empty (uses default)
   - **Output Directory**: Leave empty (uses default)
   - **Install Command**: `pip install -r requirements.txt`

5. Set up the following environment variables in Vercel:

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `SUPABASE_URL` | Your Supabase project URL | `https://yourproject.supabase.co` |
   | `SUPABASE_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `FLASK_ENV` | The environment setting | `production` |
   | `CRON_SECRET` | Secret for cron job authentication | `your-secure-random-string` |

6. Deploy the project.

## Troubleshooting

### Missing Dependencies

If you see errors about missing modules (like `nltk`), make sure they are included in your `requirements.txt` file. The current requirements include:

```
flask==3.0.2
flask-cors==4.0.0
python-dotenv==1.0.1
requests==2.31.0
supabase==1.2.0
nltk==3.8.1
```

### Environment Variables

Make sure all required environment variables are set in Vercel. You can check this in the Vercel dashboard under your project's settings.

### Supabase Connection Issues

If you're having trouble connecting to Supabase:

1. Verify your Supabase URL and key are correct
2. Check that your Supabase project is active
3. Ensure your API has the necessary permissions

### Cron Job Issues

If the cron job isn't working:

1. Check the Vercel logs for any error messages
2. Verify that the `CRON_SECRET` is set correctly
3. Make sure the cron job path in `vercel.json` matches the endpoint in your code

## Monitoring

After deployment, you can monitor your API:

1. Check the Vercel logs for any errors
2. Test the health check endpoint: `/api/health`
3. Test the daily puzzle endpoint: `/api/daily-puzzle`

## Updating Your Deployment

When you make changes to your code:

1. Push your changes to GitHub
2. Vercel will automatically redeploy your application
3. Check the deployment logs for any issues
