import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function getColor(value: number, min: number, max: number) {
  // Modern color scale: yellow (low) to blue (high)
  if (max === min) return '#facc15'; // yellow
  const percent = (value - min) / (max - min);
  // Interpolate from yellow (#facc15) to blue (#2563eb)
  const r = Math.round(250 + (37 - 250) * percent);
  const g = Math.round(204 + (99 - 204) * percent);
  const b = Math.round(21 + (235 - 21) * percent);
  return `rgb(${r},${g},${b})`;
}

export default function SensitivityHeatmap({ data }: { data: any }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card className="w-full h-56 flex items-center justify-center bg-muted border border-dashed border-border text-muted-foreground">
        <CardContent>No sensitivity data</CardContent>
      </Card>
    );
  }
  // Extract axis values
  const waccs = data.map((row: any) => row.wacc);
  const growths = data[0].values.map((v: any) => v.growth);
  // Flatten all DCF values for color scale
  const allDcfs = data.flatMap((row: any) => row.values.map((v: any) => v.dcf));
  const minDcf = Math.min(...allDcfs);
  const maxDcf = Math.max(...allDcfs);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Sensitivity Analysis Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="border-separate w-full text-sm" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="p-3 bg-background border-b border-r text-center align-middle"></th>
                {growths.map((g: number) => (
                  <th key={g} className="p-4 bg-background font-bold text-foreground border-b border-r text-center align-middle">{(g * 100).toFixed(1)}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, rowIdx: number) => (
                <tr key={row.wacc} className="text-center align-middle">
                  <td className="p-4 bg-background font-bold text-foreground border-r border-b text-center align-middle w-32 h-16">{(row.wacc * 100).toFixed(1)}%</td>
                  {row.values.map((cell: any, idx: number) => (
                    <td
                      key={idx}
                      className="border-b border-r text-center align-middle font-bold text-lg w-32 h-16 transition duration-150 hover:ring-2 hover:ring-primary cursor-pointer shadow-sm"
                      style={{ background: getColor(cell.dcf, minDcf, maxDcf), color: '#fff', letterSpacing: 0.5 }}
                      title={`DCF: $${cell.dcf.toLocaleString(undefined, {maximumFractionDigits:0})}`}
                    >
                      {`$${cell.dcf.toLocaleString(undefined, {maximumFractionDigits:0})}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-4 flex flex-wrap gap-4 items-center border-t pt-3">
            <span><span className="font-semibold">X:</span> <span className="text-foreground">Terminal Growth Rate</span></span>
            <span><span className="font-semibold">Y:</span> <span className="text-foreground">WACC</span></span>
            <span><span className="font-semibold">Cell:</span> <span className="text-foreground">DCF Value</span></span>
            <span className="ml-auto"><span className="inline-block w-4 h-4 rounded-full mr-1" style={{background:'#facc15'}}></span>Low &rarr; <span className="inline-block w-4 h-4 rounded-full mx-1" style={{background:'#2563eb'}}></span>High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
