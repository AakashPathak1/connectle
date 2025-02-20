import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Table names
PUZZLES_TABLE = "puzzles"
USER_PUZZLE_STATS_TABLE = "user_puzzle_stats"
PUZZLE_STATS_TABLE = "puzzle_stats"
