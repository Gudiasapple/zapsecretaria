import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Bot, Loader2, Plus, Trash2, MessageCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTheme } from '../Layout';
import ReactMarkdown from 'react-markdown';

export default function ChatIA() {
  const { dark } = useTheme();
  const [conversation, setConversation] = useState(null);
  const conversationRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Cria conversa ao montar
  useEffect(() => {
    createNewConversation();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe em tempo real — só enquanto não está enviando para evitar conflito
  useEffect(() => {
    if (!conversation?.id) return;
    let active = true;
    let unsub;
    try {
      unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (active) setMessages(data.messages || []);
      });
    } catch (_) {
      // Conversa inválida, ignora
    }
    return () => {
      active = false;
      unsub?.();
    };
  }, [conversation?.id]);

  const createNewConversation = async () => {
    setLoading(true);
    setError(null);
    setConversation(null);
    conversationRef.current = null;
    setMessages([]);
    const conv = await base44.agents.createConversation({
      agent_name: 'dra_maria',
      metadata: { name: 'Teste via Dashboard' },
    });
    conversationRef.current = conv;
    setConversation(conv);
    setLoading(false);
  };

  const handleNewChat = () => {
    createNewConversation();
  };

  const handleSend = async () => {
    const conv = conversationRef.current;
    if (!input.trim() || sending || !conv) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Mostra mensagem do usuário imediatamente
    setMessages(prev => [...prev, { role: 'user', content: text, id: 'tmp-' + Date.now() }]);

    let currentConv = conv;
    // Se a conversa expirou, cria uma nova automaticamente
    if (!currentConv?.id) {
      const newConv = await base44.agents.createConversation({
        agent_name: 'dra_maria',
        metadata: { name: 'Teste via Dashboard' },
      });
      conversationRef.current = newConv;
      setConversation(newConv);
      currentConv = newConv;
    }

    let updated;
    try {
      updated = await base44.agents.addMessage(currentConv, { role: 'user', content: text });
    } catch (err) {
      // Conversa não existe mais — cria nova e tenta de novo
      const newConv = await base44.agents.createConversation({
        agent_name: 'dra_maria',
        metadata: { name: 'Teste via Dashboard' },
      });
      conversationRef.current = newConv;
      setConversation(newConv);
      updated = await base44.agents.addMessage(newConv, { role: 'user', content: text });
    }

    conversationRef.current = updated;
    setConversation(updated);
    setMessages(updated.messages || []);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <div className={cn("flex flex-col h-screen", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>

      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-b flex-shrink-0",
        dark ? "bg-[#0D0D14] border-white/5" : "bg-white border-zinc-100"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-400/30">
            <Bot className="w-4.5 h-4.5 text-amber-950" />
          </div>
          <div>
            <p className={cn("text-sm font-bold", dark ? "text-white" : "text-zinc-900")}>Maria — Secretária IA</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className={cn("text-[11px]", dark ? "text-white/40" : "text-zinc-400")}>Ativa · Modo de teste</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
            dark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5" : "border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova conversa
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <Loader2 className={cn("w-5 h-5 animate-spin", dark ? "text-amber-400" : "text-amber-500")} />
              <p className={cn("text-sm", dark ? "text-white/40" : "text-zinc-400")}>Iniciando conversa...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-rose-400">{error}</p>
            <button onClick={handleNewChat} className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 text-xs font-semibold">Tentar novamente</button>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex gap-3 justify-start">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", dark ? "bg-amber-500/15" : "bg-amber-100")}>
              <Bot className={cn("w-4 h-4", dark ? "text-amber-400" : "text-amber-700")} />
            </div>
            <div className={cn("rounded-2xl px-4 py-2.5 border max-w-[75%]", dark ? "bg-[#13131C] border-white/5 text-white/90" : "bg-white border-zinc-100 text-zinc-900")}>
              <p className="text-sm leading-relaxed">Oi! 😊 Aqui é a Maria, da clínica. Como posso te ajudar hoje?</p>
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} dark={dark} />
          ))
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 justify-start">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", dark ? "bg-amber-500/15" : "bg-amber-100")}>
              <Bot className={cn("w-4 h-4", dark ? "text-amber-400" : "text-amber-700")} />
            </div>
            <div className={cn("rounded-2xl px-4 py-3 border", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
              <div className="flex gap-1 items-center h-4">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", dark ? "bg-white/30" : "bg-zinc-400")} style={{ animationDelay: '0ms' }} />
                <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", dark ? "bg-white/30" : "bg-zinc-400")} style={{ animationDelay: '150ms' }} />
                <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", dark ? "bg-white/30" : "bg-zinc-400")} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={cn(
        "px-4 py-4 border-t flex-shrink-0",
        dark ? "bg-[#0D0D14] border-white/5" : "bg-white border-zinc-100"
      )}>
        <div className={cn(
          "flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all",
          dark ? "bg-white/5 border-white/8 focus-within:border-amber-500/30" : "bg-zinc-50 border-zinc-200 focus-within:border-amber-300"
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            rows={1}
            className={cn(
              "flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed max-h-32",
              dark ? "text-white placeholder:text-white/25" : "text-zinc-900 placeholder:text-zinc-400"
            )}
            style={{ fieldSizing: 'content' }}
            disabled={sending || loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || loading}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all hover:shadow-lg hover:shadow-amber-400/30"
          >
            <Send className="w-3.5 h-3.5 text-amber-950" />
          </button>
        </div>
        <p className={cn("text-center text-[10px] mt-2", dark ? "text-white/15" : "text-zinc-300")}>
          Modo de teste · As ações da IA afetam o banco de dados real
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, dark }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", dark ? "bg-amber-500/15" : "bg-amber-100")}>
          <Bot className={cn("w-4 h-4", dark ? "text-amber-400" : "text-amber-700")} />
        </div>
      )}
      <div className={cn("max-w-[75%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 text-amber-950"
            : dark ? "bg-[#13131C] border border-white/5 text-white/90" : "bg-white border border-zinc-100 text-zinc-900"
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}