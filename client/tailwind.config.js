/** @type {import('tailwindcss').Config} */

const {heroui} = require("@heroui/theme");

module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          RobotoThin: ["RobotoThin", fontFamily.sans],
          RobotoLight: ["RobotoLight", fontFamily.sans],
          RobotoRegular: ["RobotoRegular", fontFamily.sans],
          RobotoMedium: ["RobotoMedium", fontFamily.sans],
          RobotoSemiBold: ["RobotoSemiBold", fontFamily.sans],
          RobotoBold: ["RobotoBold", fontFamily.sans],
          RobotoExtraBold: ["RobotoExtraBold", fontFamily.sans],
          RobotoBlack: ["RobotoBlack", fontFamily.sans],
          RobotoExtraLight: ["RobotoExtraLight", fontFamily.sans],
        },
      },
    },
    darkMode: "class",
    plugins: [heroui({
        prefix: "heroui", // prefix for themes variables
        addCommonColors: true, // override common colors (e.g. "blue", "green", "pink").
        defaultTheme: "light", // default theme from the themes object
        defaultExtendTheme: "light", // default theme to extend on custom themes
        themes: {
          light: {
            layout: {}, // light theme layout tokens
            colors: {
              primary: {
                DEFAULT: "#24bf44",
                foreground: "#000000",
              },
              secondary: {
                DEFAULT: "#19802e",
                foreground: "#000000",
              },
              focus: "#BEF264",
            },
          },
          dark: {
            layout: {}, // dark theme layout tokens
            colors: {}, // dark theme colors
          },
          // ... custom themes
        },
    })],
  }