# Maze Method App Store Release Checklist

Maze Method version 3 is prepared for public App Store release planning. Replace every placeholder before submission.

## Apple Developer Account Checklist

- Enroll in the Apple Developer Program with the correct individual or organization account.
- Confirm the Apple Developer Team ID and account holder access.
- Accept current Apple Developer Program agreements.
- Confirm two-factor authentication is active on the Apple ID.
- Create or confirm the final bundle identifier. Current placeholder: `com.yourname.mazemethod`.
- Confirm push notification capability if local notifications later become remote notifications.
- Confirm Sign in with Apple requirements if additional third-party sign-in providers are added later.

## App Store Connect Checklist

- Create the Maze Method app record in App Store Connect.
- Set app name to `Maze Method`.
- Set subtitle/tagline copy around `Every Rep Has Direction`.
- Choose category and age rating.
- Add final app icon and screenshots.
- Add support URL, marketing URL if available, and privacy policy URL.
- Complete App Privacy labels for local fitness, nutrition, photo metadata, Supabase auth, and optional cloud sync.
- Add review contact information.
- Add demo account information if Supabase cloud features are enabled for review.
- Confirm pricing and availability.

## Test Account Checklist

- Provide a reviewer account only for features that require login.
- Suggested placeholder email: `reviewer@mazemethod.app`.
- Replace the placeholder password before submission.
- Confirm the demo account has no sensitive health or medical data.
- Confirm local mode works without signing in.
- Confirm cloud sync, challenges, and backend Maze Coach are optional signed-in upgrades.

## Privacy Policy Checklist

- Explain local-first SQLite and AsyncStorage usage.
- Explain optional Supabase Auth and cloud sync.
- Explain progress photos can remain local and private to the device.
- Explain camera access is used for barcode scanning.
- Explain photo library access is used for user-selected progress photos.
- Explain Maze Coach provides general fitness and nutrition guidance, not medical advice.
- Explain what data is collected by any future analytics provider before enabling analytics.
- Add support contact for privacy and deletion requests.

## Screenshot Checklist

- Capture iPhone screenshots in the current App Store required sizes.
- Include Home, Calendar, Workouts, Nutrition, Progress, Maze Coach, and Challenges.
- Use non-sensitive demo data only.
- Show the premium dark Maze Method UI clearly.
- Avoid screenshots that imply medical claims or guaranteed fitness outcomes.

## Support URL And Email Checklist

- Replace placeholder support email `support@mazemethod.app` with a monitored inbox.
- Add a public support page before public release.
- Add a public privacy policy URL before public release.
- Add a public terms of use URL before public release.
- Confirm support links work from Settings/Profile and App Store Connect.

## EAS Build And Submit Commands

Run these from the project root after placeholders are replaced:

```bash
eas login
eas whoami
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Use a clean git working tree before production builds so the submitted build can be traced to a commit.

## Final Pre-Submission Checks

- Run `npm run typecheck`.
- Run `npx expo install --check`.
- Run `npx expo config --type public`.
- Run an iOS export sanity check.
- Test a fresh install with no local data.
- Test local mode with no Supabase environment variables.
- Test signed-in mode with Supabase environment variables.
- Test camera denied, photo permission denied, backend unavailable, and offline sync failure paths.
