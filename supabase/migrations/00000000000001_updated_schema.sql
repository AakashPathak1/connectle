-- Modify the daily_words table to store puzzles (not just daily ones)
alter table if exists daily_words rename to puzzles;
alter table if exists puzzles rename constraint daily_words_pkey to puzzles_pkey;
alter table if exists puzzles drop constraint if exists daily_words_date_key;
alter table if exists puzzles 
    add column is_daily boolean default false,
    add column difficulty float; -- Can be calculated based on semantic distance

-- Table for user statistics per puzzle
create table if not exists user_puzzle_stats (
    id uuid default uuid_generate_v4() primary key,
    puzzle_id uuid references puzzles(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    best_chain_length int,
    hints_used int default 0,
    attempts_count int default 0,
    completed boolean default false,
    first_completed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(puzzle_id, user_id)
);

-- Table for puzzle statistics
create table if not exists puzzle_stats (
    puzzle_id uuid references puzzles(id) on delete cascade primary key,
    total_attempts int default 0,
    total_completions int default 0,
    total_hints_used int default 0,
    avg_chain_length float,
    min_chain_length int,
    updated_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists puzzles_is_daily_idx on puzzles(is_daily);
create index if not exists user_puzzle_stats_user_id_idx on user_puzzle_stats(user_id);
create index if not exists user_puzzle_stats_puzzle_id_idx on user_puzzle_stats(puzzle_id);

-- Update RLS policies
alter table puzzles enable row level security;
alter table user_puzzle_stats enable row level security;
alter table puzzle_stats enable row level security;

-- Policies for puzzles
create policy "Anyone can read puzzles"
    on puzzles for select
    to authenticated
    using (true);

-- Policies for user_puzzle_stats
create policy "Users can read their own stats"
    on user_puzzle_stats for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can update their own stats"
    on user_puzzle_stats for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own stats"
    on user_puzzle_stats for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Policies for puzzle_stats
create policy "Anyone can read puzzle stats"
    on puzzle_stats for select
    to authenticated
    using (true);

-- Function to update puzzle stats
create or replace function update_puzzle_stats()
returns trigger as $$
begin
    insert into puzzle_stats (puzzle_id, total_attempts, total_completions, total_hints_used, avg_chain_length, min_chain_length)
    values (
        NEW.puzzle_id,
        1,
        case when NEW.completed then 1 else 0 end,
        NEW.hints_used,
        NEW.best_chain_length,
        NEW.best_chain_length
    )
    on conflict (puzzle_id) do update set
        total_attempts = puzzle_stats.total_attempts + 1,
        total_completions = puzzle_stats.total_completions + case when NEW.completed then 1 else 0 end,
        total_hints_used = puzzle_stats.total_hints_used + NEW.hints_used,
        avg_chain_length = (puzzle_stats.avg_chain_length * puzzle_stats.total_completions + NEW.best_chain_length) / (puzzle_stats.total_completions + 1),
        min_chain_length = least(puzzle_stats.min_chain_length, NEW.best_chain_length),
        updated_at = now();
    return NEW;
end;
$$ language plpgsql;

-- Trigger to update puzzle stats
create trigger update_puzzle_stats_trigger
after insert or update on user_puzzle_stats
for each row
execute function update_puzzle_stats();
