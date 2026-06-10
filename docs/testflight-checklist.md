# Maze Method TestFlight Checklist

Version 2D release readiness checklist for iOS TestFlight testing.

## Release Config

- App name: Maze Method
- Current Expo app version: `2.0.0`
- Current iOS build number: `1`
- Bundle identifier placeholder: `com.yourname.mazemethod`
- Replace the placeholder bundle identifier before running EAS Build if you want this build connected to your real Apple Developer account.
- Final app icon is not configured yet. Add a production icon asset before App Store review.

## Before EAS Build

- Confirm you have an Expo account.
- Confirm you have access to an Apple Developer Program account.
- Pick a final iOS bundle identifier, for example `com.yourname.mazemethod`.
- Update `expo.ios.bundleIdentifier` in `app.json` if the placeholder is not final.
- Confirm `expo.version` and `expo.ios.buildNumber` are correct for the build you are shipping.
- Add a final app icon before App Store review.
- Run `npm install`.
- Run `npm run typecheck`.
- Run `npx expo install --check`.
- Test the app locally in Expo Go or a development build before sending to testers.

## EAS Build Flow

1. Install or run the latest EAS CLI:

```bash
npm install --global eas-cli
```

Or use:

```bash
npx eas-cli@latest
```

2. Log in to Expo:

```bash
eas login
eas whoami
```

3. Configure the project for EAS:

```bash
eas build:configure
```

4. Build for iOS production/TestFlight:

```bash
eas build --platform ios --profile production
```

5. Submit the completed build to App Store Connect:

```bash
eas submit --platform ios --profile production
```

## App Store Connect TestFlight Setup

- Create the Maze Method app record in App Store Connect.
- Match the App Store Connect bundle ID to `expo.ios.bundleIdentifier`.
- Fill in required app metadata, category, privacy details, and age rating.
- Upload screenshots when available.
- Add internal testers first.
- Add external testers only after privacy text, support email, and tester notes are ready.
- Add TestFlight beta review notes explaining that Maze Method is a local-first fitness tracker and Maze Coach is general guidance, not medical advice.

## Tester Instructions

- Install TestFlight from the App Store.
- Open the TestFlight invite link from your email or Messages.
- Install Maze Method from TestFlight.
- Complete onboarding with test data.
- Test Home, Calendar, Workouts, Nutrition, Progress, Maze Coach, Settings/Profile, barcode scanning, reminders, and support.
- Report bugs with steps to reproduce, screenshots, iPhone model, iOS version, and app build number.

## Safety And Privacy Notes For Testers

- Maze Coach provides general fitness and nutrition suggestions only. It is not medical advice.
- Data may be reset during testing.
- Do not enter sensitive medical information.
- Use test photos if you do not want to store real progress photos on your device.
- Local data remains on the phone unless optional cloud features are configured and used.

## Quick Smoke Test

- Launch the app fresh and complete onboarding.
- Create a workout routine and log it on Calendar.
- Add a meal manually.
- Scan a barcode if camera permission is available.
- Add body weight, a measurement, and a progress photo.
- Open Maze Coach and confirm a recommendation appears.
- Open Settings/Profile, confirm support opens, and check cloud auth still works locally when not signed in.
