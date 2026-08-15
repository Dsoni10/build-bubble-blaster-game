# Turning Bubble Blaster into a shareable Android APK

Bubble Blaster is a web app (React + Canvas), so it already runs great inside
Chrome/WebView on any Android device — including Android 16 / API level 36.
This build environment can only run `npm` scripts (no Android SDK / Gradle / Java
toolchain), so I can't compile a signed `.apk` binary directly here. Below are
two reliable ways to get a real, installable `.apk` in a few minutes once you
have the built site (the `dist/` folder or a hosted URL).

## Option A — Fastest: PWABuilder (no Android Studio needed)

1. Deploy the built site somewhere public (Vercel/Netlify/GitHub Pages, or any
   static host). The app already includes a PWA manifest + icons
   (`public/manifest.webmanifest`), so it's installable out of the box.
2. Go to https://www.pwabuilder.com and paste your site's URL.
3. Click **Package for Stores → Android**.
4. Set:
   - Package ID: `com.yourname.bubbleblaster`
   - Target SDK / Compile SDK: **36** (Android 16) — PWABuilder lets you set
     this in the Android options screen.
5. Download the generated package — it includes a ready-to-install
   **signed .apk** (and an .aab for Play Store). Share the `.apk` file
   directly (e.g. via Drive/WhatsApp); the recipient just needs "install from
   unknown sources" enabled once.

This produces a real, standalone Android app (Trusted Web Activity) that
launches full-screen with no browser UI, using your manifest's icon and name.

## Option B — Full control: Capacitor + Android Studio

Run these locally (outside this environment), from the project root, after
`npm run build` has produced `dist/`:

```bash
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android
npx cap init "Bubble Blaster" "com.yourname.bubbleblaster" --web-dir=dist
npx cap add android
npx cap copy android
npx cap open android
```

This opens the project in Android Studio. Before building:

1. Open `android/variables.gradle` and set:
   ```gradle
   minSdkVersion = 24
   compileSdkVersion = 36
   targetSdkVersion = 36
   ```
2. Build → Generate Signed Bundle / APK → APK → create/select a keystore →
   Release. Android Studio outputs
   `android/app/release/app-release.apk`.
3. Share that `.apk` file — it installs and plays fully offline, targeting
   API level 36 as requested.

Either path takes the exact same `dist/` build produced by `npm run build`
in this project — no code changes are needed.
