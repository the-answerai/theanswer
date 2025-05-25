-- Create a new storage bucket for call recordings
insert into storage.buckets (id, name, public)
values ('call-recordings', 'call-recordings', true);

-- Allow public access to read files (since bucket is public)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'call-recordings' );

-- Allow authenticated users to upload files
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'call-recordings' );

-- Allow authenticated users to update their own files
create policy "Authenticated users can update their own files"
on storage.objects for update
to authenticated
using ( bucket_id = 'call-recordings' AND auth.uid() = owner );

-- Allow authenticated users to delete their own files
create policy "Authenticated users can delete their own files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'call-recordings' AND auth.uid() = owner );

-- Create an index on the name column for better performance
create index if not exists idx_storage_objects_name_call_recordings
on storage.objects (name)
where bucket_id = 'call-recordings';

-- Add comment to document the bucket's purpose
comment on column storage.buckets.id is 'Storage bucket for call recordings, accessible publicly for playback'; 