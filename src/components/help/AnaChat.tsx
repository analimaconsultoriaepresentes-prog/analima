import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocation } from "react-router-dom";
import { RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import mascotImage from "@/assets/mascot-ana.png";

const PAGE_TITLES: Record<string, string> = { dashboard: "Dashboard", produtos: "Produtos", etiquetas: "Etiquetas", vendas: "Vendas", clientes: "Clientes", despesas: "Despesas", contas: "Contas", relatorios: "Relatórios", configuracoes: "Configurações", "conferir-estoque": "Conferir estoque" };

export function AnaChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const page = location.pathname.slice(1) || "dashboard";
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ana-ia`,
    headers: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sua sessão expirou. Entre novamente para conversar.");
      return { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` };
    },
    fetch: async (url, init) => {
      let response: Response;
      try { response = await fetch(url, init); }
      catch (error) {
        if (init?.signal?.aborted) throw error;
        throw new Error("Não foi possível conectar à ANA IA. Verifique sua internet e tente novamente.");
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "A ANA IA está indisponível. Tente novamente mais tarde.");
      }
      return response;
    },
  }), []);
  const { messages, sendMessage, status, stop, setMessages, clearError } = useChat({
    transport,
    onError: (error) => setFailure(error.message),
    onFinish: ({ message, isAborted }) => {
      if (!isAborted && !message.parts.some(part => part.type === "text" && part.text.trim())) {
        setFailure("A ANA IA não retornou uma resposta. O atendimento foi encerrado; envie uma nova pergunta quando estiver disponível.");
      }
    },
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    if (!open || confirmReset) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || (active instanceof HTMLTextAreaElement && active !== textarea.current)) return;
    textarea.current?.focus();
  }, [open, busy, confirmReset]);
  useEffect(() => () => { stop(); }, [stop]);

  const reset = () => {
    stop(); setMessages([]); clearError(); setFailure(null); setInput(""); setConfirmReset(false);
  };

  return (
    <section role="dialog" aria-label="Chat da ANA IA" aria-hidden={!open} hidden={!open}
      className="fixed bottom-[116px] right-3 z-50 flex h-[min(580px,calc(100dvh-140px))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl max-sm:bottom-3 max-sm:h-[min(620px,calc(100dvh-24px))]">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/30 p-3">
        <img src={mascotImage} alt="" className="h-12 w-12 shrink-0 object-contain" />
        <div className="min-w-0 flex-1"><h2 className="font-semibold">ANA IA</h2><p className="text-xs text-muted-foreground">{PAGE_TITLES[page] ?? "ANA LIMA"}</p></div>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Nova conversa" onClick={() => messages.length ? setConfirmReset(true) : reset()}><RotateCcw /></Button></TooltipTrigger><TooltipContent>Nova conversa</TooltipContent></Tooltip>
        <Button variant="ghost" size="icon-sm" aria-label="Fechar chat" onClick={onClose}><X /></Button>
      </header>
      {confirmReset ? <div className="flex flex-1 flex-col justify-center gap-4 p-6"><p>Iniciar uma nova conversa e limpar as mensagens atuais?</p><div className="flex flex-wrap gap-2"><Button onClick={reset}>Nova conversa</Button><Button variant="outline" onClick={() => setConfirmReset(false)}>Continuar conversa</Button></div></div> : <>
        <Conversation className="min-h-0" aria-label="Mensagens da ANA IA">
          <ConversationContent className="gap-5 p-4">
            <Message from="assistant"><MessageContent><MessageResponse>Olá! Sou a ANA IA 😊 Como posso ajudar você hoje?</MessageResponse></MessageContent></Message>
            {messages.map(message => <Message key={message.id} from={message.role}>
              <MessageContent className={message.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground break-words" : "break-words"}>
                {message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : part.type === "reasoning" && part.text ? <details key={index} className="text-xs text-muted-foreground"><summary>Analisando sua pergunta</summary><MessageResponse>{part.text}</MessageResponse></details> : null)}
              </MessageContent>
            </Message>)}
            {status === "submitted" && <div role="status"><Shimmer className="text-sm">ANA IA está pensando…</Shimmer></div>}
            {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
          </ConversationContent>
          <ConversationScrollButton aria-label="Ir para a última mensagem" />
        </Conversation>
        <div className="shrink-0 border-t border-border p-3">
          <PromptInput onSubmit={async ({ text }) => {
            if (busy || !text.trim()) return;
            setFailure(null); clearError(); setInput(""); textarea.current?.focus();
            await sendMessage({ text: text.trim() }, { body: { page } });
          }}>
            <PromptInputTextarea ref={textarea} value={input} onChange={event => setInput(event.target.value)} aria-label="Pergunta para ANA IA" placeholder="Digite sua dúvida…" maxLength={8000} className="min-h-16 max-h-32" />
            <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={() => { stop(); textarea.current?.focus(); }} disabled={!busy && !input.trim()} aria-label={busy ? "Interromper resposta" : "Enviar pergunta"} title={busy ? "Interromper resposta" : "Enviar pergunta"} /></PromptInputFooter>
          </PromptInput>
        </div>
      </>}
    </section>
  );
}