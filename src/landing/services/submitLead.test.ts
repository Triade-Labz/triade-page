import type { SupabaseConfigResult } from "../../shared/supabaseConfig";
import { LeadSubmitError, buildLeadPayload, collectOrigem, insertLead } from "./submitLead";

const config: SupabaseConfigResult = { ok: true, config: { url: "https://abc.supabase.co", key: "sb_publishable_k", legacyJwtKey: false } };
const payload = buildLeadPayload(
  { nome: "  Maria   Silva ", empresa: "Padaria\n", whatsapp: "+55 (51) 99999-8888", plano: "suporte", consentimento: true },
  new Date("2026-10-06T12:00:00Z"),
  { pagina: "/" },
);

function fakeFetch(status: number, body: unknown = "") {
  return vi.fn<typeof fetch>(async () => new Response(status === 201 ? null : JSON.stringify(body), { status }));
}

describe("buildLeadPayload", () => {
  it("envia exatamente o formato da tabela leads", () => {
    expect(payload).toEqual({
      nome: "Maria Silva",
      empresa: "Padaria",
      whatsapp: "51999998888",
      plano: "suporte",
      consentimento_em: "2026-10-06T12:00:00.000Z",
      origem: { pagina: "/" },
    });
  });
});

describe("collectOrigem", () => {
  it("guarda UTMs e quem trouxe a visita", () => {
    const o = collectOrigem({ search: "?utm_source=instagram&utm_campaign=out&x=1", pathname: "/", referrer: "https://google.com/", origin: "https://triade.dev" });
    expect(o).toEqual({ utm_source: "instagram", utm_campaign: "out", pagina: "/", referrer: "https://google.com/" });
  });

  it("ignora navegação dentro do próprio site", () => {
    const o = collectOrigem({ search: "", pathname: "/", referrer: "https://triade.dev/politica-de-privacidade.html", origin: "https://triade.dev" });
    expect(o).toEqual({ pagina: "/" });
  });
});

describe("insertLead", () => {
  it("faz POST na tabela leads com a chave publicável e sem pedir o registro de volta", async () => {
    const f = fakeFetch(201);
    await insertLead(payload, { config, fetchImpl: f });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://abc.supabase.co/rest/v1/leads");
    expect(init?.method).toBe("POST");
    const h = init?.headers as Record<string, string>;
    expect(h.apikey).toBe("sb_publishable_k");
    expect(h.Prefer).toBe("return=minimal");
    expect(h.Authorization).toBeUndefined(); // chave nova não é JWT
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it("manda Authorization com a chave anon antiga (JWT)", async () => {
    const f = fakeFetch(201);
    await insertLead(payload, { config: { ok: true, config: { url: "https://abc.supabase.co", key: "eyJx", legacyJwtKey: true } }, fetchImpl: f });
    expect((f.mock.calls[0]![1]?.headers as Record<string, string>).Authorization).toBe("Bearer eyJx");
  });

  it("explica o erro de permissão (o bug que impedia os leads de chegarem ao CRM)", async () => {
    const f = fakeFetch(401, { code: "42501", message: "permission denied for table leads" });
    const err = await insertLead(payload, { config, fetchImpl: f }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LeadSubmitError);
    expect(err).toMatchObject({ kind: "permission", code: "42501" });
    expect((err as Error).message).toContain("04-permissoes-site-crm.sql");
  });

  it("acusa Supabase não configurado sem chamar a rede", async () => {
    const f = fakeFetch(201);
    await expect(insertLead(payload, { config: { ok: false, reason: "missing", message: "faltou" }, fetchImpl: f })).rejects.toMatchObject({ kind: "config" });
    expect(f).not.toHaveBeenCalled();
  });

  it("diferencia dado recusado e falha de rede", async () => {
    await expect(insertLead(payload, { config, fetchImpl: fakeFetch(400, { code: "23514", message: "check" }) })).rejects.toMatchObject({ kind: "rejected" });
    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(insertLead(payload, { config, fetchImpl: offline })).rejects.toMatchObject({ kind: "network" });
  });

  it("desiste depois do tempo limite", async () => {
    const hang = vi.fn<typeof fetch>(
      (_u, init) => new Promise((_r, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    await expect(insertLead(payload, { config, fetchImpl: hang, timeoutMs: 10 })).rejects.toMatchObject({ kind: "timeout" });
  });
});
