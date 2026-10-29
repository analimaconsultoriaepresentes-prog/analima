export const PAGE_NAMES: Record<string, string> = {
  dashboard: "Dashboard", produtos: "Produtos", etiquetas: "Etiquetas", vendas: "Vendas",
  clientes: "Clientes", despesas: "Despesas", contas: "Contas a Pagar/Receber",
  relatorios: "Relatórios", configuracoes: "Configurações", "conferir-estoque": "Conferir estoque",
};

export function pageName(value: unknown) {
  return typeof value === "string" ? PAGE_NAMES[value] ?? "Página não identificada" : "Página não identificada";
}

// Only text and inline reasoning from the transcript; no attachments, tools or store records.
export function validateTranscript(value: unknown) {
  if (!Array.isArray(value) || !value.length) throw new Error("Envie uma pergunta para a ANA IA.");
  let textSize = 0;
  for (const message of value) {
    if (!message || typeof message.id !== "string" || !["user", "assistant"].includes(message.role) || !Array.isArray(message.parts)) {
      throw new Error("Conversa inválida. Inicie uma nova conversa.");
    }
    for (const part of message.parts) {
      if (!part || !["text", "reasoning"].includes(part.type) || typeof part.text !== "string") {
        throw new Error("A ANA IA aceita somente mensagens de texto.");
      }
      textSize += part.text.length;
    }
  }
  if (textSize > 120000) throw new Error("Esta conversa ficou muito longa. Inicie uma nova conversa.");
  if (value.at(-1)?.role !== "user") throw new Error("Envie uma nova pergunta para continuar.");
  return value;
}