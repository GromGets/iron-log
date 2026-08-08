# Iron Log — Gym Tracker

A React Native (Expo) app for logging gym workouts: reps, sets, weight, and RIR per exercise,
with a "last time" reference while you train and stats to track your progress. Fully offline —
all data lives in a local SQLite database on your device, no account needed.

## Features

- **Routines** — build reusable routines (e.g. "Push Day") from a library of exercises
- **Workout logging** — log weight × reps × RIR (+ optional notes) per set, freestyle or from a routine
- **"Last time"** — see exactly what you did last session for each exercise while you're logging
- **Stats per exercise** — max weight, max reps, estimated 1RM, best session volume, and progress charts
- **Overall stats** — workout streak, weekly volume, session history
- **Body tracking** — body weight and measurements (waist, arms, chest, etc.) over time
- **Custom exercises** — add your own on top of ~40 built-in common exercises

## Requirements

- Node.js 18+ and npm
- The [Expo Go](https://expo.dev/go) app on your phone (easiest way to run it), **or** Xcode / Android Studio for simulators

## Setup

```bash
cd gym-tracker
npm install
npx expo start
```

This prints a QR code:
- **iOS**: scan it with your Camera app (opens in Expo Go)
- **Android**: scan it from within the Expo Go app
- Or press `i` / `a` in the terminal to launch an iOS/Android simulator, if you have one set up

The app works entirely offline after that — no backend, no login.

## Building a real installable app (not just Expo Go)

When you're ready for a standalone build you can install like a normal app (needed to publish
to the App Store / Play Store), use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

This requires a free Expo account. iOS builds need an Apple Developer account ($99/yr) to
distribute beyond internal testing; Android builds can be sideloaded for free.

## Project structure

```
App.tsx                     # entry point, DB init
src/
  theme/theme.ts             # design tokens (colors, type scale, spacing)
  types/index.ts              # shared TypeScript types
  data/exerciseLibrary.ts     # built-in exercise seed list
  db/
    database.ts                # SQLite connection + schema/migrations
    repository.ts               # CRUD queries
    stats.ts                    # PRs, volume, streaks, progress calculations
  navigation/RootNavigator.tsx # screen structure
  screens/                     # one file per screen
  components/                  # shared UI (buttons, cards, chart, set logger)
```

## Notes on the data model

- Everything is stored locally in SQLite (`expo-sqlite`) — uninstalling the app deletes your data,
  there's currently no export/backup feature. Worth adding before you rely on this long-term.
- Weight is stored as a plain number (assumed kg). If you want lb support, that'd be a good next
  feature — probably a settings screen with a unit toggle that converts on display.
- "Last time" pulls your most recent **finished** session that included that exercise, regardless
  of which routine it was part of.
