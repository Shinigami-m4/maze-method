# Maze Method

**Every Rep Has Direction**

Maze Method is an iOS-first fitness tracking app built as a portfolio-ready React Native project. It is designed for gym users and beginners who want one focused place to track routines, workouts, nutrition, progress photos, measurements, cardio, and local coaching recommendations.

The app uses a premium dark fitness-technology style: matte black surfaces, clean cards, white typography, and a violet accent color (`#7C3AED`) for progress, direction, and active states.

## Features

- Multi-screen onboarding for profile, goals, training preferences, nutrition preferences, reminder preferences, units, and Maze Coach tone.
- Bottom-tab app navigation: Home, Calendar, Workouts, Nutrition, and Progress.
- Home dashboard with Maze Coach Card, Today's Path, quick actions, macro placeholder, progress photo reminder, and direction quote.
- Workout system with routine creation, exercise library, custom exercises, personal notes, resource links, routine duplication, active/inactive routines, and local workout history.
- Calendar logging with monthly indicators, daily detail view, saved routine logging, editable logged exercises, cardio logging, and daily notes.
- Nutrition logging with daily totals, meal categories, calorie/protein/carb/fat tracking, macro progress bars, target calculations, barcode scanning, and editable food confirmation.
- Progress tab with weight chart, macro chart, strength volume chart, cardio history, measurements, progress photo upload, photo comparison, and personal records.
- Maze Coach recommendation engine with local mock fallback, optional secure backend/OpenAI integration, daily targets, suggested workout, suggested meals, recovery advice, and explanation.
- Local reminders for workouts, meal logging, and weekly progress photos.
- Settings/Profile screen for editing profile, goals, units, Maze Coach tone, reminders, and future placeholders.
- Optional Supabase authentication and cloud sync foundation with sign in, sign up, first backup, manual sync, and cloud status in Settings/Profile.

## Tech Stack

- React Native
- Expo SDK 54
- TypeScript
- React Navigation
- Expo SQLite
- AsyncStorage
- Expo Notifications
- Expo Image Picker
- Expo File System
- Expo Camera
- Supabase JavaScript client
- Optional Node TypeScript backend
- OpenAI Responses API through the backend only
- Ionicons via `@expo/vector-icons`

## App Architecture

```text
src/
  components/          Reusable UI primitives
  data/                Static app data such as onboarding options and built-in exercises
  database/            SQLite client, schema, initialization, and repositories
  navigation/          Root stack, onboarding stack, and bottom tab navigation
  screens/             Feature screens grouped by app area
  services/            Maze Coach, nutrition formulas, and reminder scheduling logic
  storage/             AsyncStorage keys and settings helpers
  theme/               Color, spacing, radius, and typography constants
  types/               Shared TypeScript models and feature-specific types
  utils/               Small shared helpers

backend/
  src/index.ts         Lightweight local API server
  src/routes/          HTTP route handlers
  src/services/        Server-side OpenAI integration
  src/types/           Backend request/response types
```

The code is organized around feature areas. SQLite repositories keep database reads/writes out of screen components, while shared service files hold business logic such as nutrition targets, barcode lookup, optional Supabase auth, cloud sync, Maze Coach recommendations, and notification scheduling.

## Screens

- **Home:** calm dashboard with Maze Coach Card, Today's Path, quick actions, summary cards, and progress photo reminder.
- **Calendar:** monthly grid with indicators for workouts, meals, macros, cardio, weight, photos, and notes.
- **Workouts:** routine builder, exercise library, custom exercises, resource links, recent workouts, and personal records.
- **Nutrition:** meals, daily macro totals, target calculations, barcode scanning, recent scanned foods, and future Maze Coach meal placeholders.
- **Progress:** charts, body measurements, progress photos, comparison view, cardio history, and records.
- **Maze Coach:** recommendation screen with targets, workout, meals, recovery, explanation, insights, backend loading state, fallback state, and retry.
- **Settings/Profile:** profile editing, goal editing, unit changes, Maze Coach tone, reminders, and future settings placeholders.
- **Auth:** optional cloud sign in, sign up, forgot password placeholder, and account status views.

## Local-First Data

Maze Method version 1 has no login and no backend. User data is stored locally on the phone.

SQLite is used for structured data:

- user profile
- workout routines
- exercises and exercise links
- logged workouts and logged exercises
- meals and daily macros
- body weight entries
- body measurements
- cardio sessions
- progress photo metadata
- daily notes
- personal records

AsyncStorage is used for simple settings:

- onboarding completion
- unit preference
- Maze Coach tone preference
- reminder preferences
- detailed local reminder schedules
- recent scanned foods for quick reuse

The app does not seed fake user data. Built-in exercises are static reference data, but user logs start empty until the user creates entries.

Cloud auth and sync are optional. If Supabase environment variables are not configured, Maze Method stays usable in local mode with SQLite and AsyncStorage.

## Maze Coach

Maze Coach remains local-first. The mobile app has a local mock recommendation engine and can optionally call a secure backend for OpenAI-powered recommendations. It never calls OpenAI directly and never includes an OpenAI API key.

The local service reads:

- profile data
- height, weight, age, gender, units, and activity level
- fitness goal and training frequency
- recent workout logs
- recent nutrition logs
- Maze Coach tone preference

The local and backend-powered paths recommend:

- daily calories
- daily protein
- carbs target
- fat target
- suggested workout
- suggested meals
- recovery/rest day advice
- explanation of why the recommendation was generated

