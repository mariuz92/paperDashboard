// OrderStatusPieChart.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface OrderStatusPieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS: Record<string, string> = {
  "Presa in Carico": "#faad14",
  "In Consegna": "#1890ff",
  Consegnato: "#52c41a",
  "Attesa ritiro": "#ff7a45",
  "In Ritiro": "#722ed1",
  Ritirato: "#13c2c2",
  Annullato: "#cf1322",
};

const OrderStatusPieChart: React.FC<OrderStatusPieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Nessun dato disponibile
      </div>
    );
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill='#8884d8'
          dataKey='value'
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.name] || "#8884d8"}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default OrderStatusPieChart;
