# Android build troubleshooting

## Get the actual error

The message "Gradle build failed with unknown error" hides the real cause. To see it:

**Local build:**
```bash
cd android && ./gradlew assembleDebug --stacktrace 2>&1 | tee ../gradle-build.log
```
Then open `gradle-build.log` and search for `FAILURE` or `error:` (usually near the end).

**EAS Build:** Open the failed build at [expo.dev](https://expo.dev) → your project → Builds → expand the **"Run gradlew"** step and scroll to the failure.

## Changes made to improve reliability

1. **`android/gradle.properties`**
   - Removed hardcoded `org.gradle.java.home=/opt/homebrew/opt/openjdk@17`. That path only exists on some Macs; on EAS or other machines it caused "Java home not found" or similar. The build now uses the system Java (JAVA_HOME or default).
   - If your local build can’t find Java, set `JAVA_HOME` in your shell or uncomment and set `org.gradle.java.home` in `gradle.properties` to your JDK 17 path.
   - Increased JVM memory to 4GB (`-Xmx4096m`) to reduce OOM during build.

2. **JDK**
   - Use **JDK 17** (recommended for React Native / Expo). Check with `java -version`.

## Common failures and fixes

| Error / symptom | Fix |
|----------------|-----|
| Java home not found / wrong JDK | Install JDK 17, set `JAVA_HOME`, and ensure no `org.gradle.java.home` in `gradle.properties` unless needed locally. |
| Out of memory (OOM) | Already increased in `gradle.properties`. If it still happens, try `resourceClass: "large"` for the Android profile in `eas.json`. |
| Duplicate resources (e.g. `ic_launcher`) | Run `npx expo prebuild --clean` and rebuild (back up any custom native changes first). |
| NDK / native build errors | Ensure Android SDK and NDK are installed (Android Studio SDK Manager). For EAS, the image provides them. |
| Build works locally but fails on EAS | Compare Gradle and JDK versions; ensure no machine-specific paths in `gradle.properties`. |

## Clean rebuild (local)

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

## EAS clean build

In `eas.json` you can add `"cache": { "key": "none" }` to the Android profile once to force a clean build, then remove it.
