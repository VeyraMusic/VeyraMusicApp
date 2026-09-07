# Veyra

Veyra is a clean, ad-free music client UI designed for **Android + Windows**, with one shared frontend.

## Included

- Responsive Veyra interface
- Local audio import from the device
- Edit local title, artist, album and cover
- Local library stored in browser/app storage
- Playlists + liked songs foundation
- Search UI with YouTube API adapter
- Spotify API adapter for metadata
- YouTube official-player handoff
- Karaoke/lyrics screen foundation
- Google sign-in foundation through Supabase
- English / Russian / Azerbaijani
- Dark / Light / System themes
- Accent customization
- Vercel-ready API routes
- Capacitor Android configuration
- Tauri Windows configuration
- No advertising SDKs

## Important provider note

Veyra does **not** download or rip Spotify/YouTube audio. Spotify playback is intended to use Spotify's official SDK/Connect flow, while YouTube playback uses the official YouTube player. Provider policies and account requirements apply.

Spotify's current Web Playback SDK documentation says playback in the SDK requires a Premium account and that commercial streaming integrations require Spotify's prior written approval. YouTube provides an official IFrame Player API for embedded playback.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add the variables from `.env.example`.
4. Deploy.

The Vercel deployment already gets a free `*.vercel.app` address; a custom domain is optional.

## YouTube

Create a YouTube Data API key and set:

```env
YOUTUBE_API_KEY=...
```

The frontend calls `/api/youtube/search`.

## Spotify

Set:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

`/api/spotify/search` uses Client Credentials for public catalog metadata. For actual user playback/control, add Spotify OAuth + the official Web Playback SDK/Connect flow and comply with Spotify's developer policy.

## Google accounts

Create a Supabase project, enable Google provider, then set:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Set the production redirect URL in Supabase to your Vercel URL.

## Android

After installing dependencies:

```bash
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

Then build the APK/AAB in Android Studio.

## Windows

Install Rust + Tauri prerequisites, then:

```bash
npm run build
npm run tauri:build
```

The Windows installer is produced by Tauri.

## Production upgrades

The project intentionally keeps provider integrations compliant and modular. For a full production release, add:

- persistent user profiles/playlists in Supabase/Postgres
- Spotify OAuth + official playback
- licensed lyrics provider
- encrypted token/session handling
- Windows native file picker integration
- Android MediaSession / notification controls
- offline metadata database
- real playlist collaboration
- moderation/verification backend
- rate limiting and server-side logging

## Automatic Vercel build/deploy

The repository includes GitHub Actions:

- `.github/workflows/ci.yml` — verifies the Veyra web build.
- `.github/workflows/vercel.yml` — deploys Preview builds for pull requests and Production from `main`.

For the Actions-based Vercel deployment, add these GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You can also simply connect the repository to Vercel Git Integration; Vercel can then automatically deploy every push and provide Preview URLs.

The free `*.vercel.app` address does not require buying a separate domain.
