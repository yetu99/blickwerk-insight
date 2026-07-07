import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SEED_CONVO: Message[] = [
  { role: "user", text: "Wann war die längste Unterbrechung heute Vormittag?" },
  {
    role: "assistant",
    text: "Zwischen 09:47 und 09:59 Uhr stand die Linie 12 Minuten still. Ursache laut Ereignis-Feed: Prozessunterbrechung am Bandantrieb.",
  },
  { role: "user", text: "Welche Fehlerkategorie tritt am häufigsten auf?" },
  {
    role: "assistant",
    text: "In den letzten 2 Stunden dominiert 'Farbverwechslung' mit 8 Vorfällen – überwiegend bei Kastenwechseln kurz vor der Pause.",
  },
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(SEED_CONVO);

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
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col h-full">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Frag die Anlage</h3>
          <p className="text-[11px] text-muted-foreground">Natürlichsprachige Prozessabfrage</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="p-3 border-t border-border">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="z. B. Wie hoch war die Fehlerquote in der letzten Stunde?"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Senden"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Demo-Antworten · KI-Anbindung erfolgt in nächster Ausbaustufe
        </p>
      </form>
    </div>
  );
}
