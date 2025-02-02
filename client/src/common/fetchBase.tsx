let fetchBase = process.env.REACT_APP_ENV === "development" ? "http://localhost:8080" : "GAE_URL_HERE";

export default fetchBase;
