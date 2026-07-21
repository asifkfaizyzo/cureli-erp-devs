

# Cureli Mobile — Development & Build Guide

This project uses:

- **Expo SDK 54**
- **Expo Router**
- **expo-dev-client**
- Native modules such as:
  - `react-native-razorpay`
  - `expo-notifications`
  - `react-native-maps`
  - `expo-location`

Because of this, **Expo Go is not enough** for normal development.  
Use a **development build** instead.

---

# 1. Important: API Base URL Setup

File:

```ts
src/constants/config.ts
```

Use one of these depending on platform.

---

## A. Android device over USB

Use `localhost`:

```ts
export const CONFIG = {
  BASE_URL: "http://localhost:3500",
  API_TIMEOUT: 15000,
};
```

Why:
- Android USB dev uses `adb reverse`
- `localhost` becomes your computer through USB tunnel

---

## B. iPhone / EAS-installed build / LAN testing

Use your computer’s local IP:

```ts
export const CONFIG = {
  BASE_URL: "http://192.168.100.101:3500",
  API_TIMEOUT: 15000,
};
```

Why:
- iPhone does **not** support `adb reverse`
- EAS-installed builds on physical devices must reach backend over Wi-Fi/LAN

---

# 2. When You Need a Rebuild

## No rebuild needed
If you changed only:
- `.ts`, `.tsx`, `.js`, `.jsx`
- hooks
- screens
- components
- stores
- services
- `src/constants/config.ts`

Then just restart Metro or reload app.

---

## Rebuild required
If you changed any **native-related config**, you must rebuild the app.

Examples:
- `app.config.js`
- `app.json`
- `eas.json`
- Expo plugins
- Android permissions
- iOS permissions
- `google-services.json`
- package/bundle identifiers
- notification config
- maps config
- splash/icon config
- installed/removed native dependencies
- after running:

```bash
npx expo prebuild --clean
```

---

# 3. Windows + Android Development

This is the main workflow for a **physical Android phone connected by USB**.

---

## 3.1 Daily JS-only development

Use this when you changed only app code.

### Step 1 — Start backend

```bash
cd backend
npm start
```

Make sure backend is running on:

```txt
http://localhost:3500
```

---

### Step 2 — Confirm Android device is connected

```bash
adb devices
```

Your phone should appear in the list.

---

### Step 3 — Reverse required ports

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
```

- `8081` = Metro bundler
- `3500` = backend API

---

### Step 4 — Start Expo dev server

```bash
cd cureli-mobile
npx expo start --dev-client
```

If cache is acting weird:

```bash
npx expo start --dev-client -c
```

---

### Step 5 — Open the dev build on phone

If the development build is already installed:
- open the **Cureli** app manually on the phone

Or press:

```txt
a
```

inside the Expo terminal.

---

## 3.2 After native changes

Use this if you changed:
- `app.config.js`
- notifications config
- maps config
- native dependency
- package name
- scheme
- permissions
- splash/icon
- or ran `prebuild --clean`

### Step 1 — Start backend

```bash
cd backend
npm start
```

---

### Step 2 — Rebuild native Android app and install to phone

```bash
cd cureli-mobile
npx expo prebuild --platform android --clean
npx expo run:android
```

This compiles and installs the dev build onto the connected Android device.

---

### Step 3 — Reverse ports again

```bash
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
```

---

### Step 4 — Start Metro

```bash
npx expo start --dev-client -c
```

---

## 3.3 If you see this error

```txt
No development build (com.cureli.mobile) for this project is installed.
```

It means:
- the app is not installed on the phone
- or you ran `prebuild --clean` and did not reinstall

### Fix

```bash
cd cureli-mobile
npx expo run:android
```

Then start Metro again:

```bash
npx expo start --dev-client
```

---

# 4. macOS + iOS Development

Local iOS development requires:
- **macOS**
- **Xcode**
- iOS Simulator or physical iPhone

If you are on Windows, skip to the EAS section.

---

## 4.1 iOS Simulator (macOS only)

### Best config
For iOS Simulator, `localhost` usually works:

```ts
export const CONFIG = {
  BASE_URL: "http://localhost:3500",
  API_TIMEOUT: 15000,
};
```

---

### Daily JS-only development

#### Step 1 — Start backend

```bash
cd backend
npm start
```

#### Step 2 — Start Expo dev server

```bash
cd cureli-mobile
npx expo start --dev-client
```

#### Step 3 — Open the iOS dev build

If already installed in Simulator, open the app.  
Otherwise build it once with:

```bash
npx expo run:ios
```

---

## 4.2 iOS after native changes

```bash
cd cureli-mobile
npx expo prebuild --platform ios --clean
npx expo run:ios
npx expo start --dev-client -c
```

---

## 4.3 Physical iPhone (macOS only)

For a real iPhone, **do not use `localhost`**.

Use LAN IP in `src/constants/config.ts`:

```ts
export const CONFIG = {
  BASE_URL: "http://192.168.100.101:3500",
  API_TIMEOUT: 15000,
};
```

Make sure:
- Mac and iPhone are on the same Wi-Fi
- backend is reachable on that IP
- firewall allows port `3500`

### Commands

```bash
cd backend
npm start
```

```bash
cd cureli-mobile
npx expo start --dev-client --host lan
```

Then open the installed dev build on iPhone.

---

# 5. EAS Build Profiles

Your current `eas.json` profiles are:

- `development`
- `preview`
- `production`

From your config:

- `development` = dev client build
- `preview` = internal installable build
- `production` = release build

---

# 6. EAS One-Time Setup

Run once:

```bash
cd cureli-mobile
npx eas login
npx eas build:configure
```

---

# 7. EAS Development Builds

Use these when you want a **real dev client** installed on a device.

These work for:
- Android physical phones
- iPhones
- internal dev testing

---

## 7.1 Android dev build

```bash
cd cureli-mobile
npx eas build --profile development --platform android
```

Install the generated build on the Android phone.

Then run Metro:

```bash
npx expo start --dev-client
```

If using USB and `localhost` API:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3500 tcp:3500
```

