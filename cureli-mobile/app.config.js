// app.config.js
import "dotenv/config";

export default {
  expo: {
    owner: "your-zeros-and-ones",
    name: "Cureli",
    slug: "cureli-mobile",
    version: "2.1.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "curelimobile",
    userInterfaceStyle: "automatic", 
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.cureli.mobile",
      buildNumber: "1",          
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Cureli needs your location to help fill your delivery address.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Cureli needs your location to help fill your delivery address.",
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#090025",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.cureli.mobile",
      versionCode: 14,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-dev-client",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/cureliwhitenew.png",
          imageWidth: 160,
          resizeMode: "contain",
          backgroundColor: "#020023",
        },
      ],
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Cureli needs your location to help fill your delivery address.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-monochrome.png",
          color: "#020023",
          defaultChannel: "default",
          sounds: [],
        },
      ],
      // ── Pin AGP version for EAS build compatibility ───────────
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.1.20",
            agpVersion: "8.3.2",
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "ad36bf8e-0d58-4e84-acc9-7e64b7b4cdee",
      },
    },
  },
};