import { LIMITES_PROJETO, type Projeto, type ProjetoUpdate } from "../../shared/projetos";
import { formatBrPhone, isValidBrPhone, normalizeBrPhone } from "../../shared/phone";
import { cleanText } from "../../shared/validation";
import { useToast } from "../../painel/components/toastContext";
import { CommitField } from "./CommitField";

interface Props {
  projeto: Projeto;
  onPatch: (patch: ProjetoUpdate, okMsg: string) => void;
}

/** Escopo: o que o cliente precisa, o que entra e o que fica fora (vira texto para mandar ao cliente). */
export function EscopoTab({ projeto: p, onPatch }: Props) {
  const toast = useToast();

  const texto = (campo: "nome" | "cliente", min: number, msg: string) => (v: string) => {
    const t = cleanText(v);
    if (t.length < min) {
      toast(msg, "err");
      return false;
    }
    onPatch({ [campo]: t }, "Salvo");
  };

  return (
    <div className="escopo">
      <div className="grid2">
        <div className="span2">
          <label className="lbl" htmlFor="pj-nome">
            Nome do projeto
          </label>
          <CommitField
            id="pj-nome"
            value={p.nome}
            maxLength={LIMITES_PROJETO.nome.max}
            onCommit={texto("nome", LIMITES_PROJETO.nome.min, "Dê um nome ao projeto.")}
          />
        </div>
        <div>
          <label className="lbl" htmlFor="pj-cliente">
            Cliente
          </label>
          <CommitField
            id="pj-cliente"
            value={p.cliente}
            maxLength={LIMITES_PROJETO.cliente.max}
            onCommit={texto("cliente", LIMITES_PROJETO.cliente.min, "Informe o nome do cliente.")}
          />
        </div>
        <div>
          <label className="lbl" htmlFor="pj-empresa">
            Empresa
          </label>
          <CommitField id="pj-empresa" value={p.empresa} maxLength={LIMITES_PROJETO.empresa.max} onCommit={(v) => onPatch({ empresa: cleanText(v) }, "Salvo")} />
        </div>
        <div>
          <label className="lbl" htmlFor="pj-wa">
            WhatsApp do cliente
          </label>
          <CommitField
            id="pj-wa"
            type="tel"
            inputMode="numeric"
            placeholder="(51) 90000-0000"
            value={p.whatsapp ?? ""}
            format={formatBrPhone}
            onCommit={(v) => {
              const d = normalizeBrPhone(v);
              if (d && !isValidBrPhone(d)) {
                toast("WhatsApp inválido: use DDD + número.", "err");
                return false;
              }
              onPatch({ whatsapp: d || null }, "Salvo");
            }}
          />
        </div>
      </div>

      <label className="lbl" htmlFor="pj-obj">
        Objetivo: o que o cliente precisa
      </label>
      <CommitField
        id="pj-obj"
        multiline
        maxLength={LIMITES_PROJETO.escopo.max}
        placeholder="Ex.: Página para divulgar os serviços e receber pedidos de orçamento pelo WhatsApp."
        value={p.objetivo}
        onCommit={(v) => onPatch({ objetivo: v }, "Escopo salvo")}
      />

      <label className="lbl" htmlFor="pj-req">
        O que está incluído (funcionalidades e entregas)
      </label>
      <CommitField
        id="pj-req"
        multiline
        maxLength={LIMITES_PROJETO.escopo.max}
        placeholder={"Uma por linha. Ex.:\nPágina única com serviços, depoimentos e mapa\nFormulário de contato\nBotão de WhatsApp"}
        value={p.requisitos}
        onCommit={(v) => onPatch({ requisitos: v }, "Escopo salvo")}
      />

      <label className="lbl" htmlFor="pj-fora">
        Fora do escopo (orçado à parte)
      </label>
      <CommitField
        id="pj-fora"
        multiline
        maxLength={LIMITES_PROJETO.escopo.max}
        placeholder={"Ex.:\nLoja virtual com pagamento online\nProdução de fotos e textos"}
        value={p.fora_escopo}
        onCommit={(v) => onPatch({ fora_escopo: v }, "Escopo salvo")}
      />

      <label className="lbl" htmlFor="pj-links">
        Links e referências (sites que o cliente gosta, Figma, repositório, domínio)
      </label>
      <CommitField
        id="pj-links"
        multiline
        maxLength={LIMITES_PROJETO.links.max}
        placeholder="Não guarde senhas aqui: use um gerenciador de senhas."
        value={p.links}
        onCommit={(v) => onPatch({ links: v }, "Salvo")}
      />
    </div>
  );
}
