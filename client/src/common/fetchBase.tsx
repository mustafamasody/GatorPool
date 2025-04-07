declare global {
  interface ImportMeta {
    env: {
      VITE_APP_ENV: string;
    }
  }
}

const fetchBase = import.meta.env.VITE_APP_ENV === "development" ? "http://localhost:8080" : "GAE_URL_HERE";

export default fetchBase;
