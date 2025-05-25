#!/bin/bash

cd supabase/migrations

# Create timestamp with 1 minute increments
START_TIME=$(date -u +%Y%m%d%H%M)

# Function to generate next timestamp
get_next_timestamp() {
    echo $(date -u -v+${1}M +%Y%m%d%H%M)
}

# Rename files in the correct order
mv 20250204213654_schema.sql "$(get_next_timestamp 0)_schema.sql"
mv 20250204213655_scheduled_reports.sql "$(get_next_timestamp 1)_scheduled_reports.sql"
mv 20250204213656_chat_logs.sql "$(get_next_timestamp 2)_chat_logs.sql"
mv 20250204213657_tickets.sql "$(get_next_timestamp 3)_tickets.sql"
mv 20240614_create_users_table.sql "$(get_next_timestamp 4)_create_users_table.sql"
mv 20240615_data_analyzer_tables.sql "$(get_next_timestamp 5)_data_analyzer_tables.sql"
mv 20240616_fix_research_views_user_id.sql "$(get_next_timestamp 6)_fix_research_views_user_id.sql"
mv 20240617_fix_usage_logs_user_id.sql "$(get_next_timestamp 7)_fix_usage_logs_user_id.sql"
mv 20240620_create_research_files_bucket.sql "$(get_next_timestamp 8)_create_research_files_bucket.sql"
mv 20250309153618_create_aai_documents.sql "$(get_next_timestamp 9)_create_aai_documents.sql"
mv 20250309_213856_add_chatflow_id_to_research_views.sql "$(get_next_timestamp 10)_add_chatflow_id_to_research_views.sql"
mv 20250314230617_jira_ticket_integration.sql "$(get_next_timestamp 11)_jira_ticket_integration.sql"
mv 20250314230618_add_test_data.sql "$(get_next_timestamp 12)_add_test_data.sql"
mv 20250314230619_create_call_logs.sql "$(get_next_timestamp 13)_create_call_logs.sql"
mv 20250322235555_jira_meetings.sql "$(get_next_timestamp 14)_jira_meetings.sql"
mv 20250323203215_update_data_source_types.sql "$(get_next_timestamp 15)_update_data_source_types.sql"
mv 20250324121359_create_meetings_and_jira_buckets.sql "$(get_next_timestamp 16)_create_meetings_and_jira_buckets.sql"
mv 20250324121360_create_faqs_table.sql "$(get_next_timestamp 17)_create_faqs_table.sql"
mv 20250324121361_remove_faq_rls.sql "$(get_next_timestamp 18)_remove_faq_rls.sql"
mv 20250324165829_create_call_recordings_bucket.sql "$(get_next_timestamp 19)_create_call_recordings_bucket.sql"
mv 20250324204827_update_reports_table.sql "$(get_next_timestamp 20)_update_reports_table.sql"
mv 20250324215058_add_status_to_reports.sql "$(get_next_timestamp 21)_add_status_to_reports.sql"
mv 20250324215222_allow_null_content_in_reports.sql "$(get_next_timestamp 22)_allow_null_content_in_reports.sql"
mv 20250324221720_add_report_config.sql "$(get_next_timestamp 23)_add_report_config.sql"
mv 20250324235950_add_completed_at_to_reports.sql "$(get_next_timestamp 24)_add_completed_at_to_reports.sql"
mv 20250327180452_add_faq_internal_notes_and_status.sql "$(get_next_timestamp 25)_add_faq_internal_notes_and_status.sql"
mv 20250308234550_add_answerai_store_id.sql "$(get_next_timestamp 26)_add_answerai_store_id.sql" 