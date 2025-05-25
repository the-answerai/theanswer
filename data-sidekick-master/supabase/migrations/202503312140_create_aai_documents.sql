-- Create a table to store your documents
create table aai_documents (
  id text primary key, -- CHANGE TO TEXT
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create a function to search for documents
create function match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id text, 
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (aai_documents.embedding <=> query_embedding) as similarity
  from aai_documents
  where metadata @> filter
  order by aai_documents.embedding <=> query_embedding
  limit match_count;
end;
$$; 