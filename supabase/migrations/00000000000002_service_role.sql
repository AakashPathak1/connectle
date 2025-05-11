-- Drop existing policies
drop policy if exists "Anyone can read puzzles" on puzzles;
drop policy if exists "Service can insert puzzles" on puzzles;

-- Create new policies
create policy "Anyone can read puzzles"
    on puzzles for select
    using (true);

create policy "Service can insert puzzles"
    on puzzles for insert
    with check (true);  -- Allow inserts from service role

-- Update the puzzles table to allow inserts without authentication
alter table puzzles disable row level security;
