# Calabar Connect City

Calabar Connect City is a mobile-friendly local community and marketplace for Calabar, Cross River State. This repository contains the React + Vite frontend migrated from the AppDeploy source, preserving the existing visual layout, responsive styling, and CSS animation/interaction layer.

## Stack
- React 19 + Vite + TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime-ready schema
- Lucide icons

## Local development
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Run `npm run dev`; build with `npm run build`.

The publishable key is intended for browser use; never put a Supabase secret/service-role key in frontend code or GitHub.

## Supabase
The Calabar Connect City Supabase project has the base community schema (profiles, vendors, listings, friend requests/friendships, groups, conversations/messages, reviews, saved listings, vendor enquiries, notifications and user blocks). The additional migration in `supabase/migrations` creates community posts and moderation reports with row-level security. The designated moderator email is `Princewillobongha@gmail.com` (email matching is case-insensitive in database policy).

The app expects the profile row to be created for each authenticated user. Verify the profile trigger in Supabase Auth before enabling public sign-ups. Add the Vercel production domain to Supabase Auth's Site URL and Redirect URLs after deployment.

## Deploy to Vercel
Import this repository, set the two Vite environment variables in Vercel, use `npm run build` and `dist` as the output directory. Do not add server-side service-role secrets to Vercel's `VITE_*` variables.
