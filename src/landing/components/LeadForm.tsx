import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { cx } from "../../shared/cx";
import { PLANO_INFO, PLANOS, isPlano, type Plano } from "../../shared/leads";
import { formatBrPhone } from "../../shared/phone";
import { companyWaLink } from "../../shared/siteConfig";
import { MENSAGENS, cleanText, firstError, validateLeadForm, type LeadFormErrors, type LeadFormField, type LeadFormValues } from "../../shared/validation";
import { LeadSubmitError, buildLeadPayload, collectOrigem, insertLead } from "../services/submitLead";
import { IconArrow, IconCheck } from "./icons";

export interface PlanPrefill {
  plano: Plano;
  /** Muda a cada clique, para o mesmo plano poder ser escolhido de novo. */
  seq: number;
}

const VAZIO: LeadFormValues = { nome: "", empresa: "", whatsapp: "", plano: "", consentimento: false };

const GRUPOS = ["Sites e sistemas", "Outros serviços"] as const;

type Status = { tipo: "editando" } | { tipo: "enviando" } | { tipo: "enviado"; primeiroNome: string; whatsapp: string } | { tipo: "erro"; detalhe: string };

export function LeadForm({ prefill }: { prefill: PlanPrefill | null }) {
  const [values, setValues] = useState<LeadFormValues>(VAZIO);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [status, setStatus] = useState<Status>({ tipo: "editando" });
  const honeypot = useRef<HTMLInputElement>(null);
  const resetBtn = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const focusField = (f: LeadFormField) => document.getElementById(id(f))?.focus();

  // Botões de plano da página ("Começar agora", "Pedir proposta de suporte"...) já marcam o interesse.
  const [prefillSeq, setPrefillSeq] = useState(0);
  if (prefill && prefill.seq !== prefillSeq) {
    setPrefillSeq(prefill.seq);
    setValues((v) => ({ ...v, plano: prefill.plano }));
    setErrors((e) => ({ ...e, plano: undefined }));
  }

  useEffect(() => {
    if (status.tipo === "enviado") resetBtn.current?.focus();
  }, [status.tipo]);

  function update<K extends LeadFormField>(field: K, value: LeadFormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.tipo === "enviando") return; // evita lead duplicado com Enter repetido

    const found = validateLeadForm(values);
    setErrors(found);
    const first = firstError(found);
    if (first) {
      focusField(first);
      return;
    }
    if (!isPlano(values.plano)) return;

    const primeiroNome = cleanText(values.nome).split(" ")[0] ?? "";
    const concluir = () => {
      setStatus({ tipo: "enviado", primeiroNome, whatsapp: formatBrPhone(values.whatsapp) });
      window.gtag?.("event", "generate_lead", { plano: values.plano });
      window.fbq?.("track", "Lead", { content_name: values.plano });
    };

    // Honeypot preenchido = robô: finge sucesso e não grava.
    if (honeypot.current?.value) {
      concluir();
      return;
    }

    setStatus({ tipo: "enviando" });
    try {
      await insertLead(buildLeadPayload({ ...values, plano: values.plano }, new Date(), collectOrigem()));
      concluir();
    } catch (err) {
      const detalhe = err instanceof LeadSubmitError ? `[${err.kind}${err.code ? ` ${err.code}` : ""}] ${err.message}` : String(err);
      console.error("[Tríade] Falha ao enviar lead para o CRM:", detalhe, err);
      setStatus({ tipo: "erro", detalhe });
    }
  }

  function novoPedido() {
    setValues(VAZIO);
    setErrors({});
    setStatus({ tipo: "editando" });
    if (honeypot.current) honeypot.current.value = "";
    requestAnimationFrame(() => focusField("nome"));
  }

  const enviando = status.tipo === "enviando";
  const waFallback = companyWaLink(
    values.nome && values.empresa && isPlano(values.plano)
      ? `Olá! Sou ${cleanText(values.nome)}, da ${cleanText(values.empresa)}. Quero um orçamento (plano: ${PLANO_INFO[values.plano].rotulo}).`
      : "Olá! Quero um orçamento.",
  );

  const fieldProps = (f: LeadFormField) => ({
    id: id(f),
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? id(`${f}-err`) : undefined,
  });

  const errorText = (f: LeadFormField) => (
    <span className="err" id={id(`${f}-err`)}>
      {errors[f] ?? MENSAGENS[f]}
    </span>
  );

  return (
    <form className={cx("glass form", status.tipo === "enviado" && "done")} noValidate onSubmit={onSubmit} aria-label="Pedido de orçamento">
      <div className="fields">
        <div className={cx("field", errors.nome && "invalid")}>
          <label htmlFor={id("nome")}>Nome</label>
          <input
            {...fieldProps("nome")}
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Seu nome completo"
            maxLength={120}
            required
            value={values.nome}
            onChange={(e) => update("nome", e.target.value)}
          />
          {errorText("nome")}
        </div>
        <div className={cx("field", errors.empresa && "invalid")}>
          <label htmlFor={id("empresa")}>Empresa</label>
          <input
            {...fieldProps("empresa")}
            name="empresa"
            type="text"
            autoComplete="organization"
            placeholder="Nome da empresa"
            maxLength={160}
            required
            value={values.empresa}
            onChange={(e) => update("empresa", e.target.value)}
          />
          {errorText("empresa")}
        </div>
        <div className={cx("field", errors.whatsapp && "invalid")}>
          <label htmlFor={id("whatsapp")}>WhatsApp</label>
          <input
            {...fieldProps("whatsapp")}
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(11) 90000-0000"
            required
            value={values.whatsapp}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update("whatsapp", formatBrPhone(e.target.value))}
          />
          {errorText("whatsapp")}
        </div>
        <div className={cx("field", errors.plano && "invalid")}>
          <label htmlFor={id("plano")}>Interesse</label>
          <select {...fieldProps("plano")} name="plano" required value={values.plano} onChange={(e) => update("plano", isPlano(e.target.value) ? e.target.value : "")}>
            <option value="">Selecione uma opção</option>
            {GRUPOS.map((g) => (
              <optgroup label={g} key={g}>
                {PLANOS.filter((p) => PLANO_INFO[p].grupo === g).map((p) => (
                  <option value={p} key={p}>
                    {PLANO_INFO[p].rotulo}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errorText("plano")}
        </div>

        {/* Honeypot anti-spam: invisível para pessoas; gerenciadores de senha são orientados a ignorar. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor={id("website")}>Site</label>
          <input
            ref={honeypot}
            id={id("website")}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
          />
        </div>

        <div className={cx("field", errors.consentimento && "invalid")}>
          <label className="consent" htmlFor={id("consentimento")}>
            <input
              {...fieldProps("consentimento")}
              name="consentimento"
              type="checkbox"
              required
              checked={values.consentimento}
              onChange={(e) => update("consentimento", e.target.checked)}
            />
            <span>
              Concordo com a{" "}
              <a href="politica-de-privacidade.html" target="_blank" rel="noopener">
                Política de Privacidade
              </a>{" "}
              e autorizo o contato pelo WhatsApp.
            </span>
          </label>
          {errorText("consentimento")}
        </div>

        <div className={cx("form-error", status.tipo === "erro" && "show")} role="alert">
          {status.tipo === "erro" && (
            <>
              Não conseguimos enviar seu pedido agora. Verifique sua conexão e tente de novo em instantes.
              {waFallback && (
                <>
                  {" "}
                  Se preferir,{" "}
                  <a href={waFallback} target="_blank" rel="noopener">
                    fale com a gente pelo WhatsApp
                  </a>
                  .
                </>
              )}
              {import.meta.env.DEV && <code className="form-error-dev">{status.detalhe}</code>}
            </>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-block form-submit" aria-busy={enviando}>
          <span className="btn-label">{enviando ? "Enviando…" : "Solicitar orçamento"}</span> <IconArrow />
        </button>
        <p className="form-note">Seus dados estão seguros. Sem spam.</p>
      </div>

      <div className="success" role="status" aria-live="polite">
        {status.tipo === "enviado" && (
          <>
            <div className="check">
              <IconCheck />
            </div>
            <h3>Recebemos seu pedido!</h3>
            <p>
              Obrigado, {status.primeiroNome}! Um especialista entra em contato pelo WhatsApp {status.whatsapp} em até 2 horas úteis.
            </p>
            <button ref={resetBtn} type="button" className="btn btn-secondary btn-sm" onClick={novoPedido}>
              Enviar outro pedido
            </button>
          </>
        )}
      </div>
    </form>
  );
}
