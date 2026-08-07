This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# Musica

Musica is a Spotify-inspired music web app built with Next.js, React, Zustand, NextAuth, and the public Audius API. It supports playback controls, a searchable and sortable song catalog, OIDC authentication, public/private playlists, song likes, cover art, lyrics display, theme switching, and mood-based catalog filtering.

## Features

- Play, pause, stop, resume, next, previous, shuffle, repeat all, and repeat one controls.
- Bottom streaming bar with progress seek and volume controls.
- Free-song loading from Audius, with up to 500 tracks pulled into the local catalog.
- Search across song title, artist, album, mood, rank, plays, and duration.
- Sort songs by name, global rank, number of plays, and time length.
- Like and unlike songs from the catalog.
- Filter songs by mood: focus, happy, chill, energy, romance, or all.
- View lyrics on demand.
- Create playlists and add or remove songs.
- Public playlists are visible to everyone.
- Private playlists are visible only to their owner.
- Authenticated users can access the full song catalog.
- Guests see a limited preview with a sign-in/sign-up mask for the full library.
- Switch visual themes, including the purple-blue default.
- Roboto-based typography.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Zustand for client-side player and library state
- NextAuth v5 beta for OIDC and local development auth
- Audius public API for free music metadata and streams
- Tailwind CSS 4, shadcn styles, and custom global CSS
- Lucide React icons

## Getting Started

First, run the development server:
Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set `AUTH_SECRET` in `.env.local`:

```bash
openssl rand -base64 32
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
Open the local URL printed by Next.js, usually:

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
```text
http://localhost:3000
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
If Next.js starts on another port, update `AUTH_URL` in `.env.local` to match that exact URL.

## Learn More
## Authentication

To learn more about Next.js, take a look at the following resources:
Musica uses NextAuth with an OIDC provider. Configure these values in `.env.local`:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
```env
AUTH_SECRET=
AUTH_URL=http://localhost:3000

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
OIDC_NAME=OIDC
OIDC_ISSUER=https://your-issuer.example.com
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_SCOPE=openid profile email
