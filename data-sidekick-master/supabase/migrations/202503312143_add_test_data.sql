-- Add test data for Jira tickets
-- First, add a test project
INSERT INTO jira_projects (key, name, description, lead, url)
VALUES 
('TEST', 'Test Project', 'A project for testing purposes', 'test.lead@example.com', 'https://jira.example.com/projects/TEST');

-- Function to generate random text of varying length
CREATE OR REPLACE FUNCTION random_text(min_words int, max_words int) RETURNS text AS $$
DECLARE
    words text[] := ARRAY['user', 'system', 'error', 'integration', 'database', 'network', 'application', 'server', 'client', 
                         'interface', 'bug', 'feature', 'update', 'performance', 'security', 'authentication', 'authorization', 
                         'validation', 'configuration', 'deployment', 'testing', 'production', 'development', 'staging', 
                         'critical', 'high', 'medium', 'low', 'priority', 'status'];
    result text := '';
    word_count int;
BEGIN
    word_count := min_words + floor(random() * (max_words - min_words + 1))::int;
    FOR i IN 1..word_count LOOP
        result := result || ' ' || words[1 + floor(random() * array_length(words, 1))::int];
    END LOOP;
    RETURN trim(result);
END;
$$ LANGUAGE plpgsql;

-- Insert 30 test tickets with varying data
INSERT INTO jira_tickets (
    key,
    project_key,
    summary,
    description,
    status,
    priority,
    reporter,
    assignee,
    created_at,
    updated_at,
    resolved_at,
    labels,
    metadata,
    concise_ticket_details,
    ai_summary
)
SELECT
    'TEST-' || generate_series,
    'TEST',
    random_text(3, 8), -- Summary with 3-8 words
    random_text(20, 100), -- Description with 20-100 words
    (ARRAY['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])[1 + floor(random() * 5)::int],
    (ARRAY['low', 'medium', 'high', 'critical'])[1 + floor(random() * 4)::int],
    (ARRAY['john.doe@example.com', 'jane.smith@example.com', 'bob.wilson@example.com'])[1 + floor(random() * 3)::int],
    CASE WHEN random() > 0.2 THEN 
        (ARRAY['alice.dev@example.com', 'bob.dev@example.com', 'charlie.dev@example.com'])[1 + floor(random() * 3)::int]
    ELSE NULL END,
    NOW() - (random() * interval '90 days'),
    NOW() - (random() * interval '30 days'),
    CASE WHEN random() > 0.5 THEN NOW() - (random() * interval '10 days') ELSE NULL END,
    ARRAY[
        (ARRAY['bug', 'feature', 'enhancement', 'documentation', 'security', 'performance'])[1 + floor(random() * 6)::int],
        (ARRAY['frontend', 'backend', 'database', 'api', 'ui', 'ux'])[1 + floor(random() * 6)::int]
    ],
    jsonb_build_object(
        'ticket_type', (ARRAY['incident', 'bug', 'feature_request', 'task', 'maintenance'])[1 + floor(random() * 5)::int],
        'sentiment_score', random() - 0.5,
        'escalated', random() > 0.8,
        'external_url', 'https://jira.example.com/browse/TEST-' || generate_series,
        'resolution', CASE WHEN random() > 0.7 THEN 'Fixed' 
                         WHEN random() > 0.4 THEN 'Won''t Fix'
                         ELSE 'Duplicate' END,
        'story_points', floor(random() * 8 + 1),
        'environment', (ARRAY['production', 'staging', 'development'])[1 + floor(random() * 3)::int],
        'browser', (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[1 + floor(random() * 4)::int],
        'os', (ARRAY['Windows', 'MacOS', 'Linux'])[1 + floor(random() * 3)::int],
        'version', '1.' || floor(random() * 10)::text || '.' || floor(random() * 10)::text
    ),
    'Concise details for ticket TEST-' || generate_series,
    'AI generated summary for ticket TEST-' || generate_series || ': ' || random_text(10, 20)
FROM generate_series(1, 30);

-- Add some test comments to tickets
UPDATE jira_tickets
SET comments = jsonb_build_array(
    jsonb_build_object(
        'id', uuid_generate_v4(),
        'author', (ARRAY['john.doe@example.com', 'jane.smith@example.com'])[1 + floor(random() * 2)::int],
        'content', random_text(5, 15),
        'created_at', NOW() - (random() * interval '30 days')
    ),
    jsonb_build_object(
        'id', uuid_generate_v4(),
        'author', (ARRAY['alice.dev@example.com', 'bob.dev@example.com'])[1 + floor(random() * 2)::int],
        'content', random_text(5, 15),
        'created_at', NOW() - (random() * interval '15 days')
    )
)
WHERE random() > 0.5;

-- Clean up
DROP FUNCTION IF EXISTS random_text(int, int); 