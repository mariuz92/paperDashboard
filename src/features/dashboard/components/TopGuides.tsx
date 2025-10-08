// TopGuidesTable.tsx
import React from "react";
import { Table } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

interface TopGuidesTableProps {
  data: Array<{ name: string; orders: number; revenue: number }>;
}

const TopGuidesTable: React.FC<TopGuidesTableProps> = ({ data }) => {
  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      key: "rank",
      width: 50,
      render: (text: number) => {
        if (text === 1)
          return (
            <TrophyOutlined style={{ color: "#FFD700", fontSize: "18px" }} />
          );
        if (text === 2)
          return (
            <TrophyOutlined style={{ color: "#C0C0C0", fontSize: "18px" }} />
          );
        if (text === 3)
          return (
            <TrophyOutlined style={{ color: "#CD7F32", fontSize: "18px" }} />
          );
        return text;
      },
    },
    {
      title: "Guida",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Ordini",
      dataIndex: "orders",
      key: "orders",
      sorter: (a: any, b: any) => a.orders - b.orders,
      render: (orders: number) => <strong>{orders}</strong>,
    },
    {
      title: "Entrate",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a: any, b: any) => a.revenue - b.revenue,
      render: (revenue: number) => `€${revenue.toFixed(2)}`,
    },
  ];

  const dataWithRank = data.map((item, index) => ({
    ...item,
    rank: index + 1,
    key: index,
  }));

  return (
    <Table
      columns={columns}
      dataSource={dataWithRank}
      pagination={false}
      size='small'
      scroll={{ y: 300 }}
    />
  );
};

export default TopGuidesTable;
