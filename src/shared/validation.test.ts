import { cleanText, firstError, validateLeadForm, type LeadFormValues } from "./validation";
import { parseSupabaseConfig } from "./supabaseConfig";

const ok: LeadFormValues = { nome: "Maria Silva", empresa: "Padaria", whatsapp: "(51) 99999-8888", plano: "essencial", consentimento: true };

describe("validateLeadForm", () => {
  it("aceita um pedido completo", () => {
    expect(validateLeadForm(ok)).toEqual({});
  });

  it("aponta cada campo inválido, na ordem da tela", () => {
    const e = validateLeadForm({ nome: " a ", empresa: "", whatsapp: "123", plano: "", consentimento: false });
    expect(Object.keys(e).sort()).toEqual(["consentimento", "empresa", "nome", "plano", "whatsapp"]);
    expect(firstError(e)).toBe("nome");
  });

  it("aceita WhatsApp preenchido pelo navegador com +55", () => {
    expect(validateLeadForm({ ...ok, whatsapp: "+55 51 99999-8888" })).toEqual({});
  });
});

it("cleanText remove quebras de linha e espaços repetidos", () => {
  expect(cleanText("  Maria\n\t  Silva ")).toBe("Maria Silva");
});

describe("parseSupabaseConfig", () => {
  it("lê URL e chave publicável", () => {
    const r = parseSupabaseConfig({ VITE_SUPABASE_URL: "https://abc.supabase.co/rest/v1/", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" });
    expect(r).toEqual({ ok: true, config: { url: "https://abc.supabase.co", key: "sb_publishable_x", legacyJwtKey: false } });
  });

  it("aceita a variável antiga ANON_KEY", () => {
    const r = parseSupabaseConfig({ VITE_SUPABASE_URL: "https://abc.supabase.co", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.x" });
    expect(r.ok && r.config.legacyJwtKey).toBe(true);
  });

  it("acusa configuração ausente", () => {
    expect(parseSupabaseConfig({}).ok).toBe(false);
  });

  it("recusa chave secreta no navegador", () => {
    const secret = parseSupabaseConfig({ VITE_SUPABASE_URL: "https://abc.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abc" });
    expect(secret).toMatchObject({ ok: false, reason: "secret-key" });
    const serviceRole = parseSupabaseConfig({
      VITE_SUPABASE_URL: "https://abc.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.x",
    });
    expect(serviceRole).toMatchObject({ ok: false, reason: "secret-key" });
  });

  it("exige https", () => {
    expect(parseSupabaseConfig({ VITE_SUPABASE_URL: "http://abc.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "k" })).toMatchObject({ ok: false, reason: "invalid-url" });
  });
});
