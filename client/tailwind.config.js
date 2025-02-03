/** @type {import('tailwindcss').Config} */

const {heroui} = require("@heroui/theme");
// const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        screens: {
          mobile: "320px",
          tablet: "480px",
          laptop: "770px",
          desktop: "1024px",
          desktop2: "1280px",
          xl: "1440px",
          mmxl: "1500px",
          prehalfxl: "1660px",
          halfxl: "1600px",
          halfxlactual: "1805px",
          threequarterxl: "1920px",
          threequarterxl2: "1960px",
          threequarterxl3: "2000px",
          threefivequarterxl: "2044px",
          halfxxl: "2148px",
          xxl: "2412px",
          threexl: "2560px",
          threexl2: "2700px",
          halfhalf: "1078px",
        },
        fontFamily: {
          RobotoThin: ["RobotoThin"],
          RobotoLight: ["RobotoLight"],
          RobotoRegular: ["RobotoRegular"],
          RobotoMedium: ["RobotoMedium"],
          RobotoSemiBold: ["RobotoSemiBold"],
          RobotoBold: ["RobotoBold"],
          RobotoExtraBold: ["RobotoExtraBold"],
          RobotoBlack: ["RobotoBlack"],
          RobotoExtraLight: ["RobotoExtraLight"],
        },
        colors: {
          'gator-translucent': 'rgba(39, 245, 121, 0.2)', // Custom class for your color
          'gator-translucent2': 'rgba(39, 245, 121, 0.3)', // Custom class for your color
        }
      },
    },
    // darkMode: "class",
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
            },          },
          // ... custom themes
        },
    })],
  }