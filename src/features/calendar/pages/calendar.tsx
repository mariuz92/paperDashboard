import React, { useState, useEffect } from "react";
import { Calendar, Badge, Spin, message, Button } from "antd";
import itIT from "antd/es/date-picker/locale/it_IT";
import type { CalendarProps } from "antd";
import { useNavigate } from "react-router-dom";
import { Dayjs } from "dayjs";

// Import aggregator interfaces + function from the new orderApi
import {
  fetchOrderCounts,
  IDailyCount,
  IMonthlyCount,
} from "../../orders/api/orderApi";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

/**
 * Page showing a calendar with daily consegna & ritiro counts + monthly totals.
 */
export const CalendarPage: React.FC = () => {
  const [dailyCounts, setDailyCounts] = useState<IDailyCount[]>([]);
  const [monthlyCounts, setMonthlyCounts] = useState<IMonthlyCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useDocumentTitle(`Calendario | ${CONFIG.appName}`);
  const navigate = useNavigate();

  /**
   * Fetch daily and monthly order counts on mount.
   */
  const loadOrderCounts = async () => {
    setLoading(true);
    try {
      const { dailyCounts, monthlyCounts } = await fetchOrderCounts();
      setDailyCounts(dailyCounts);
      setMonthlyCounts(monthlyCounts);
    } catch (error) {
      message.error("Errore nel caricare gli ordini.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderCounts();
  }, []);

  /**
   * Find IDailyCount for the given date (YYYY-MM-DD).
   */
  const getDailyData = (value: Dayjs): IDailyCount | undefined => {
    const dateStr = value.format("YYYY-MM-DD");
    return dailyCounts.find((d) => d.date === dateStr);
  };

  /**
   * Find IMonthlyCount for the given month (YYYY-MM).
   */
  const getMonthlyData = (value: Dayjs): IMonthlyCount | undefined => {
    const monthStr = value.format("YYYY-MM");
    return monthlyCounts.find((m) => m.month === monthStr);
  };

  /**
   * dateCellRender: Show deliveries (consegne) & pickups (ritiri).
   */
  const dateCellRender = (value: Dayjs) => {
    const dailyData = getDailyData(value);
    if (!dailyData) return null; // No data for this day => nothing to show

    const { consegne, ritiri } = dailyData;
    const navigate = useNavigate();

    return (
      <div
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {consegne > 0 && (
          <Button
            type='primary'
            size='small'
            style={{ width: "100%" }}
            onClick={() => navigate(`/?date=${value.format("YYYY-MM-DD")}`)}
          >
            {consegne} Consegne
          </Button>
        )}
        {ritiri > 0 && (
          <Button
            type='default'
            size='small'
            style={{ width: "100%" }}
            onClick={() => navigate(`/?date=${value.format("YYYY-MM-DD")}`)}
          >
            {ritiri} Ritiri
          </Button>
        )}
      </div>
    );
  };

  /**
   * monthCellRender: Show monthly total (deliveries + pickups).
   */
  const monthCellRender = (value: Dayjs) => {
    const monthData = getMonthlyData(value);
    if (!monthData) return null;

    return (
      <div style={{ textAlign: "center", padding: "5px" }}>
        <Button
          type='primary'
          size='small'
          style={{ width: "100%" }}
          onClick={() => navigate(`/?month=${value.format("YYYY-MM")}`)}
        >
          {monthData.total} Totali
        </Button>
      </div>
    );
  };
  /**
   * cellRender: unify date vs. month rendering for the AntD Calendar
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
