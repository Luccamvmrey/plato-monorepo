const rawBaseURL = import.meta.env.VITE_API_URL;

export const API_BASE_URL = rawBaseURL && rawBaseURL.startsWith("http")
    ? `${rawBaseURL.replace(/\/$/, "")}/api`
    : "/api";
