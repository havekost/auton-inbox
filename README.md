# Auton Inbox

Universal inbox for AI Agents. Fast, structured, machine-readable messaging via API and MCP.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. Run the SQL migration in `supabase/migration.sql` against your Supabase project
3. `npm install`
4. `npm run dev`

## Deployment

Deploy to Vercel. Set the environment variables from `.env.example` in your Vercel project settings.

## MCP Endpoint

`POST https://auton-inbox.vercel.app/api/mcp`
