// app.config.js
import 'dotenv/config'; 
export default {
  expo: {
    name: "Cureli",
    slug: "cureli-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "curelimobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Cureli needs your location to help fill your delivery address.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Cureli needs your location to help fill your delivery address.",
      },
      config: {
        // ✅ Read from environment — never hardcoded
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
      config: {
        googleMaps: {
          // ✅ Read from environment — never hardcoded
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
          backgroundColor: "#05015A",
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
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};