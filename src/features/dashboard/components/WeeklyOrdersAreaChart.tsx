// WeeklyOrdersAreaChart.tsx
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Legend,
} from "recharts";

export interface WeeklyOrdersAreaChartProps {
  data: Array<{ label: string; count: number }>;
}

const WeeklyOrdersAreaChart: React.FC<WeeklyOrdersAreaChartProps> = ({
  data,
}) => {
  return (
    <ResponsiveContainer>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id='colorOrders' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#1890ff' stopOpacity={0.8} />
            <stop offset='95%' stopColor='#1890ff' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='label' />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type='monotone'
          dataKey='count'
          stroke='#1890ff'
          fillOpacity={1}
          fill='url(#colorOrders)'
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default WeeklyOrdersAreaChart;
