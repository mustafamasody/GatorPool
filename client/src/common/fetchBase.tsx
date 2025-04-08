declare global {
  interface ImportMeta {
    env: {
      VITE_APP_ENV: string;
    }
  }
}

const fetchBase = import.meta.env.VITE_APP_ENV === "development" ? "http://localhost:8080" : "https://gatorpool-449522.ue.r.appspot.com";

export default fetchBase;
