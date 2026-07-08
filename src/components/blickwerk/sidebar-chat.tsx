import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import {
  useAllLines,
  useSzenarienForLine,
  useActiveSzenario,
} from "@/lib/runs-store";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SEED: Message[] = [
  {
    role: "assistant",
    text: "Frag mich zu dieser Linie – z. B. „Wann war die längste Unterbrechung heute?“",
  },
];

function ChatBody({
  lineId,
  setLineId,
  szenarioId,
  setSzenarioId,
}: {
  lineId: string;
  setLineId: (id: string) => void;
  szenarioId: string;
  setSzenarioId: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(SEED);
  const allLines = useAllLines();
  const szenarien = useSzenarienForLine(lineId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: input },
      {
        role: "assistant",
        text: "Antworten werden generiert, sobald die VSS-Analyse angebunden ist. (Demo)",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <select
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          className="w-full rounded-md bg-background border border-border text-xs px-2 py-1.5 text-foreground"
        >
          {allLines.map((l) => (
            <option key={l.line.id} value={l.line.id}>
              {l.line.name}
            </option>
          ))}
        </select>
        <select
          value={szenarioId}
          onChange={(e) => setSzenarioId(e.target.value)}
          className="w-full rounded-md bg-background border border-border text-xs px-2 py-1.5 text-foreground"
        >
          {szenarien.length === 0 ? (
            <option value="">— kein Szenario —</option>
          ) : (
            szenarien.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-md px-2 py-1.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground border border-border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="p-2 border-t border-sidebar-border">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 focus-within:border-primary transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage stellen…"
            className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
            aria-label="Senden"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  );
}

export function SidebarChat({
  collapsed,
  defaultLineId,
}: {
  collapsed: boolean;
  defaultLineId: string;
}) {
  const [lineId, setLineId] = useState(defaultLineId);
  const activeSz = useActiveSzenario(lineId);
  const [szenarioId, setSzenarioId] = useState<string>("");
  useEffect(() => {
    if (activeSz && !szenarioId) setSzenarioId(activeSz.id);
  }, [activeSz, szenarioId]);

  useEffect(() => {
    setLineId(defaultLineId);
  }, [defaultLineId]);

  const [floatingOpen, setFloatingOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (collapsed) {
    return (
      <>
        <button
          ref={btnRef}
          onClick={() => setFloatingOpen((v) => !v)}
          className="w-full flex items-center justify-center px-2 py-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent no-print-interactive"
          aria-label="Chat öffnen"
          title="Frag die Anlage"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        {floatingOpen && (
          <div className="fixed bottom-4 left-16 z-50 w-80 h-[420px] rounded-xl border border-border bg-card shadow-2xl flex flex-col no-print">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Frag die Anlage
                </span>
              </div>
              <button
                onClick={() => setFloatingOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Schließen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatBody
                lineId={lineId}
                setLineId={setLineId}
                szenarioId={szenarioId}
                setSzenarioId={setSzenarioId}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 overflow-hidden no-print-interactive">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-sidebar-foreground">
          Frag die Anlage
        </span>
      </div>
      <div className="h-[280px]">
        <ChatBody
          lineId={lineId}
          setLineId={setLineId}
          szenarioId={szenarioId}
          setSzenarioId={setSzenarioId}
        />
      </div>
    </div>
  );
}
