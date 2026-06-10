# Maze Method App Review Notes

These notes are for App Store review preparation. Replace placeholders before submitting a real build.

## Demo And Test Account Instructions

Maze Method can be reviewed without an account because the core app is local-first. Onboarding, workouts, calendar logging, nutrition, progress tracking, progress photos, barcode scanning, local reminders, Settings/Profile, and local Maze Coach fallback should all work in local mode.

If the review build includes Supabase cloud features, provide a demo account in App Store Connect:

- Email: `reviewer@mazemethod.app`
- Password: `REPLACE_WITH_TEST_PASSWORD`

Do not include sensitive medical information in the demo account. Use simple sample workout and nutrition entries only if demo data is intentionally prepared.

## What Apple Reviewer Should Test

- Complete onboarding and enter a basic profile.
- Open Home and confirm Maze Coach Card, Today's Path, and Settings/Profile access.
- Create a workout routine and custom exercise.
- Log a workout from Calendar.
- Add manual cardio and daily notes.
- Add manual meals and daily macro totals.
- Scan a food barcode or deny camera permission to confirm the permission state.
- Add body weight, a body measurement, and a progress photo, or deny photo permission to confirm the permission state.
- Open Maze Coach and confirm recommendations use local fallback if the backend is unavailable.
- Open Settings/Profile and confirm account, sync status, legal/support placeholders, reminders, and data request placeholders.
- Sign in only if demo cloud credentials are provided.
- Open Challenges only if Supabase Auth and challenge tables are configured.

## Features Requiring Login

- Supabase cloud backup and pull sync.
- Social challenges and leaderboards.
- Challenge participation history.
- Any future friend invites or cloud profile features.

Core tracking remains usable without login.

## Safety And Privacy Notes

Maze Coach provides general fitness and nutrition guidance. Maze Coach is not medical advice. Users should consult a qualified professional before making major health changes.

Testing data may be reset during TestFlight or App Store review builds. Reviewers and testers should avoid entering sensitive medical information.

## Reviewer Support

- Support email placeholder: `support@mazemethod.app`
- Privacy policy URL placeholder: `https://mazemethod.app/privacy`
- Terms of use URL placeholder: `https://mazemethod.app/terms`

Replace these with live public links before production release.
