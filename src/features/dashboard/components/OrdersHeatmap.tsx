// OrdersHeatmap.tsx (Without ResponsiveContainer)
import React from "react";

export interface OrdersHeatmapData {
  day: string;
  hour: number;
  delivered: number;
  retrieved: number;
}

export interface OrdersHeatmapProps {
  data: OrdersHeatmapData[];
}

const OrdersHeatmap: React.FC<OrdersHeatmapProps> = ({ data }) => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const frequencyMap: Record<string, number> = {};
  data.forEach((item) => {
    const key = `${item.day}-${item.hour}`;
    const count = (item.delivered || 0) + (item.retrieved || 0);
    frequencyMap[key] = (frequencyMap[key] || 0) + count;
  });

  const maxFrequency = Math.max(...Object.values(frequencyMap), 0);

  const getColor = (value: number, max: number): string => {
    if (max === 0) return "#ffffff";
    const ratio = value / max;
    const intensity = Math.floor(255 - ratio * 255);
    return `rgb(255, ${intensity}, ${intensity})`;
  };

  const width = 700; // fixed width
  const height = 400; // fixed height
  const cellWidth = width / days.length;
  const cellHeight = height / 24;

  return (
    <svg width={width} height={height}>
      {days.map((day, dayIndex) =>
        Array.from({ length: 24 }, (_, hour) => {
          const key = `${day}-${hour}`;
          const value = frequencyMap[key] || 0;
          const fillColor = getColor(value, maxFrequency);
          return (
            <rect
              key={key}
              x={dayIndex * cellWidth}
              y={hour * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill={fillColor}
              stroke='#ccc'
            >
              <title>{`${day} ${hour}:00 - ${value} orders`}</title>
            </rect>
          );
        })
      )}
      {days.map((day, dayIndex) => (
        <text
          key={`label-${day}`}
          x={dayIndex * cellWidth + cellWidth / 2}
          y={15}
          textAnchor='middle'
          fontSize='12'
          fill='#000'
        >
          {day}
        </text>
      ))}
      {Array.from({ length: 24 }, (_, hour) => (
        <text
          key={`hour-${hour}`}
          x={2}
          y={hour * cellHeight + cellHeight / 2 + 4}
          fontSize='10'
          fill='#000'
        >
          {hour}
        </text>
      ))}
    </svg>
  );
};

export default OrdersHeatmap;
