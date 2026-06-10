# Maze Method Privacy Policy Draft

Last updated: June 9, 2026

This draft is for TestFlight readiness and should be reviewed before public release.

## App Summary

Maze Method is a fitness tracking app for workouts, routines, nutrition, progress photos, body measurements, cardio, reminders, and Maze Coach recommendations.

## Data Stored On Device

Maze Method is local-first. The app may store the following data on the device:

- Profile information such as name, age, gender, height, weight, goal weight, units, activity level, and fitness goals.
- Workout routines, exercise notes, resource links, workout logs, and personal records.
- Meal logs, daily calories, protein, carbs, and fats.
- Body weight, measurements, cardio sessions, daily notes, and progress photo metadata.
- Local image URIs for progress photos.
- Reminder preferences, unit preferences, onboarding status, and Maze Coach tone.
- Maze Coach recommendation history.

## Optional Cloud Features

Maze Method includes optional Supabase authentication and cloud sync foundations. Users can continue using local mode without signing in. When cloud sync is used, selected app data may be uploaded to the configured Supabase project for backup and future sync.

Progress photos may be uploaded to Supabase Storage only when cloud sync is configured and the user chooses to sync.

## Maze Coach

Maze Coach provides general fitness and nutrition suggestions. It is not medical advice.

The local Maze Coach mock engine runs on the device. If the optional backend URL is configured, Maze Coach may send profile and recent log summaries to the Maze Method backend. The backend can call OpenAI using a server-side API key. OpenAI API keys are not stored in the mobile app.

Do not enter sensitive medical information into Maze Method or Maze Coach.

## Photos

Progress photos are selected by the user and stored locally unless optional cloud sync is configured.

## Notifications

Maze Method can schedule local reminders for workouts, meals, and progress photos. Reminder preferences are stored locally.

## TestFlight Notice

During TestFlight testing, data may be reset, schema may change, and bugs may occur. Testers should avoid entering sensitive personal or medical data.

## Contact

Support email placeholder: `support@mazemethod.app`

Replace this placeholder with a real monitored support email before external testing or public release.
