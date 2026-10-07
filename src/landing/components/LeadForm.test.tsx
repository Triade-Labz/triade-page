import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { insertLead } from "../services/submitLead";

vi.mock("../services/submitLead", async (importOriginal) => {
  const real = await importOriginal<typeof import("../services/submitLead")>();
  return { ...real, insertLead: vi.fn() };
});

const insertMock = vi.mocked(insertLead);

function form() {
  return screen.getByRole("form", { name: "Pedido de orçamento" });
}

async function preencher(user: ReturnType<typeof userEvent.setup>) {
  const f = within(form());
  await user.type(f.getByLabelText("Nome"), "Maria Silva");
  await user.type(f.getByLabelText("Empresa"), "Padaria Pão Quente");
  await user.type(f.getByLabelText("WhatsApp"), "+55 51 99999-8888");
  await user.selectOptions(f.getByLabelText("Interesse"), "suporte");
  await user.click(f.getByRole("checkbox"));
}

beforeEach(() => {
  insertMock.mockReset();
});

describe("formulário de orçamento", () => {
  it("mostra os erros e foca o primeiro campo quando está vazio", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(form()).getByRole("button", { name: /solicitar orçamento/i }));
    const nome = within(form()).getByLabelText("Nome");
    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(nome).toHaveFocus();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("envia o lead no formato do banco e confirma para a pessoa", async () => {
    insertMock.mockResolvedValue();
    const user = userEvent.setup();
    render(<App />);
    await preencher(user);
    expect(within(form()).getByLabelText("WhatsApp")).toHaveValue("(51) 99999-8888");

    await user.click(within(form()).getByRole("button", { name: /solicitar orçamento/i }));

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0]![0]).toMatchObject({
      nome: "Maria Silva",
      empresa: "Padaria Pão Quente",
      whatsapp: "51999998888",
      plano: "suporte",
      origem: { pagina: "/" },
    });
    expect(await screen.findByText(/Obrigado, Maria!/)).toBeInTheDocument();
  });

  it("avisa quando o envio falha, sem perder o que foi digitado", async () => {
    insertMock.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<App />);
    await preencher(user);
    await user.click(within(form()).getByRole("button", { name: /solicitar orçamento/i }));
    expect(await within(form()).findByRole("alert")).toHaveTextContent(/não conseguimos enviar/i);
    expect(within(form()).getByLabelText("Nome")).toHaveValue("Maria Silva");
  });

  it("botão de plano já escolhe o interesse no formulário", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "Escolher Profissional" }));
    expect(within(form()).getByLabelText("Interesse")).toHaveValue("profissional");
    await user.click(screen.getByRole("link", { name: /Agendar análise de vulnerabilidades/ }));
    expect(within(form()).getByLabelText("Interesse")).toHaveValue("seguranca");
  });

  it("robô que preenche o honeypot recebe sucesso falso e nada é gravado", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await preencher(user);
    const hp = container.querySelector<HTMLInputElement>('input[name="website"]')!;
    hp.value = "http://spam.example";
    await user.click(within(form()).getByRole("button", { name: /solicitar orçamento/i }));
    expect(await screen.findByText(/Recebemos seu pedido/)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });
});
