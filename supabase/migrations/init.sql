-- Create tables for the word chain game

-- Table for daily word pairs
create table if not exists daily_words (
    id uuid default uuid_generate_v4() primary key,
    start_word text not null,
    end_word text not null,
    start_definition text not null,
    end_definition text not null,
    transition_graph jsonb not null,
    date date not null unique,
    created_at timestamp with time zone default now()
);

-- Table for best chains
create table if not exists best_chains (
    id uuid default uuid_generate_v4() primary key,
    word_pair_id uuid references daily_words(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    user_name text not null,
    chain text[] not null,
    chain_length int not null,
    created_at timestamp with time zone default now(),
    unique(word_pair_id)  -- Only one best chain per word pair
);

-- Table for user attempts
create table if not exists user_attempts (
    id uuid default uuid_generate_v4() primary key,
    word_pair_id uuid references daily_words(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    chain text[] not null,
    chain_length int not null,
    created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists daily_words_date_idx on daily_words(date);
create index if not exists best_chains_word_pair_id_idx on best_chains(word_pair_id);
create index if not exists user_attempts_word_pair_id_idx on user_attempts(word_pair_id);
create index if not exists user_attempts_user_id_idx on user_attempts(user_id);

-- Create Row Level Security (RLS) policies
alter table daily_words enable row level security;
alter table best_chains enable row level security;
alter table user_attempts enable row level security;

-- Policies for daily_words
create policy "Anyone can read daily words"
    on daily_words for select
    to authenticated
    using (true);

-- Policies for best_chains
create policy "Anyone can read best chains"
    on best_chains for select
    to authenticated
    using (true);

create policy "Users can insert their best chains"
    on best_chains for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Policies for user_attempts
create policy "Users can read their own attempts"
    on user_attempts for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their attempts"
    on user_attempts for insert
    to authenticated
    with check (auth.uid() = user_id);
