// ChartCard.tsx
import React from "react";
import { Card } from "antd";

export interface ChartCardProps {
  title: string;
  loading: boolean;
  height?: number;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  loading,
  height = 300,
  children,
}) => {
  return (
    <Card title={title} loading={loading}>
      <div style={{ width: "100%", height }}>{children}</div>
    </Card>
  );
};

export default ChartCard;