---

## 7.2 iOS dev build

```bash
cd cureli-mobile
npx eas build --profile development --platform ios
```

Install it on the iPhone.

Then run:

```bash
npx expo start --dev-client --host lan
```

Use LAN IP in `config.ts`.

---

# 8. EAS Preview Builds

Use preview builds for:
- QA
- sharing with testers
- internal testing without Metro

Your Android preview build is configured as an **APK**.

---

## 8.1 Android preview

```bash
cd cureli-mobile
npx eas build --profile preview --platform android
```

This will generate an installable APK.

---

## 8.2 iOS preview

```bash
cd cureli-mobile
npx eas build --profile preview --platform ios
```

This will generate an internal test build for iPhone.

---

# 9. EAS Production Builds

Use these for store-ready builds.

---

## 9.1 Android production

```bash
cd cureli-mobile
npx eas build --profile production --platform android
```

---

## 9.2 iOS production

```bash
cd cureli-mobile
npx eas build --profile production --platform ios
```

---

# 10. Recommended Development Workflow by Platform

---

## Windows + Android USB

### JS-only changes

```bash
cd backend
npm start
```

```bash
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3500 tcp:3500
```

```bash
cd cureli-mobile
npx expo start --dev-client
```

---

### Native changes

```bash
cd backend
npm start
```

```bash
cd cureli-mobile
npx expo prebuild --platform android --clean
npx expo run:android
```

```bash
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3500 tcp:3500
```

```bash
npx expo start --dev-client -c
```

---

## macOS + iOS Simulator

### JS-only changes

```bash
cd backend
npm start
```

```bash
cd cureli-mobile
npx expo start --dev-client
```

---

### Native changes

```bash
cd cureli-mobile
npx expo prebuild --platform ios --clean
npx expo run:ios
npx expo start --dev-client -c
```

---

## macOS + physical iPhone

Use LAN IP in `config.ts`.

```bash
cd backend
npm start
```

```bash
cd cureli-mobile
npx expo start --dev-client --host lan
```

If native config changed, rebuild/install dev build again first via Xcode or EAS development build.

---

# 11. Important Project-Specific Notes

Because your app uses these native integrations:

- `expo-dev-client`
- `react-native-razorpay`
- `expo-notifications`
- `react-native-maps`
- `expo-location`

### This means:
- **Use development builds**
- **Do not rely on Expo Go for real app testing**

---

## Native config in your `app.config.js`

These changes require rebuilds:

- `scheme: "curelimobile"`
- `ios.bundleIdentifier: "com.cureli.mobile"`
- `android.package: "com.cureli.mobile"`
- `googleServicesFile`
- `expo-notifications` plugin config
- `expo-location` plugin config
- `expo-splash-screen` plugin config
- Google Maps API key config
- Android permissions array

---

# 12. Troubleshooting

---

## Problem: Metro starts but app won’t open

Make sure the dev build is installed.

Android fix:

```bash
npx expo run:android
```

---

## Problem: API calls fail on Android USB

If `BASE_URL` is:

```ts
http://localhost:3500
```

you must run:

```bash
adb reverse tcp:3500 tcp:3500
```

---

## Problem: API calls fail on iPhone

If using iPhone:
- do **not** use `localhost`
- use LAN IP instead

Example:

```ts
http://192.168.100.101:3500
```

Also check:
- backend is running
- same Wi-Fi
- firewall not blocking

---

## Problem: changes don’t reflect

Clear Metro cache:

```bash
npx expo start --dev-client -c
```

If native config changed, rebuild the app too.

---

## Problem: after `prebuild --clean`, app no longer opens

That is expected until you reinstall the native build.

Fix:

```bash
npx expo run:android
```

or

```bash
npx expo run:ios
```

or build/install a new EAS dev build.

---

# 13. Suggested `config.ts` Patterns

---

## For Android USB dev

```ts
export const CONFIG = {
  BASE_URL: "http://localhost:3500",
  API_TIMEOUT: 15000,
};
```

---

## For iPhone / EAS / LAN testing

```ts
export const CONFIG = {
  BASE_URL: "http://192.168.100.101:3500",
  API_TIMEOUT: 15000,
};
```

---

# 14. Quick Command Cheat Sheet

---

## Android USB daily dev

```bash
cd backend
npm start
```

```bash
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3500 tcp:3500
```

```bash
cd cureli-mobile
npx expo start --dev-client
```

---

## Android after native change

```bash
cd cureli-mobile
npx expo prebuild --platform android --clean
npx expo run:android
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3500 tcp:3500
npx expo start --dev-client -c
```

---

## iOS Simulator

```bash
cd backend
npm start
cd cureli-mobile
npx expo start --dev-client
```

---

## iOS native rebuild

```bash
cd cureli-mobile
npx expo prebuild --platform ios --clean
npx expo run:ios
npx expo start --dev-client -c
```

---

## EAS development build

```bash
cd cureli-mobile
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

---

## EAS preview build

```bash
cd cureli-mobile
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
```

---

## EAS production build

```bash
cd cureli-mobile
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

---

If you want, I can also turn this into:
1. a **short version for your own notes**, and  
2. a **formal `README.md` markdown file** with headings and code blocks exactly ready to paste.