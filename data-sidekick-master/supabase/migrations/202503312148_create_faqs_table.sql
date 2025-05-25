-- Create common schema if it doesn't exist
create schema if not exists common;

-- Create set_updated_at function if it doesn't exist
create or replace function common.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create FAQ table
create table if not exists public.faqs (
    id uuid default gen_random_uuid() primary key,
    question text not null,
    answer text not null,
    reasoning text not null,
    tags text[] not null default '{}',
    transcript_id uuid references public.call_log(id),
    recording_url text,
    original_tags text[] not null default '{}',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Add RLS policies
alter table public.faqs enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access to authenticated users"
    on public.faqs
    for select
    to authenticated
    using (true);

-- Allow insert/update access to service_role only
create policy "Allow insert/update access to service_role"
    on public.faqs
    for all
    to service_role
    using (true)
    with check (true);

-- Create updated_at trigger
create trigger set_updated_at
    before update on public.faqs
    for each row
    execute function common.set_updated_at();

-- Create indexes
create index if not exists faqs_transcript_id_idx on public.faqs(transcript_id);
create index if not exists faqs_recording_url_idx on public.faqs(recording_url);
create index if not exists faqs_tags_idx on public.faqs using gin(tags);

-- Add table comments
comment on table public.faqs is 'Frequently asked questions extracted from call transcripts';
comment on column public.faqs.question is 'The question as asked by the customer';
comment on column public.faqs.answer is 'Detailed solution or procedure';
comment on column public.faqs.reasoning is 'Why this FAQ is considered reusable/valuable';
comment on column public.faqs.tags is 'Categories or tags for this FAQ';
comment on column public.faqs.transcript_id is 'Reference to the original call_log transcript';
comment on column public.faqs.recording_url is 'Original recording URL from call_log';
comment on column public.faqs.original_tags is 'Original tags from the call_log entry'; 