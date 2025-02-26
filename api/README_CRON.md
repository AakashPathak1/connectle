# Connectle API Cron Jobs

This document explains the cron job setup for the Connectle API.

## Daily Puzzle Cron Job

The API includes a cron job that automatically sets a random puzzle as the daily puzzle every 2 hours. This ensures that users get a fresh puzzle regularly without manual intervention.

### How it Works

1. The cron job is defined in the `vercel.json` file with the schedule `0 */2 * * *` (runs every 2 hours at minute 0).
2. When triggered, Vercel calls the `/api/cron/set-random-daily` endpoint.
3. This endpoint executes the `set_random_daily()` function from `app/cron.py`.
4. The function selects a random puzzle from the database and sets its `is_daily` column to `true`, while setting all other puzzles' `is_daily` to `false`.

### Security

The cron endpoint is protected with a secret token. When deploying to Vercel, you need to set the `CRON_SECRET` environment variable:

1. Go to your Vercel project settings
2. Add a new environment variable named `CRON_SECRET` with a secure random value
3. Make sure this value matches the one in your Vercel deployment

### Testing Locally

To test the cron job locally, you can run:

```bash
# Test the cron function directly
python3 -c "from app.cron import set_random_daily; print(set_random_daily())"

# Or call the endpoint (if running a local server)
curl http://localhost:5001/api/cron/set-random-daily
```

### Deployment

When deploying to Vercel, the cron job will be automatically set up according to the configuration in `vercel.json`. No additional steps are required beyond setting the `CRON_SECRET` environment variable.

## Troubleshooting

If the cron job is not working as expected:

1. Check the Vercel logs for any errors
2. Verify that the `CRON_SECRET` environment variable is set correctly
3. Make sure the database connection is working properly
4. Check that there are puzzles available in the database

For more detailed logs, you can manually trigger the cron job by visiting the endpoint with the proper authorization header.
