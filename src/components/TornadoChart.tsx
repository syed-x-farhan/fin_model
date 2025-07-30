import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, LabelList } from 'recharts';

// Custom YAxis tick renderer for vertical centering
const CenteredYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      dy={8} // Adjust this value to fine-tune vertical centering
      textAnchor="end"
      fill="#22223b"
      fontSize={14}
      fontWeight={600}
      style={{ pointerEvents: 'none' }}
    >
      {payload.value}
    </text>
  );
};

export default function TornadoChart({ data }: { data: any }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card className="w-full h-56 flex items-center justify-center bg-muted border border-dashed border-border text-muted-foreground">
        <CardContent>No tornado data</CardContent>
      </Card>
    );
  }
  // Prepare chart data
  const chartData = data.map((d: any) => ({
    variable: d.variable,
    Low: Math.min(d.low, d.high),
    High: Math.max(d.low, d.high),
    base: d.base,
  }));
  const base = data[0]?.base ?? 0;
  const LOW_COLOR = '#fb7185'; // coral
  const HIGH_COLOR = '#2dd4bf'; // teal
  const BASE_COLOR = '#2563eb'; // blue
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Tornado Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 32, right: 50, left: 100, bottom: 10 }}
              barCategoryGap={12}
            >
              <XAxis type="number" tickFormatter={v => `$${v.toLocaleString()}`} className="text-sm" axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="variable"
                width={140}
                className="text-sm font-semibold"
                axisLine={false}
                tickLine={false}
                tick={CenteredYAxisTick}
              />
              <Tooltip formatter={v => `$${(v as number).toLocaleString()}`} contentStyle={{ fontSize: '14px', borderRadius: 8 }} />
              <ReferenceLine x={base} stroke={BASE_COLOR} strokeDasharray="4 4" label={{ value: 'Base', position: 'top', fill: BASE_COLOR, fontWeight: 700, fontSize: 14 }} />
              <Bar dataKey="Low" fill={LOW_COLOR} radius={[8, 8, 8, 8]} barSize={40}>
                <LabelList dataKey="Low" position="left" formatter={v => `$${v.toLocaleString()}`} className="text-xs font-semibold" />
              </Bar>
              <Bar dataKey="High" fill={HIGH_COLOR} radius={[8, 8, 8, 8]} barSize={40}>
                <LabelList dataKey="High" position="right" formatter={v => `$${v.toLocaleString()}`} className="text-xs font-semibold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Custom Legend */}
          <div className="text-xs text-muted-foreground mt-4 flex flex-wrap gap-4 items-center border-t pt-3">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background:LOW_COLOR}}></span>Low</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background:HIGH_COLOR}}></span>High</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded-full" style={{background:BASE_COLOR, width:16}}></span>Base DCF</span>
            <span className="ml-auto">Bar: DCF Value when input is flexed low/high</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
