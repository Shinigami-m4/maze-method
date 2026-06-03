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
- Nutrition logging with daily totals, meal categories, calorie/protein/carb/fat tracking, macro progress bars, and target calculations.
- Progress tab with weight chart, macro chart, strength volume chart, cardio history, measurements, progress photo upload, photo comparison, and personal records.
- Maze Coach local mock recommendation engine with daily calorie and macro targets, suggested workout, suggested meals, recovery advice, and explanation.
- Local reminders for workouts, meal logging, and weekly progress photos.
- Settings/Profile screen for editing profile, goals, units, Maze Coach tone, reminders, and future placeholders.

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
```

The code is organized around feature areas. SQLite repositories keep database reads/writes out of screen components, while shared service files hold business logic such as nutrition targets, Maze Coach recommendations, and notification scheduling.

## Screens

- **Home:** calm dashboard with Maze Coach Card, Today's Path, quick actions, summary cards, and progress photo reminder.
- **Calendar:** monthly grid with indicators for workouts, meals, macros, cardio, weight, photos, and notes.
- **Workouts:** routine builder, exercise library, custom exercises, resource links, recent workouts, and personal records.
- **Nutrition:** meals, daily macro totals, target calculations, and future barcode/Maze Coach meal placeholders.
- **Progress:** charts, body measurements, progress photos, comparison view, cardio history, and records.
- **Maze Coach:** local recommendation screen with targets, workout, meals, recovery, explanation, and insights.
- **Settings/Profile:** profile editing, goal editing, unit changes, Maze Coach tone, reminders, and future settings placeholders.

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

The app does not seed fake user data. Built-in exercises are static reference data, but user logs start empty until the user creates entries.

## Maze Coach

Maze Coach is a local mock recommendation engine for version 1. It does not call OpenAI directly and does not include any API key in the mobile app.

The local service reads:

- profile data
- height, weight, age, gender, units, and activity level
- fitness goal and training frequency
- recent workout logs
- recent nutrition logs
- Maze Coach tone preference

It recommends:

- daily calories
- daily protein
- carbs target
- fat target
- suggested workout
- suggested meals
- recovery/rest day advice
- explanation of why the recommendation was generated

Future OpenAI integration should happen through a backend, such as a Supabase Edge Function, so secrets remain server-side.

## Setup Instructions

Install Node.js, npm, and Expo tooling. For iOS testing on a physical phone, install Expo Go from the App Store.

```bash
npm install
```

If Expo reports dependency mismatch warnings, run:

```bash
npx expo install --check
```

## How To Run The App

Start the Expo development server:

```bash
npm start
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
- OpenAI-powered Maze Coach through backend
- Barcode scanner
- GPS cardio tracking
- Light mode
- Demo mode
- Apple Health integration
