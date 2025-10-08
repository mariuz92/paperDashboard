import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Spin,
  message,
  Button,
  Modal,
  Descriptions,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  DownloadOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import itIT from "antd/es/date-picker/locale/it_IT";
import type { CalendarProps } from "antd";
import { useNavigate } from "react-router-dom";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

import { getOrders } from "../../orders/api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

interface IDailyCount {
  date: string;
  consegne: number;
  ritiri: number;
  revenue: number;
  radios: number;
  orders: IOrder[];
}

interface IMonthlyCount {
  month: string;
  total: number;
  revenue: number;
}

/**
 * Enhanced Calendar Page with optimized loading and additional features
 */
export const CalendarPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  useDocumentTitle(`Calendario | ${CONFIG.appName}`);
  const navigate = useNavigate();

  /**
   * Load orders for a specific date range (3 months window for performance)
   */
  const loadOrders = async (centerMonth: Dayjs) => {
    setLoading(true);
    try {
      const startDate = Timestamp.fromDate(
        centerMonth.subtract(1, "month").startOf("month").toDate()
      );
      const endDate = Timestamp.fromDate(
        centerMonth.add(1, "month").endOf("month").toDate()
      );

      const { data } = await getOrders({
        page: 1,
        pageSize: 10000,
        startDate,
        endDate,
      });

      setOrders(data);
    } catch (error) {
      message.error("Errore nel caricare gli ordini.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(currentMonth);
  }, [currentMonth]);

  /**
   * Compute daily counts from orders (memoized for performance)
   */
  const dailyCounts = useMemo<Record<string, IDailyCount>>(() => {
    const counts: Record<string, IDailyCount> = {};

    orders.forEach((order) => {
      // Process delivery date
      if (order.oraConsegna) {
        const date = dayjs(
          order.oraConsegna instanceof Timestamp
            ? order.oraConsegna.toDate()
            : order.oraConsegna
        ).format("YYYY-MM-DD");

        if (!counts[date]) {
          counts[date] = {
            date,
            consegne: 0,
            ritiri: 0,
            revenue: 0,
            radios: 0,
            orders: [],
          };
        }
        counts[date].consegne += 1;
        counts[date].revenue += order.saldo || 0;
        counts[date].radios += order.radioguideConsegnate || 0;
        counts[date].orders.push(order);
      }

      // Process pickup date
      if (order.oraRitiro) {
        const date = dayjs(
          order.oraRitiro instanceof Timestamp
            ? order.oraRitiro.toDate()
            : order.oraRitiro
        ).format("YYYY-MM-DD");

        if (!counts[date]) {
          counts[date] = {
            date,
            consegne: 0,
            ritiri: 0,
            revenue: 0,
            radios: 0,
            orders: [],
          };
        }
        counts[date].ritiri += 1;
      }
    });

    return counts;
  }, [orders]);

  /**
   * Compute monthly counts (memoized for performance)
   */
  const monthlyCounts = useMemo<Record<string, IMonthlyCount>>(() => {
    const counts: Record<string, IMonthlyCount> = {};

    orders.forEach((order) => {
      if (order.oraConsegna) {
        const month = dayjs(
          order.oraConsegna instanceof Timestamp
            ? order.oraConsegna.toDate()
            : order.oraConsegna
        ).format("YYYY-MM");

        if (!counts[month]) {
          counts[month] = { month, total: 0, revenue: 0 };
        }
        counts[month].total += 1;
        counts[month].revenue += order.saldo || 0;
      }

      if (order.oraRitiro) {
        const month = dayjs(
          order.oraRitiro instanceof Timestamp
            ? order.oraRitiro.toDate()
            : order.oraRitiro
        ).format("YYYY-MM");

        if (!counts[month]) {
          counts[month] = { month, total: 0, revenue: 0 };
        }
        counts[month].total += 1;
      }
    });

    return counts;
  }, [orders]);

  /**
   * Handle date click - show modal with details
   */
  const handleDateClick = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dailyData = dailyCounts[dateStr];

    if (dailyData && (dailyData.consegne > 0 || dailyData.ritiri > 0)) {
      setSelectedDate(value);
      setModalVisible(true);
    }
  };

  /**
   * Export calendar data to CSV
   */
  const exportToCSV = () => {
    const csvRows = [
      ["Data", "Consegne", "Ritiri", "Entrate (€)", "Radioline Consegnate"],
    ];

    Object.values(dailyCounts)
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((day) => {
        csvRows.push([
          day.date,
          day.consegne.toString(),
          day.ritiri.toString(),
          day.revenue.toFixed(2),
          day.radios.toString(),
        ]);
      });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `calendario_ordini_${currentMonth.format("YYYY-MM")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Calendario esportato con successo!");
  };

  /**
   * Render day cell with deliveries and pickups
   */
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dailyData = dailyCounts[dateStr];

    if (!dailyData) return null;

    const { consegne, ritiri } = dailyData;

    return (
      <div
        style={{
          padding: "2px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          cursor: "pointer",
        }}
        onClick={() => handleDateClick(value)}
      >
        {consegne > 0 && (
          <Tag color='blue' style={{ margin: 0, fontSize: "11px" }}>
            {consegne} Consegne
          </Tag>
        )}
        {ritiri > 0 && (
          <Tag color='green' style={{ margin: 0, fontSize: "11px" }}>
            {ritiri} Ritiri
          </Tag>
        )}
      </div>
    );
  };

  /**
   * Render month cell with total
   */
  const monthCellRender = (value: Dayjs) => {
    const monthStr = value.format("YYYY-MM");
    const monthData = monthlyCounts[monthStr];

    if (!monthData) return null;

    return (
      <div
        style={{
          textAlign: "center",
          padding: "5px",
          cursor: "pointer",
        }}
        onClick={() => navigate(`/?month=${monthStr}`)}
      >
        <Tag color='purple'>{monthData.total} Ordini</Tag>
        <div style={{ fontSize: "12px", color: "#666" }}>
          €{monthData.revenue.toFixed(2)}
        </div>
      </div>
    );
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    if (info.type === "month") return monthCellRender(current);
    return info.originNode;
  };

  /**
   * Get selected date details for modal
   */
  const selectedDayData = selectedDate
    ? dailyCounts[selectedDate.format("YYYY-MM-DD")]
    : null;

  return (
    <div style={{ padding: "20px" }}>
      <Spin spinning={loading}>
        {/* Header with actions */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <Space>
            <Tooltip title='Ricarica dati'>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadOrders(currentMonth)}
              >
                Ricarica
              </Button>
            </Tooltip>
            <Tooltip title='Esporta calendario in CSV'>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToCSV}
                type='primary'
              >
                Esporta CSV
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* Calendar */}
        <Calendar
          locale={itIT}
          cellRender={cellRender}
          fullscreen
          onPanelChange={(date) => setCurrentMonth(date)}
          style={{ background: "#fff", borderRadius: "8px" }}
        />

        {/* Day Details Modal */}
        <Modal
          title={`Dettagli ${selectedDate?.format("DD MMMM YYYY")}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key='close' onClick={() => setModalVisible(false)}>
              Chiudi
            </Button>,
            <Button
              key='view'
              type='primary'
              onClick={() => {
                if (selectedDate) {
                  navigate(`/?date=${selectedDate.format("YYYY-MM-DD")}`);
                }
              }}
            >
              Vedi Ordini
            </Button>,
          ]}
          width={600}
        >
          {selectedDayData && (
            <Descriptions bordered column={1} size='small'>
              <Descriptions.Item label='Consegne'>
                <strong>{selectedDayData.consegne}</strong>
              </Descriptions.Item>
              <Descriptions.Item label='Ritiri'>
                <strong>{selectedDayData.ritiri}</strong>
              </Descriptions.Item>
              <Descriptions.Item label='Radioline Consegnate'>
                <strong>{selectedDayData.radios}</strong>
              </Descriptions.Item>
              <Descriptions.Item label='Entrate Totali'>
                <strong style={{ color: "#52c41a" }}>
                  €{selectedDayData.revenue.toFixed(2)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label='Valore Medio Ordine'>
                €
                {selectedDayData.consegne > 0
                  ? (
                      selectedDayData.revenue / selectedDayData.consegne
                    ).toFixed(2)
                  : "0.00"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Spin>
    </div>
  );
};

export default CalendarPage;