When `EXPO_PUBLIC_MAZE_COACH_API_URL` is configured, the Expo app sends profile/log summaries to `POST /api/maze-coach/recommendation`. The backend reads `OPENAI_API_KEY` from its own environment and calls the OpenAI Responses API with a structured JSON schema. If the backend or AI request fails, the app falls back to the local mock engine and stays usable offline.

Successful full-screen Maze Coach recommendations are saved locally in SQLite `maze_coach_history` for future history and sync work.

## Supabase Auth Foundation

Version 2A adds an optional Supabase auth layer. Version 2B adds a safe first cloud sync foundation. The mobile app reads only public Expo environment variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
EXPO_PUBLIC_MAZE_COACH_API_URL=http://localhost:8787
```

Do not put Supabase service role keys, database passwords, or OpenAI API keys in the mobile app. Maze Coach AI requests should go through `backend/` or a hosted equivalent such as a Supabase Edge Function.

## Secure AI Backend

Version 2C adds a lightweight backend foundation:

- `POST /api/maze-coach/recommendation`
- Server-side `OPENAI_API_KEY`
- structured JSON response for calories, macros, workout, meals, recovery, explanation, and safety note
- conservative fallback response when OpenAI is unavailable
- validation that tolerates incomplete profile/log data
- rate limiting placeholder comments where production controls should be added

Backend environment variables live in `backend/.env` and are documented in `backend/.env.example`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-backend-only-service-role-key-if-needed-later
CORS_ORIGIN=*
PORT=8787
```

The Supabase schema plan lives in `docs/supabase-schema.md`.

## Local-First Cloud Sync

SQLite remains the source of truth while sync is stabilizing. Signed-in users can back up local data to Supabase from Settings/Profile. The first time a user signs in, Maze Method asks whether to back up existing local data. The app pushes local rows first, then pulls remote rows, and never deletes local data automatically during first sync.

Sync metadata is stored locally on each record: local ID, remote ID, Supabase user ID, sync status, created/updated timestamps, and optional deletion timestamp. Simple conflict handling uses `updated_at`: newer unpushed local records are kept, while newer remote records can be pulled down after backup.

Progress photos upload to a Supabase Storage bucket named `progress-photos`. Maze Method stores the remote storage path while keeping the local URI when available, so offline use remains possible. Failed sync or photo uploads are shown in Settings/Profile and do not block local logging.

## Barcode Nutrition Logging

The Nutrition tab includes a `Scan Food` flow built with Expo Camera. The scanner requests camera permission before opening, pauses after the first detected barcode to avoid duplicate submissions, looks up product data through Open Food Facts, and sends the result to an editable confirmation screen.

Confirmed foods save through the existing local SQLite meal log, so scanned foods and manual meals appear together in the Nutrition tab. If Open Food Facts does not find a product, Maze Method opens the same confirmation flow with the barcode already filled in so the user can enter values manually. Recent scanned foods are stored in AsyncStorage for quick reuse.

## Setup Instructions

Install Node.js, npm, and Expo tooling. For iOS testing on a physical phone, install Expo Go from the App Store.

```bash
npm install
```

To test optional cloud auth, copy `.env.example` to `.env` and fill in your Supabase project URL and public anon key. Leave `.env` uncommitted.

To test the optional Maze Coach backend, install backend dev dependencies and create `backend/.env` from `backend/.env.example`:

```bash
cd backend
npm install
npm run dev
```

Keep `OPENAI_API_KEY` only in `backend/.env`. The Expo app should only receive `EXPO_PUBLIC_MAZE_COACH_API_URL`.

If Expo reports dependency mismatch warnings, run:

```bash
npx expo install --check
```

## How To Run The App

Start the Expo development server:

```bash
npm start
```

Start the optional backend in a second terminal when testing OpenAI-powered Maze Coach:

```bash
cd backend
npm run dev
```

If your phone cannot connect over LAN, use:

```bash
npx expo start --tunnel --clear
```

For iOS Expo Go, make sure the installed Expo Go SDK matches the project SDK. This project uses Expo SDK 54.

Run TypeScript verification:

```bash
npm run typecheck
```

Export an iOS bundle sanity check:

```bash
npx expo export --platform ios --output-dir .expo-export-check
```

## Screenshots

Add screenshots here when the app is captured from Expo Go or an iOS simulator.

- Home screen: _placeholder_
- Calendar screen: _placeholder_
- Workouts screen: _placeholder_
- Nutrition screen: _placeholder_
- Progress screen: _placeholder_
- Maze Coach screen: _placeholder_

## Portfolio Explanation

Maze Method is built to be easy to explain in an internship interview:

- It demonstrates a complete mobile product structure, not only isolated UI screens.
- It uses TypeScript types across navigation, database models, feature models, and form state.
- It separates UI, local storage, SQLite repositories, and business logic.
- It shows local-first product thinking with privacy-safe progress photos and no backend dependency.
- It includes a clear future AI path without exposing API keys in the mobile app.
- It uses simple, explainable algorithms for nutrition targets, progress summaries, personal records, and Maze Coach recommendations.
- It keeps the UI consistent through reusable components and theme constants.

## Future Improvements

- Supabase backend
- User authentication
- Cloud sync
- Production deployment for backend-powered Maze Coach
- Expanded barcode database support
- GPS cardio tracking
- Light mode
- Demo mode
- Apple Health integration
