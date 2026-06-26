"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface HistoricalData {
  year: number;
  revenue: number;
  netIncome: number;
  freeCashFlow: number;
}

interface FinancialChartsProps {
  data: HistoricalData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary/90 border border-border/40 backdrop-blur-md rounded-2xl p-4 shadow-xl space-y-1.5 text-xs text-foreground font-semibold">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Year {label}</p>
        {payload.map((pld: any) => (
          <div key={pld.name} className="flex justify-between items-center gap-6">
            <span className="text-muted-foreground/95 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pld.color || pld.fill }} />
              {pld.name}:
            </span>
            <span className="text-foreground font-bold">${pld.value.toFixed(2)}B</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialCharts({ data }: FinancialChartsProps) {
  // Format numbers to Billions for readability
  const formattedData = data.map((d) => ({
    ...d,
    revenueBillions: parseFloat((d.revenue / 1e9).toFixed(2)),
    netIncomeBillions: parseFloat((d.netIncome / 1e9).toFixed(2)),
    fcfBillions: parseFloat((d.freeCashFlow / 1e9).toFixed(2)),
    yearString: String(d.year),
  }));

  return (
    <div className="space-y-8 w-full max-w-full min-w-0 overflow-hidden">
      {/* Revenue & Net Income Chart */}
      <div className="space-y-2 w-full max-w-full min-w-0 overflow-hidden">
        <h4 className="text-xs font-semibold text-muted-foreground/80">Historical Revenue & Net Income ($ Billions)</h4>
        <div className="h-64 w-full max-w-full min-w-0 overflow-hidden pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3" stroke="hsl(var(--border))" opacity={0.02} vertical={false} />
              <XAxis dataKey="yearString" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.015)" }} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} />
              <Bar dataKey="revenueBillions" name="Revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="netIncomeBillions" name="Net Income" fill="hsl(var(--primary))" opacity={0.35} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Free Cash Flow Chart */}
      <div className="space-y-2 w-full max-w-full min-w-0 overflow-hidden">
        <h4 className="text-xs font-semibold text-muted-foreground/80">Free Cash Flow Expansion ($ Billions)</h4>
        <div className="h-64 w-full max-w-full min-w-0 overflow-hidden pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFcf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3" stroke="hsl(var(--border))" opacity={0.02} vertical={false} />
              <XAxis dataKey="yearString" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} />
              <Area 
                type="monotone" 
                dataKey="fcfBillions" 
                name="Free Cash Flow" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorFcf)" 
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
