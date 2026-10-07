/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = import.meta.dirname;

/**
 * Avisa no build de produção quando o Supabase não está configurado.
 * Sem essas variáveis o formulário do site não grava leads e o CRM não abre,
 * então é melhor descobrir isso no deploy do que pelo cliente.
 */
function avisoDeConfiguracao(mode: string): Plugin {
  return {
    name: "triade:aviso-configuracao",
    apply: "build",
    configResolved() {
      const env = loadEnv(mode, root, "VITE_");
      const faltando = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"].filter((k) => {
        if (k === "VITE_SUPABASE_PUBLISHABLE_KEY") return !env[k] && !env.VITE_SUPABASE_ANON_KEY;
        return !env[k];
      });
      if (faltando.length && mode === "production") {
        console.warn(
          `\n⚠️  Variáveis ausentes: ${faltando.join(", ")}.\n` +
            "   O formulário do site NÃO vai gravar leads e o CRM vai mostrar a tela de configuração.\n" +
            "   Configure-as em .env (local) ou nas variáveis de ambiente da hospedagem.\n",
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), avisoDeConfiguracao(mode)],
  build: {
    rolldownOptions: {
      // Três páginas independentes: o site não carrega o código do CRM e vice-versa.
      input: {
        site: resolve(root, "index.html"),
        privacidade: resolve(root, "politica-de-privacidade.html"),
        crm: resolve(root, "crm.html"),
      },
      // O React vira um arquivo próprio, em cache entre as três páginas.
      output: {
        codeSplitting: { groups: [{ name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }] },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "database/tests/**/*.test.ts"],
    testTimeout: 20000,
    // Testes nunca falam com o Supabase de verdade, mesmo com o .env preenchido.
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "", VITE_SUPABASE_ANON_KEY: "", DATABASE_URL: "" },
  },
}));
