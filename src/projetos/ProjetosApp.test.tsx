import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { modeloDoPlano } from "./lib/modelos";
import { ProjetosApp } from "./ProjetosApp";

// Sem VITE_SUPABASE_* nos testes, o painel abre em modo demonstração (como em "npm run dev").
const coluna = (nome: string) => screen.getByText(nome, { selector: ".col-h b" }).closest(".col") as HTMLElement;

describe("Controle de projetos em modo demonstração", () => {
  it("mostra o quadro por etapa e recebe em Escopo o contrato fechado no CRM", async () => {
    const user = userEvent.setup();
    render(<ProjetosApp />);

    expect(await screen.findByText(/Modo demonstração/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CRM" })).toHaveAttribute("href", "/crm.html");
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute("aria-current", "page");
    const antes = within(coluna("Escopo")).getAllByRole("button").length;

    await user.click(screen.getByRole("button", { name: "Simular contrato fechado no CRM" }));

    expect(within(coluna("Escopo")).getAllByRole("button")).toHaveLength(antes + 1);
    expect(coluna("Escopo").querySelector(".card.is-new")).not.toBeNull();
    expect(await screen.findByText(/^Contrato fechado no CRM:/)).toBeInTheDocument();
  });

  it("abre o projeto, marca tarefa e avança de etapa pulando o que não é do plano", async () => {
    const user = userEvent.setup();
    render(<ProjetosApp />);
    await user.click(await screen.findByText("Landing page — Padaria Pão Quente"));

    const gaveta = screen.getByRole("dialog", { name: "Landing page — Padaria Pão Quente" });
    const barra = within(gaveta).getByRole("progressbar", { name: "Progresso do projeto" });
    const antes = Number(barra.getAttribute("aria-valuenow"));

    const pendente = within(gaveta).getAllByRole("checkbox").find((c) => !(c as HTMLInputElement).checked);
    if (!pendente) throw new Error("sem tarefa pendente");
    await user.click(pendente);
    expect(pendente).toBeChecked();
    expect(Number(barra.getAttribute("aria-valuenow"))).toBeGreaterThan(antes);

    // Essencial não tem integração backend: de Landing page vai direto para Revisão e entrega.
    await user.click(within(gaveta).getByRole("button", { name: /Avançar para Revisão e entrega/ }));
    expect(within(coluna("Revisão e entrega")).getByText("Landing page — Padaria Pão Quente")).toBeInTheDocument();

    await user.click(within(gaveta).getByRole("tab", { name: "Histórico" }));
    expect(await within(gaveta).findByText("Etapa: Landing page → Revisão e entrega")).toBeInTheDocument();

    await act(async () => {
      await user.keyboard("{Escape}");
    });
    expect(gaveta).toHaveAttribute("aria-hidden", "true");
  });

  it("cria projeto à mão já com o checklist do plano e salva o escopo", async () => {
    const user = userEvent.setup();
    render(<ProjetosApp />);
    await user.click(await screen.findByRole("button", { name: "Novo projeto" }));

    const dialogo = screen.getByRole("dialog", { name: "Novo projeto" });
    await user.type(within(dialogo).getByLabelText("Nome do projeto"), "Sistema de agendamento — Clínica Sorriso");
    await user.type(within(dialogo).getByLabelText("Cliente"), "Joana");
    await user.selectOptions(within(dialogo).getByLabelText("Plano"), "completo");
    await user.click(within(dialogo).getByRole("button", { name: "Criar projeto" }));

    const gaveta = await screen.findByRole("dialog", { name: "Sistema de agendamento — Clínica Sorriso" });
    expect(await within(gaveta).findAllByRole("checkbox")).toHaveLength(modeloDoPlano("completo").length);
    expect(within(coluna("Escopo")).getByText("Sistema de agendamento — Clínica Sorriso")).toBeInTheDocument();

    await user.click(within(gaveta).getByRole("tab", { name: "Escopo" }));
    await user.type(within(gaveta).getByLabelText(/Objetivo/), "Agendamento online com lembrete no WhatsApp.");
    await user.tab();
    expect(await screen.findByText("Escopo salvo")).toBeInTheDocument();
  });
});
