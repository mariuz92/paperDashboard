// DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Layout, Typography, Row, Col, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getOrders } from "../../orders/api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import MonthPicker from "../components/MonthPicker";
import StatisticCard from "../components/StatisticCard";
import ChartCard from "../components/ChartCard";
import SaldoLineChart from "../components/SaldoLineChart";
import WeeklyOrdersAreaChart from "../components/WeeklyOrdersAreaChart";
import HourlyFrequencyBarChart from "../components/HourlyFrequencyBarChart";
import OrdersHeatmap from "../components/OrdersHeatmap";
import { buildHeatmapData } from "../../../shared/utils/buildHeatmapData";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title } = Typography;
const { Content } = Layout;

export const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  // Statistics state
  const [currentMonthCount, setCurrentMonthCount] = useState<number>(0);
  const [lastMonthCount, setLastMonthCount] = useState<number>(0);
  const [variationPercent, setVariationPercent] = useState<number>(0);
  const [totalRadiosDelivered, setTotalRadiosDelivered] = useState<number>(0);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalMoneyReceived, setTotalMoneyReceived] = useState<number>(0);
  const [previousMonthMoneyReceived, setPreviousMonthMoneyReceived] =
    useState<number>(0);
  const [revenueDifference, setRevenueDifference] = useState<number>(0);
  const [saldoChartData, setSaldoChartData] = useState<any[]>([]);

  useDocumentTitle(`Dashboard | ${CONFIG.appName}`);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    computeStats();
  }, [selectedMonth, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getOrders({ page: 1, pageSize: 1000 });
      setOrders(data);
    } catch (error) {
      message.error("Errore durante il caricamento degli ordini.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = () => {
    const thisMonthStart = selectedMonth.startOf("month");
    const thisMonthEnd = selectedMonth.endOf("month");

    const lastMonthDate = selectedMonth.subtract(1, "month");
    const lastMonthStart = lastMonthDate.startOf("month");
    const lastMonthEnd = lastMonthDate.endOf("month");

    const thisMonthOrders = orders.filter((o) =>
      inRange(o, thisMonthStart, thisMonthEnd)
    );
    const lastMonthOrders = orders.filter((o) =>
      inRange(o, lastMonthStart, lastMonthEnd)
    );

    const currentCount = thisMonthOrders.length;
    const previousCount = lastMonthOrders.length;
    const diff =
      previousCount === 0
        ? 100
        : ((currentCount - previousCount) / previousCount) * 100;
    setCurrentMonthCount(currentCount);
    setLastMonthCount(previousCount);
    setVariationPercent(diff);

    const totalRadios = thisMonthOrders.reduce(
      (sum, order) => sum + (order.radiolineConsegnate || 0),
      0
    );
    setTotalRadiosDelivered(totalRadios);

    const totalMoney = thisMonthOrders.reduce(
      (sum, order) => sum + (order.saldo || 0),
      0
    );
    setTotalMoneyReceived(totalMoney);

    const lastMonthMoney = lastMonthOrders.reduce(
      (sum, order) => sum + (order.saldo || 0),
      0
    );
    setPreviousMonthMoneyReceived(lastMonthMoney);

    const moneyDiff =
      lastMonthMoney === 0
        ? 100
        : ((totalMoney - lastMonthMoney) / lastMonthMoney) * 100;
    setRevenueDifference(moneyDiff);

    const saldoData = thisMonthOrders.map((order) => ({
      date: dayjs(order.orarioConsegna.toDate()).format("YYYY-MM-DD"),
      saldo: order.saldo || 0,
    }));
    setSaldoChartData(saldoData);

    const frequencyData = buildOrderFrequencyData(thisMonthOrders);
    setHourlyData(frequencyData);

    const weeklyData = buildChartDataByWeek(thisMonthOrders, selectedMonth);
    setChartData(weeklyData);
  };

  function inRange(o: IOrder, start: dayjs.Dayjs, end: dayjs.Dayjs) {
    if (!o.orarioConsegna) return false;
    const orderDate = o.orarioConsegna.toDate
      ? dayjs(o.orarioConsegna.toDate())
      : dayjs(o.orarioConsegna);
    return orderDate.isSameOrAfter(start) && orderDate.isSameOrBefore(end);
  }

  function buildChartDataByWeek(
    ordersList: IOrder[],
    selectedMonth: dayjs.Dayjs
  ) {
    const start = selectedMonth.startOf("month");
    const end = selectedMonth.endOf("month");
    const filtered = ordersList.filter((o) => inRange(o, start, end));
    const weekCounts: Record<string, number> = {};
    filtered.forEach((o) => {
      const d = o.orarioConsegna.toDate
        ? dayjs(o.orarioConsegna.toDate())
        : dayjs(o.orarioConsegna);
      const dayOfMonth = d.date();
      const weekIndex = Math.ceil(
        (dayOfMonth / selectedMonth.daysInMonth()) * 4
      );
      const key = `Settimana ${weekIndex}`;
      weekCounts[key] = (weekCounts[key] || 0) + 1;
    });
    const data = Object.entries(weekCounts).map(([k, c]) => ({
      label: k,
      count: c,
    }));
    data.sort((a, b) => {
      const wA = parseInt(a.label.split(" ")[1], 10);
      const wB = parseInt(b.label.split(" ")[1], 10);
      return wA - wB;
    });
    return data;
  }

  function buildOrderFrequencyData(ordersList: IOrder[]) {
    const frequencyCounts: Record<
      string,
      { consegne: number; ritiri: number }
    > = {};
    ordersList.forEach((o) => {
      const date = dayjs(o.orarioConsegna.toDate()).format("YYYY-MM-DD");
      if (!frequencyCounts[date]) {
        frequencyCounts[date] = { consegne: 0, ritiri: 0 };
      }
      frequencyCounts[date].consegne += 1;
      if (o.oraRitiro) {
        const rDate = dayjs(o.oraRitiro.toDate()).format("YYYY-MM-DD");
        if (!frequencyCounts[rDate]) {
          frequencyCounts[rDate] = { consegne: 0, ritiri: 0 };
        }
        frequencyCounts[rDate].ritiri += 1;
      }
    });
    return Object.entries(frequencyCounts).map(([date, counts]) => ({
      label: date,
      ...counts,
    }));
  }

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Content>
        <Title level={2} style={{ marginBottom: "20px" }}>
          Dashboard
        </Title>

        {/* Month Picker */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </Col>
        </Row>

        {/* Revenue Statistics */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Entrate</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title={`Entrate (${selectedMonth.format("MMMM YYYY")})`}
              value={totalMoneyReceived}
              loading={loading}
              prefix='€'
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Differenza Mese Precedente'
              value={revenueDifference}
              loading={loading}
              suffix='%'
              precision={2}
              valueStyle={{
                color: revenueDifference >= 0 ? "#3f8600" : "#cf1322",
                fontSize: "1.5rem",
              }}
            />
          </Col>
        </Row>

        {/* Saldo Radioline Chart */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <ChartCard title='Andamento Entrate' loading={loading} height={300}>
              <SaldoLineChart data={saldoChartData} />
            </ChartCard>
          </Col>
        </Row>

        {/* Order Count Statistics */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Radioline Consegnate</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title={`${selectedMonth.format("MMMM YYYY")}`}
              value={currentMonthCount}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title={`${selectedMonth
                .clone()
                .subtract(1, "month")
                .format("MMMM YYYY")}`}
              value={lastMonthCount}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Variazione M/M'
              value={variationPercent}
              loading={loading}
              suffix='%'
              precision={2}
              valueStyle={{
                color: variationPercent >= 0 ? "#3f8600" : "#cf1322",
                fontSize: "1.5rem",
              }}
            />
          </Col>
        </Row>

        {/* Weekly Orders Chart */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <ChartCard
              title={`Ordini di ${selectedMonth.format(
                "MMMM YYYY"
              )} (per Settimana)`}
              loading={loading}
              height={300}
            >
              <WeeklyOrdersAreaChart data={chartData} />
            </ChartCard>
          </Col>
        </Row>

        {/* Delivery Frequency Statistics */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Frequenza Consegne e Ritiri per Ora</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Radioline Consegnate'
              value={totalRadiosDelivered}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
        </Row>

        {/* Hourly Frequency Bar Chart */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <ChartCard
              title='Frequenza Ordini per Ora'
              loading={loading}
              height={400}
            >
              <HourlyFrequencyBarChart data={hourlyData} />
            </ChartCard>
          </Col>
        </Row>

        {/* <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <h2>Orders Heatmap</h2>
            <OrdersHeatmap data={buildHeatmapData(orders)} />
          </Col>
        </Row> */}
      </Content>
    </Layout>
  );
};

export default DashboardPage;
