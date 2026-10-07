import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrmApp } from "./CrmApp";

// Sem VITE_SUPABASE_* nos testes, o painel abre em modo demonstração (como em "npm run dev").
describe("CRM em modo demonstração", () => {
  it("mostra o funil e recebe na coluna Novo o lead que chega do site", async () => {
    const user = userEvent.setup();
    render(<CrmApp />);

    expect(await screen.findByText(/Modo demonstração/)).toBeInTheDocument();
    const novo = () => screen.getByText("Novo", { selector: ".col-h b" }).closest(".col") as HTMLElement;
    const antes = within(novo()).getAllByRole("button").length;

    await user.click(screen.getByRole("button", { name: "Simular lead chegando do site" }));

    expect(within(novo()).getAllByRole("button")).toHaveLength(antes + 1);
    expect(novo().querySelector(".card.is-new")).not.toBeNull();
    expect(await screen.findByText(/^Lead novo:/)).toBeInTheDocument();
  });

  it("abre a gaveta do lead e muda a etapa", async () => {
    const user = userEvent.setup();
    render(<CrmApp />);
    await user.click(await screen.findByText("Marcos Teixeira"));

    const gaveta = screen.getByRole("dialog", { name: "Marcos Teixeira" });
    await user.selectOptions(within(gaveta).getByLabelText("Etapa"), "em_contato");

    const emContato = screen.getByText("Em contato", { selector: ".col-h b" }).closest(".col") as HTMLElement;
    expect(within(emContato).getByText("Marcos Teixeira")).toBeInTheDocument();
    expect(await within(gaveta).findByText("Etapa: Novo → Em contato")).toBeInTheDocument();

    await act(async () => {
      await user.keyboard("{Escape}");
    });
    expect(gaveta).toHaveAttribute("aria-hidden", "true");
  });

  it("permite trocar a senha provisória pelo botão do topo", async () => {
    const user = userEvent.setup();
    render(<CrmApp />);
    await user.click(await screen.findByRole("button", { name: "Trocar minha senha" }));

    const dialogo = screen.getByRole("dialog", { name: "Trocar minha senha" });
    await user.type(within(dialogo).getByLabelText(/Nova senha/), "senha-forte-1");
    await user.type(within(dialogo).getByLabelText("Repita a nova senha"), "senha-forte-2");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar senha" }));
    expect(within(dialogo).getByRole("alert")).toHaveTextContent("não são iguais");

    await user.clear(within(dialogo).getByLabelText("Repita a nova senha"));
    await user.type(within(dialogo).getByLabelText("Repita a nova senha"), "senha-forte-1");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar senha" }));
    expect(await screen.findByText("Senha atualizada")).toBeInTheDocument();
  });
});
