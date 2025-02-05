// SaldoLineChart.tsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

export interface SaldoLineChartProps {
  data: Array<{ date: string; saldo: number }>;
}

const SaldoLineChart: React.FC<SaldoLineChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='date' />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type='monotone' dataKey='saldo' stroke='#1890ff' />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SaldoLineChart;
