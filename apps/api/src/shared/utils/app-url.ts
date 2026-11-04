const DEFAULT_APP_URL = "https://plato-work-out.com";

/** Endereço público do app, sem barra no fim. Base dos links de e-mail e de compartilhamento. */
export const getAppUrl = () => (process.env.APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, "");
