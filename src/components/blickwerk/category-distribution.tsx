import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { ProcessEvent } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryDistribution({ events }: { events: ProcessEvent[] }) {
  const counts = new Map<string, number>();
  Object.keys(CATEGORY_LABELS).forEach((k) => counts.set(k, 0));
  events.forEach((e) => counts.set(e.category, (counts.get(e.category) ?? 0) + 1));

  const data = Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const total = events.length;

  return (
    <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)] h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Ereigniskategorien</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verteilung über {total} erkannte Ereignisse
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} Ereignisse`, ""]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "var(--muted-foreground)" }}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
