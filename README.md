# CST-391 Music App

## Project Overview

This repository contains a full-stack music discovery and playlist web application built for CST-391.  
The app combines a local PostgreSQL-backed library with external music metadata from TheAudioDB to deliver:

- music discovery and featured song browsing
- album and artist exploration
- authenticated user playlists
- role-based admin dashboard for users, playlists, albums, and tracks
- user account registration and sign-in
- recent-search persistence for signed-in users

The codebase uses the Next.js App Router architecture with both server and client components, typed API routes, and shared service/repository layers for data access.

## Repository Layout

The git root is intentionally simple. The main web app lives in a nested folder:

- `cst391-music-app/` - Next.js application source (frontend + backend API routes)
- `Docs/` - milestone guides, SQL notes, planning docs
- `.gitignore` - root ignore file for repo-level generated files

When running commands like install, lint, build, and dev server, execute them inside:

- `cst391-music-app/`

## Core Feature Set

### 1. Music Home and Discovery Experience

- Home route with featured songs and personalized UI sections.
- Discover route for broader featured-song browsing.
- Search UI integrated across major routes for quick song lookup.
- Rich card-based browsing with cover art, artist, album, and track metadata.

### 2. Album and Artist Browsing

- Album detail pages with track listings.
- Artist-specific browsing and artist discography lookups.
- Track-level interactions integrated into album and playlist views.
- Song detail side panel with contextual media (lyrics/video when available).

### 3. Playlist Management (Authenticated)

- Create, view, rename, edit, and delete playlists.
- Add/remove tracks from playlists.
- Playlist detail pages with searchable track lists.
- Playlist cover collage behavior based on available track art.
- Inline playlist actions and interactive UI controls for library workflows.

### 4. Authentication and User Accounts

- Register route and API endpoint for account creation.
- NextAuth-based sign-in and session management.
- Route-aware authentication behavior (guest vs signed-in user experience).
- Role support (for example, admin role checks in specific flows).

### 5. Admin Capabilities

- Admin dashboard at `/admin` with tabbed management views.
- View and search all users, playlists, and albums from one place.
- Expand albums/playlists inline to view associated tracks.
- Admin track actions: create, edit, and delete tracks.
- Admin album actions: create, edit, and delete albums.
- Admin user actions: view and delete users (self-delete blocked).
- In-app modal confirmations for destructive actions (no browser popups).
- Backend route protections integrated with session/role context.

### 6. Search and Recent Searches

- Music search APIs for query-driven retrieval.
- Recent search persistence for authenticated users.
- Feature routes for featured songs and artist discography enrichment.

## Technology Stack

### Frontend

- **Next.js 16 (App Router)** for rendering, routing, and server/client component model
- **React 19** for UI composition and interactivity
- **TypeScript** for type safety across UI and backend route handlers
- **Bootstrap 5 + custom CSS** for layout primitives and visual styling

### Backend (within Next.js)

- **Next.js Route Handlers** for REST-style API endpoints under `app/api/*`
- **NextAuth (v5 beta)** for authentication/session handling
- **PostgreSQL (`pg`)** for durable app data (users, playlists, recent searches, etc.)

### Tooling and Quality

- **ESLint 9 + eslint-config-next** for linting and code health
- **TypeScript compiler checks** via Next build pipeline
- **Turbopack** used by Next.js build/dev flows in this project configuration

## Key Routes and Functional Areas

Main user-facing routes include:

- `/` - home experience (featured content + playlist previews)
- `/discover` - featured song discovery
- `/library` - authenticated playlist library
- `/library/create` - playlist creation
- `/library/[id]` - playlist detail
- `/albums/[id]` - album detail
- `/artists/[name]` - artist-centric view
- `/auth/signin` and `/auth/register` - authentication pages
- `/admin` - admin dashboard (users/playlists/albums/tracks)
- `/admin/playlists` - admin management area

Representative API routes include:

- `/api/auth/*` - auth and registration-related handlers
- `/api/music/search` - search endpoint
- `/api/music/featured-songs` and `/api/music/featured` - featured content
- `/api/music/artist-discography` - artist data enrichment
- `/api/music/recent-searches` - recent query persistence
- `/api/playlists/*` - playlist CRUD and track operations
- `/api/admin/playlists/*` - admin playlist operations
- `/api/admin/users` and `/api/admin/users/[id]` - admin user list/delete
- `/api/admin/albums` and `/api/admin/albums/[id]` - admin album list/create/read/update/delete
- `/api/admin/tracks` and `/api/admin/tracks/[id]` - admin track create/update/delete
- `/api/albums` - album data operations

## Data and Environment Configuration

Set environment variables in:

- `cst391-music-app/.env.local`

Commonly used values:

- `POSTGRES_URL` or `DATABASE_URL` - PostgreSQL connection string
- `THEAUDIODB_API_KEY` - TheAudioDB API key (fallback test behavior may be configured in code)
- `THEAUDIODB_FEATURED_QUERY` - fallback artist/source query for featured content
- NextAuth-related secrets and auth config values as required by your environment

## Database Schema Scripts

Run schema/setup scripts from `cst391-music-app/`:

- `npm run db:users` - apply user/account schema
- `npm run db:musicbrainz` - apply music metadata related schema updates
- `npm run db:recent-searches` - apply recent search persistence schema

These scripts are intended to keep local schema changes consistent with milestone evolution and feature additions.

## Local Development

From `cst391-music-app/`:

1. Install dependencies:

   `npm install`

2. Configure `.env.local` with database and auth values.

3. Apply required schemas:

   `npm run db:users`  
   `npm run db:musicbrainz`  
   `npm run db:recent-searches`

4. Start development server:

   `npm run dev`

5. Open:

   [http://localhost:3000](http://localhost:3000)

## Quality and Build Commands

From `cst391-music-app/`:

- Lint: `npm run lint`
- Production build: `npm run build`
- Start production server (after build): `npm run start`

## Architecture Notes

- The app uses a layered organization where UI components call API utilities, which communicate with route handlers that delegate into service/repository logic for DB interaction.
- Shared types are used to reduce client/server contract drift.
- Feature-specific components are grouped under `components/music/` and route segments under `app/(music)/`.
- Authentication and authorization decisions are centralized through NextAuth session/context and backend checks.

## Operational and Maintenance Notes

- The repo includes generated/dev artifacts in some workflows (`.next`, local caches, etc.); keep root and app-level ignore rules aligned.
- Prefer running lint and build before submitting milestone changes to catch type/runtime regressions early.
- The project currently reports a Next.js notice about migrating from `middleware` to `proxy`; this is non-blocking but should be planned as a framework-alignment maintenance task.

## Summary

CST-391 Music App is a production-style, full-stack learning project that demonstrates modern Next.js development practices:

- typed React UI and server routes
- external API integration (TheAudioDB)
- relational persistence with PostgreSQL
- real authentication flows with role-aware behavior
- playlist-centric product features with admin management capabilities

The project is structured to support ongoing milestone-based iteration while maintaining a clear separation of concerns across UI, API, and data layers.

