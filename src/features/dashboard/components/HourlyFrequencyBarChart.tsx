// HourlyFrequencyBarChart.tsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

export interface HourlyFrequencyBarChartProps {
  data: Array<{ label: string; consegne: number; ritiri: number }>;
}

const HourlyFrequencyBarChart: React.FC<HourlyFrequencyBarChartProps> = ({
  data,
}) => {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='label' />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey='consegne' stackId='a' fill='#1890ff' />
        <Bar dataKey='ritiri' stackId='a' fill='#ff4d4f' />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default HourlyFrequencyBarChart;
