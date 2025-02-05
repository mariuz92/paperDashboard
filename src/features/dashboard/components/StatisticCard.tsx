// StatisticCard.tsx
import React from "react";
import { Card, Statistic } from "antd";

export interface StatisticCardProps {
  title: string;
  value: number;
  loading: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  valueStyle?: React.CSSProperties;
  precision?: number;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  loading,
  prefix,
  suffix,
  valueStyle,
  precision,
}) => {
  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle}
        precision={precision}
      />
    </Card>
  );
};

export default StatisticCard;
