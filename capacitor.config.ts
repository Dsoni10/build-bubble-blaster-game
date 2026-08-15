import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yourname.bubbleblaster",
  appName: "Bubble Blaster",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#05061a",
  },
};

export default config;
