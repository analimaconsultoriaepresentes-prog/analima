import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages } from "npm:ai@6";
import { createResponsesCall } from "../_shared/responses.ts";
import { ANA_KNOWLEDGE } from "./knowledge.ts";
import { pageName, validateTranscript } from "./policy.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonError = (status: number, message: string) => new Response(JSON.stringify({ message }), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return jsonError(405, "Operação não permitida.");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!url || !anon || !key) return jsonError(503, "A ANA IA precisa de configuração. Tente novamente após a configuração do Lovable AI.");
  const authorization = request.headers.get("Authorization") ?? "";
  const auth = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return jsonError(401, "Sua sessão expirou. Entre novamente para conversar com a ANA IA.");
  // Same existing application access restriction, verified using Auth, not client metadata.
  if (user.email?.toLowerCase() !== "analimaconsultoriaepresentes@gmail.com") return jsonError(403, "Acesso restrito ao sistema ANA LIMA.");
  let body;
  try {
    body = await request.json();
    validateTranscript(body.messages);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Mensagem inválida.");
  }
  try {
    const call = createResponsesCall(request, {
      baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, model: "openai/gpt-6-astra",
    }, await convertToModelMessages(body.messages), `${ANA_KNOWLEDGE}\nPágina atual: ${pageName(body.page)}.`);
    const response = call.result.toUIMessageStreamResponse({
      originalMessages: body.messages,
      sendReasoning: true,
      onFinish: () => { /* Conversation intentionally not persisted. */ },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Não foi possível receber a resposta. Verifique sua conexão e tente novamente.";
        return message;
      },
    });
    const { withLovableAiGatewayRunIdHeader } = await import("../_shared/run-id.ts");
    return await withLovableAiGatewayRunIdHeader(response, call.gateway, cors);
  } catch (error) {
    if (request.signal.aborted) return jsonError(499, "Resposta interrompida.");
    return jsonError(500, error instanceof Error ? error.message : "Não foi possível conectar à ANA IA.");
  }
});