import "dotenv/config";

export default {
  expo: {
    owner: "your-zeros-and-ones",
    name: "Cureli Delivery",
    slug: "cureli-delivery",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cureli-delivery",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "in.cureli.delivery",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Cureli Delivery needs your location for navigation.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Cureli Delivery needs your location for navigation.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0D0D0D",
        foregroundImage: "./assets/images/icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "in.cureli.delivery",
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
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
          image: "./assets/images/splash-icon.png",
          imageWidth: 150,
          resizeMode: "contain",
          backgroundColor: "#0D0D0D",
        },
      ],
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Cureli Delivery needs your location for navigation.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
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
    },
    extra: {
      router: {},
      eas: {
        projectId: "",
      },
    },
  },
};