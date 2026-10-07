import { formatBrPhone, isValidBrPhone, normalizeBrPhone, waMeLink } from "./phone";

describe("normalizeBrPhone", () => {
  it.each([
    ["(51) 99999-8888", "51999998888"],
    ["+55 51 99999-8888", "51999998888"], // autopreenchimento do navegador com DDI
    ["5551999998888", "51999998888"],
    ["0 51 99999-8888", "51999998888"], // prefixo de tronco
    ["(55) 99999-8888", "55999998888"], // DDD 55 (Santa Maria, RS) não pode ser cortado
    ["51 3333-4444", "5133334444"],
    ["", ""],
  ])("%s -> %s", (input, out) => {
    expect(normalizeBrPhone(input)).toBe(out);
  });
});

describe("formatBrPhone", () => {
  it("formata celular e fixo", () => {
    expect(formatBrPhone("51999998888")).toBe("(51) 99999-8888");
    expect(formatBrPhone("5133334444")).toBe("(51) 3333-4444");
  });

  it("aceita digitação parcial", () => {
    expect(formatBrPhone("5")).toBe("5");
    expect(formatBrPhone("519")).toBe("(51) 9");
    expect(formatBrPhone("5199999")).toBe("(51) 9999-9");
  });

  it("converte o número colado com +55 em vez de cortar no meio", () => {
    expect(formatBrPhone("+55 (51) 99999-8888")).toBe("(51) 99999-8888");
  });
});

describe("isValidBrPhone", () => {
  it.each([
    ["51999998888", true],
    ["5133334444", true],
    ["55999998888", true],
    ["5199999888", true], // celular antigo de 8 dígitos: aceito, a equipe confirma no WhatsApp
    ["01999998888", false], // DDD com zero
    ["51899998888", false], // 11 dígitos sem o 9
    ["519999", false],
    ["5551999998888", false],
  ])("%s -> %s", (n, ok) => {
    expect(isValidBrPhone(n)).toBe(ok);
  });
});

it("waMeLink adiciona o 55 e a mensagem", () => {
  expect(waMeLink("51999998888", "Olá!")).toBe("https://wa.me/5551999998888?text=Ol%C3%A1!");
});
