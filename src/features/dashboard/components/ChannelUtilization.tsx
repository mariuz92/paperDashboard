// ChannelUtilizationChart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChannelUtilizationChartProps {
  data: Array<{ channel: string; count: number }>;
}

const ChannelUtilizationChart: React.FC<ChannelUtilizationChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Nessun dato disponibile
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='channel'
          label={{
            value: "Canale Radio",
            position: "insideBottom",
            offset: -5,
          }}
        />
        <YAxis
          label={{ value: "Numero Ordini", angle: -90, position: "insideLeft" }}
        />
        <Tooltip />
        <Bar dataKey='count' fill='#1890ff'>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count === maxCount ? "#52c41a" : "#1890ff"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ChannelUtilizationChart; // ChannelUtilizationChart.tsx
