/**
 * Entrada usada só no build (vite build --ssr): gera o HTML da landing e da
 * política de privacidade, para as páginas chegarem prontas ao navegador e ao
 * Google, como no site estático original. O CRM não é pré-renderizado.
 */
import { renderToString } from "react-dom/server";
import { App } from "./landing/App";
import { PrivacyPolicy } from "./privacy/PrivacyPolicy";

export const pages: Record<string, () => string> = {
  "index.html": () => renderToString(<App />),
  "politica-de-privacidade.html": () => renderToString(<PrivacyPolicy />),
};
