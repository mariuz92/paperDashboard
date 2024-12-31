import React, { useState, useEffect } from "react";
import { Calendar, Badge, Spin, message, Button } from "antd";
import itIT from "antd/es/date-picker/locale/it_IT";
import type { CalendarProps } from "antd";
import { useNavigate } from "react-router-dom";
import { Dayjs } from "dayjs";
import {
  fetchOrderCounts,
  OrderCount,
  MonthlyOrderCount,
} from "../api/orderApi";

export const CalendarPage: React.FC = () => {
  const [dailyCounts, setDailyCounts] = useState<OrderCount[]>([]);
  const [monthlyCounts, setMonthlyCounts] = useState<MonthlyOrderCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<"date" | "month" | "year">("date"); // Track mode
  const navigate = useNavigate();

  /**
   * Fetch daily and monthly order counts.
   */
  const loadOrderCounts = async () => {
    setLoading(true);
    try {
      const { dailyCounts, monthlyCounts } = await fetchOrderCounts();
      setDailyCounts(dailyCounts);
      setMonthlyCounts(monthlyCounts);
    } catch (error) {
      message.error("Failed to load order data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderCounts();
  }, []);

  /**
   * Prepare data for specific dates.
   */
  const getListData = (value: Dayjs) => {
    const dateString = value.format("YYYY-MM-DD");
    const orderData = dailyCounts.find((order) => order.date === dateString);

    if (orderData) {
      let orderName = orderData.count > 1 ? "ordini" : "ordine";
      return [{ type: "success", content: `${orderData.count} ${orderName}` }];
    }
    return [];
  };

  /**
   * Prepare data for specific months.
   */
  const getMonthData = (value: Dayjs) => {
    const monthString = value.format("YYYY-MM");
    const monthData = monthlyCounts.find(
      (order) => order.month === monthString
    );

    return monthData ? monthData.count : null;
  };

  /**
   * Render daily badges in the calendar.
   */
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <div style={{ padding: "5px" }}>
        {listData.map((item) => (
          <Button
            size='middle'
            key={item.content}
            type='primary'
            onClick={() => navigate(`/?date=${value.format("YYYY-MM-DD")}`)}
            style={{ width: "100%" }}
          >
            {item.content}
          </Button>
        ))}
      </div>
    );
  };

  /**
   * Render monthly data in the calendar.
   */
  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);

    return num ? (
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          textAlign: "center",
        }}
      >
        <li>
          <Badge
            status='processing' // Use a visually appealing badge status
            text={`${num} orders`}
          />
        </li>
      </ul>
    ) : null;
  };
  /**
   * Unified cell rendering logic.
   */
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    if (info.type === "month") return monthCellRender(current);
    return info.originNode;
  };

  return (
    <Spin spinning={loading}>
      <Calendar
        locale={itIT}
        cellRender={cellRender}
        fullscreen
        style={{ padding: "20px", background: "#fff" }}
      />
    </Spin>
  );
};
