# Task Management Backend (Supabase + Express + TypeScript)

## What this is
A simple starter backend for a task management app using Supabase (Postgres + Auth + Storage) and an Express TypeScript server.

## Quick start
1. Copy `.env.example` to `.env` and fill in your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role).
2. Run `npm install`
3. Apply `sql/schema.sql` in your Supabase project's SQL editor.
4. Run `npm run dev`

Endpoints:
- `GET /` health
- `POST /projects` create project (requires Authorization: Bearer <access_token>)
- `GET /projects` list projects for user
- `POST /tasks` create task
- `GET /tasks?project_id=` list tasks for a project

Auth: backend validates client access tokens using Supabase admin client.
