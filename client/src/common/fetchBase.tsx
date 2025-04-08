declare global {
  interface ImportMeta {
    env: {
      VITE_APP_ENV: string;
    }
  }
}

const fetchBase = import.meta.env.VITE_APP_ENV === "development" ? "http://localhost:8080" : "https://api.gatorpool.app";

console.log("Environment:", import.meta.env.VITE_APP_ENV);
console.log("Fetch base:", fetchBase);

export default fetchBase;
