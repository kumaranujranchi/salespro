# SQL Directory

This directory contains all SQL scripts and migrations for the SalesPro project.

## Structure

- **`/migrations`**: Contains Supabase migration files. These are automatically applied by the Supabase CLI.
- **`/scripts`**: Contains manual SQL scripts for administration, maintenance, or one-off tasks (e.g., seeding data, fixing RLS).
- **`/queries`**: Contains useful SQL queries for debugging or analysis.

## Usage

To run a script using Supabase CLI:

```bash
supabase db reset
# or
supabase db push
```
