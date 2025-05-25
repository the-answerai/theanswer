# RDS Call Outcome Migration

This directory contains scripts for migrating the RDS call outcome tags to use the `resolution_status` field in the database.

## Migration Process

1. **Backup Your Data**
   Before running the migration, ensure you have a backup of your database.

2. **Run Migration Script**

    ```bash
    # First do a dry run to see what changes will be made
    node scripts/imports/rds/migrate_call_outcomes.js --dry-run

    # If the dry run looks good, run the actual migration
    node scripts/imports/rds/migrate_call_outcomes.js
    ```

    Options:

    - `--dry-run`: Preview changes without making them
    - `--batch-size=N`: Process N records at a time (default: 100)

3. **Update Tag Configuration**
   After the migration is complete, replace the contents of `tag_config.js` with the updated version from `tag_config_updated.js`.

## Resolution Status Values

The migration maps the old call outcome tags to the following resolution status values:

-   `resolved`: From 'outcome-resolved' and 'outcome-reboot-fix'
-   `dispatch`: From 'outcome-dispatch-no-troubleshoot'
-   `escalated`: From 'outcome-escalated-tier2'
-   `followup`: From 'outcome-repeat-call'

## Verification

After running the migration:

1. Check that no calls have the old outcome tags in their `TAGS_ARRAY`
2. Verify that calls have appropriate values in the `resolution_status` field
3. Test that the AnswerAI analyzer works with the new configuration

## Rollback

If you need to rollback the changes:

1. Restore from your database backup
2. Keep using the original `tag_config.js`

## Files

-   `migrate_call_outcomes.js`: Main migration script
-   `tag_config_updated.js`: Updated tag configuration without call outcome tags
-   `README.md`: This documentation file
