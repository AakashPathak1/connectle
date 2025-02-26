# Connectle API Cron Jobs

This document explains the cron job setup for the Connectle API.

## Daily Puzzle Cron Job

The API includes a cron job that automatically sets a random puzzle as the daily puzzle every hour. This ensures that users get a fresh puzzle regularly without manual intervention.

### How it Works

1. The cron job is defined in the `vercel.json` file with the schedule `0 * * * *` (runs every hour at minute 0).
2. When triggered, Vercel calls the `/api/cron/set-random-daily` endpoint.
3. This endpoint executes the `set_random_daily()` function from `app/cron.py`.
4. The function selects a random puzzle from the database and sets its `is_daily` column to `true`, while setting all other puzzles' `is_daily` to `false`.
5. The cron job ensures that a different puzzle is selected each time by filtering out the current daily puzzle.

### Security

The cron endpoint is protected with a secret token. When deploying to Vercel, you need to set the `CRON_SECRET` environment variable:

1. Go to your Vercel project settings
2. Add a new environment variable named `CRON_SECRET` with a secure random value
3. Make sure this value matches the one in your Vercel deployment

### Testing Locally

To test the cron job locally, you can use the provided test scripts:

```bash
# Test the cron function directly
python3 scripts/test_cron.py --mode local

# Check the current daily puzzle
python3 scripts/check_daily_puzzle.py

# Test on Vercel (replace with your actual values)
python3 scripts/test_cron.py --mode vercel --url https://your-app.vercel.app --secret your-cron-secret
```

### Deployment

When deploying to Vercel, the cron job will be automatically set up according to the configuration in `vercel.json`. No additional steps are required beyond setting the `CRON_SECRET` environment variable.

## Troubleshooting

If the cron job is not working as expected:

1. **Check Vercel Cron Job Status**:
   - Log in to your Vercel account
   - Navigate to your project
   - Go to Settings > Cron Jobs to see the status of your cron jobs
   - You can also use `python3 scripts/check_vercel_cron.py` for instructions

2. **Check Logs**:
   - In Vercel, go to Deployments > [latest deployment] > Functions
   - Find the `/api/cron/set-random-daily` function to see its logs
   - Look for any error messages or issues

3. **Verify Environment Variables**:
   - Make sure `CRON_SECRET`, `SUPABASE_URL`, and `SUPABASE_KEY` are set correctly in Vercel

4. **Check Database Connection**:
   - Verify that the Supabase connection is working
   - Check that there are puzzles available in the database
   - Use `python3 scripts/check_daily_puzzle.py` to see the current daily puzzle

5. **Manual Testing**:
   - You can manually trigger the cron job using:
   ```
   curl -H "Authorization: Bearer your-cron-secret" https://your-app.vercel.app/api/cron/set-random-daily
   ```

6. **Common Issues**:
   - Missing environment variables
   - Incorrect Supabase URL or key
   - No puzzles in the database
   - Network connectivity issues between Vercel and Supabase

## Debugging Tools

The API includes several scripts to help debug cron job issues:

1. `scripts/test_cron.py` - Test the cron job locally or on Vercel
2. `scripts/check_daily_puzzle.py` - Check which puzzle is currently set as daily
3. `scripts/check_vercel_cron.py` - Instructions for checking Vercel cron job status

These tools can help identify and resolve issues with the cron job.
