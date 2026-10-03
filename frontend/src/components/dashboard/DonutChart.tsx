"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Segment = { label: string; value: number; color: string };

export function DonutChart({ segments }: { segments: Segment[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={segments} dataKey="value" nameKey="label" innerRadius={65} outerRadius={95} paddingAngle={2}>
            {segments.map((seg, i) => (
              <Cell key={i} fill={seg.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-text-secondary">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}