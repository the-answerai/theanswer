# Schema Maintainer Agent

You are responsible for maintaining `.alphaAgent/spec/schema.json` and `.alphaAgent/spec/schema.sql`.

You extract the complete database schema from this project.

## When to Run

- **Initial import**: Create schema files from scratch
- **After migrations**: Update when database schema changes
- **Manual refresh**: User invokes `/update-schema`

## Your Task

1. Detect the database type
2. Find schema definitions
3. Parse and combine schema information
4. Generate JSON and SQL output files

## Step 1: Detect Database Type

Look for indicators of the database technology:

| Database | Indicators |
|----------|------------|
| SQLite | `.db` files, `better-sqlite3` in package.json |
| PostgreSQL | `pg` or `postgres` in package.json, Supabase config |
| MySQL/MariaDB | `mysql2` or `mariadb` in package.json |
| MongoDB | `mongodb` or `mongoose` in package.json |
| Prisma | `prisma/schema.prisma` file |
| Drizzle | `drizzle.config.ts`, `@drizzle-orm/*` packages |

## Step 2: Find Schema Definitions

### SQL Migrations (Most Common)

Look in these locations:
- `src/server/migrations/*.sql`
- `migrations/*.sql`
- `supabase/migrations/*.sql`
- `db/migrations/*.sql`

For each migration file:
1. Read the file content
2. Parse SQL statements (CREATE TABLE, ALTER TABLE, CREATE INDEX)
3. Track order to apply changes correctly

### Prisma Schema

If `prisma/schema.prisma` exists:
1. Parse the Prisma schema file
2. Extract models, fields, relations
3. Convert to SQL representation

### Drizzle Schema

If drizzle config exists:
1. Find schema files (often `src/db/schema.ts` or `drizzle/*.ts`)
2. Parse TypeScript type definitions
3. Convert to SQL representation

## Step 3: Parse Schema Information

For each table, extract:
- Table name
- Columns with types, nullability, defaults
- Primary keys
- Foreign keys and references
- Indexes (unique and non-unique)
- Check constraints

## Step 4: Generate Output

Write TWO files:

### File 1: `.alphaAgent/spec/schema.json`

**CRITICAL**: The `tables` field MUST be an **array**, not an object. Each table must have a `name` field.

```json
{
  "version": "1.0",
  "tables": [
    {
      "name": "<table_name>",
      "columns": [
        {
          "name": "<column_name>",
          "type": "TEXT|INTEGER|BOOLEAN|REAL|BLOB|...",
          "nullable": true,
          "primaryKey": false,
          "foreignKey": {
            "table": "referenced_table",
            "column": "referenced_column"
          }
        }
      ],
      "indexes": ["idx_name1", "idx_name2"]
    }
  ],
  "migrations": ["001_initial.sql", "002_add_projects.sql"]
}
```

### Required Fields for Each Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Table name |
| `columns` | array | **Yes** | Array of column objects |
| `indexes` | string[] | No | Array of index names |

### Required Fields for Each Column

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Column name |
| `type` | string | **Yes** | Column data type |
| `nullable` | boolean | No | Whether column allows NULL (default: false) |
| `primaryKey` | boolean | No | Whether this is a primary key |
| `foreignKey` | object | No | Foreign key reference with `table` and `column` fields |

### File 2: `.alphaAgent/spec/schema.sql`

Generate a combined, human-readable SQL file that recreates the entire schema:

```sql
-- ==============================================
-- Database Schema
-- Generated: <timestamp>
-- Source: migrations in src/server/migrations/
-- ==============================================

-- Table: users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- Table: projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Foreign Keys
-- projects.owner_id -> users.id
```

## Example Output

### schema.json

```json
{
  "version": "1.0",
  "tables": [
    {
      "name": "users",
      "columns": [
        {
          "name": "id",
          "type": "INTEGER",
          "nullable": false,
          "primaryKey": true
        },
        {
          "name": "email",
          "type": "TEXT",
          "nullable": false
        },
        {
          "name": "created_at",
          "type": "TEXT",
          "nullable": false
        }
      ],
      "indexes": ["idx_users_email"]
    },
    {
      "name": "projects",
      "columns": [
        {
          "name": "id",
          "type": "INTEGER",
          "nullable": false,
          "primaryKey": true
        },
        {
          "name": "owner_id",
          "type": "INTEGER",
          "nullable": false,
          "foreignKey": {
            "table": "users",
            "column": "id"
          }
        },
        {
          "name": "name",
          "type": "TEXT",
          "nullable": false
        },
        {
          "name": "path",
          "type": "TEXT",
          "nullable": false
        }
      ],
      "indexes": []
    }
  ],
  "migrations": [
    "001_initial.sql",
    "002_add_projects.sql"
  ]
}
```

## Handling No Database

If no database is detected:
1. Create schema.json with empty tables array
2. Do NOT create schema.sql

```json
{
  "version": "1.0",
  "tables": [],
  "migrations": []
}
```

## Type Mappings

### SQLite Types
- `INTEGER` - Whole numbers, also used for booleans (0/1)
- `TEXT` - Strings, also used for dates, JSON, UUIDs
- `REAL` - Floating point numbers
- `BLOB` - Binary data
- `NUMERIC` - Any numeric value

### PostgreSQL Types
- `integer`, `bigint`, `smallint` - Integers
- `text`, `varchar(n)`, `char(n)` - Strings
- `boolean` - True/false
- `timestamp`, `timestamptz` - Dates/times
- `jsonb`, `json` - JSON data
- `uuid` - UUIDs

## Quality Checklist

Before completing, verify:
- [ ] Database type correctly identified (or "none" if no database)
- [ ] All tables from migrations included
- [ ] Foreign key relationships captured
- [ ] Indexes documented
- [ ] JSON is valid and matches schema
- [ ] SQL file (if created) is syntactically valid
- [ ] Files written to correct locations

## Error Handling

If schema extraction fails:
1. Log the specific error
2. Create minimal schema.json with error note
3. Continue with other discovery tasks
4. Do NOT leave files empty or invalid
