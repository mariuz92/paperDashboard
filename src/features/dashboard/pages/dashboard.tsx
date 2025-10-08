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

import { Timestamp } from "firebase/firestore";
import OrderStatusPieChart from "../components/OrderStatusPieChart";
import TopGuidesTable from "../components/TopGuides";
import ChannelUtilizationChart from "../components/ChannelUtilization";

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
  const [totalExtras, setTotalExtras] = useState<number>(0);
  const [totalLost, setTotalLost] = useState<number>(0);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalMoneyReceived, setTotalMoneyReceived] = useState<number>(0);
  const [previousMonthMoneyReceived, setPreviousMonthMoneyReceived] =
    useState<number>(0);
  const [revenueDifference, setRevenueDifference] = useState<number>(0);
  const [saldoChartData, setSaldoChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topGuides, setTopGuides] = useState<any[]>([]);
  const [topDeliveryLocations, setTopDeliveryLocations] = useState<any[]>([]);
  const [topPickupLocations, setTopPickupLocations] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);

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
      const { data } = await getOrders({ page: 1, pageSize: 10000 });
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

    // Order count statistics
    const currentCount = thisMonthOrders.length;
    const previousCount = lastMonthOrders.length;
    const diff =
      previousCount === 0
        ? 100
        : ((currentCount - previousCount) / previousCount) * 100;
    setCurrentMonthCount(currentCount);
    setLastMonthCount(previousCount);
    setVariationPercent(diff);

    // Radio statistics
    const totalRadios = thisMonthOrders.reduce(
      (sum, order) => sum + (order.radioguideConsegnate || 0),
      0
    );
    setTotalRadiosDelivered(totalRadios);

    const extras = thisMonthOrders.reduce(
      (sum, order) => sum + (order.extra || 0),
      0
    );
    setTotalExtras(extras);

    const lost = thisMonthOrders.reduce(
      (sum, order) => sum + (order.lost || 0),
      0
    );
    setTotalLost(lost);

    // Revenue statistics
    const totalMoney = thisMonthOrders.reduce(
      (sum, order) => sum + (order.saldo || 0),
      0
    );
    setTotalMoneyReceived(totalMoney);

    const avgValue = currentCount > 0 ? totalMoney / currentCount : 0;
    setAverageOrderValue(avgValue);

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

    // Saldo chart data
    const saldoData = thisMonthOrders
      .filter((order) => order.oraConsegna)
      .map((order) => ({
        date: dayjs(
          order.oraConsegna instanceof Timestamp
            ? order.oraConsegna.toDate()
            : order.oraConsegna
        ).format("YYYY-MM-DD"),
        saldo: order.saldo || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setSaldoChartData(saldoData);

    // Status distribution
    const statusCounts: Record<string, number> = {};
    thisMonthOrders.forEach((o) => {
      const status = o.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const statusChartData = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
    setStatusData(statusChartData);

    // Top guides by orders
    const guideCounts: Record<string, { count: number; revenue: number }> = {};
    thisMonthOrders.forEach((o) => {
      if (o.nomeGuida) {
        if (!guideCounts[o.nomeGuida]) {
          guideCounts[o.nomeGuida] = { count: 0, revenue: 0 };
        }
        guideCounts[o.nomeGuida].count += 1;
        guideCounts[o.nomeGuida].revenue += o.saldo || 0;
      }
    });
    const topGuidesData = Object.entries(guideCounts)
      .map(([name, data]) => ({
        name,
        orders: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
    setTopGuides(topGuidesData);

    // Top delivery locations
    const deliveryLocationCounts: Record<string, number> = {};
    thisMonthOrders.forEach((o) => {
      if (o.luogoConsegna) {
        deliveryLocationCounts[o.luogoConsegna] =
          (deliveryLocationCounts[o.luogoConsegna] || 0) + 1;
      }
    });
    const topDeliveryData = Object.entries(deliveryLocationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopDeliveryLocations(topDeliveryData);

    // Top pickup locations
    const pickupLocationCounts: Record<string, number> = {};
    thisMonthOrders.forEach((o) => {
      if (o.luogoRitiro) {
        pickupLocationCounts[o.luogoRitiro] =
          (pickupLocationCounts[o.luogoRitiro] || 0) + 1;
      }
    });
    const topPickupData = Object.entries(pickupLocationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopPickupLocations(topPickupData);

    // Channel utilization
    const channelCounts: Record<string, number> = {};
    thisMonthOrders.forEach((o) => {
      if (o.canaleRadio) {
        channelCounts[o.canaleRadio] = (channelCounts[o.canaleRadio] || 0) + 1;
      }
    });
    const channelChartData = Object.entries(channelCounts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => parseInt(a.channel) - parseInt(b.channel));
    setChannelData(channelChartData);

    // Hourly frequency
    const frequencyData = buildOrderFrequencyData(thisMonthOrders);
    setHourlyData(frequencyData);

    // Weekly data
    const weeklyData = buildChartDataByWeek(thisMonthOrders, selectedMonth);
    setChartData(weeklyData);
  };

  function inRange(o: IOrder, start: dayjs.Dayjs, end: dayjs.Dayjs) {
    if (!o.oraConsegna) return false;

    const orderDate =
      o.oraConsegna instanceof Timestamp
        ? dayjs(o.oraConsegna.toDate())
        : dayjs(o.oraConsegna);

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
      if (!o.oraConsegna) return;

      const consegnaDate =
        o.oraConsegna instanceof Timestamp
          ? o.oraConsegna.toDate()
          : o.oraConsegna;
      const d = dayjs(consegnaDate);

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
      if (o.oraConsegna) {
        const date = dayjs(
          o.oraConsegna instanceof Timestamp
            ? o.oraConsegna.toDate()
            : o.oraConsegna
        ).format("YYYY-MM-DD");
        if (!frequencyCounts[date]) {
          frequencyCounts[date] = { consegne: 0, ritiri: 0 };
        }
        frequencyCounts[date].consegne += 1;
      }
      if (o.oraRitiro) {
        const rDate = dayjs(
          o.oraRitiro instanceof Timestamp ? o.oraRitiro.toDate() : o.oraRitiro
        ).format("YYYY-MM-DD");
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
    <Layout style={{ padding: "20px" }}>
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

        {/* Lost Radios Alert */}
        {/* {totalLost > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <LostRadiosAlert totalLost={totalLost} />
            </Col>
          </Row>
        )} */}

        {/* Revenue Statistics */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Entrate</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title={`Entrate (${selectedMonth.format("MMMM YYYY")})`}
              value={totalMoneyReceived}
              loading={loading}
              prefix='€'
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title='Valore Medio Ordine'
              value={averageOrderValue}
              loading={loading}
              prefix='€'
              precision={2}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title='Entrate Mese Precedente'
              value={previousMonthMoneyReceived}
              loading={loading}
              prefix='€'
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
        </Row>

        {/* Saldo Line Chart */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <ChartCard
              title='Andamento Entrate Giornaliere'
              loading={loading}
              height={300}
            >
              <SaldoLineChart data={saldoChartData} />
            </ChartCard>
          </Col>
        </Row>

        {/* Order Count Statistics */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Ordini e Radioline</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title={`Ordini ${selectedMonth.format("MMMM YYYY")}`}
              value={currentMonthCount}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title={`Ordini ${selectedMonth
                .clone()
                .subtract(1, "month")
                .format("MMMM YYYY")}`}
              value={lastMonthCount}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title='Radioline Consegnate'
              value={totalRadiosDelivered}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Extra Consegnate'
              value={totalExtras}
              loading={loading}
              valueStyle={{ fontSize: "1.5rem", color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Radioline Perse'
              value={totalLost}
              loading={loading}
              valueStyle={{
                fontSize: "1.5rem",
                color: totalLost > 0 ? "#cf1322" : "#52c41a",
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard
              title='Tasso di Perdita'
              value={
                totalRadiosDelivered > 0
                  ? (totalLost / totalRadiosDelivered) * 100
                  : 0
              }
              loading={loading}
              suffix='%'
              precision={2}
              valueStyle={{
                fontSize: "1.5rem",
                color: totalLost > 0 ? "#cf1322" : "#52c41a",
              }}
            />
          </Col>
        </Row>

        {/* Status Distribution and Weekly Orders */}
        <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title='Distribuzione Stati Ordini'
              loading={loading}
              height={300}
            >
              <OrderStatusPieChart data={statusData} />
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard
              title={`Ordini per Settimana (${selectedMonth.format(
                "MMMM YYYY"
              )})`}
              loading={loading}
              height={300}
            >
              <WeeklyOrdersAreaChart data={chartData} />
            </ChartCard>
          </Col>
        </Row>

        {/* Channel Utilization */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <ChartCard
              title='Utilizzo Canali Radio'
              loading={loading}
              height={300}
            >
              <ChannelUtilizationChart data={channelData} />
            </ChartCard>
          </Col>
        </Row>

        {/* Top Guides and Locations */}
        <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title='Top 10 Guide per Ordini'
              loading={loading}
              height={400}
            >
              <TopGuidesTable data={topGuides} />
            </ChartCard>
          </Col>
          {/* <Col xs={24} lg={12}>
            <ChartCard
              title='Top 10 Luoghi di Consegna'
              loading={loading}
              height={400}
            >
              <TopLocationsTable data={topDeliveryLocations} />
            </ChartCard>
          </Col> */}
        </Row>
        {/* 
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title='Top 10 Luoghi di Ritiro'
              loading={loading}
              height={400}
            >
              <TopLocationsTable data={topPickupLocations} />
            </ChartCard>
          </Col>
        </Row> */}

        {/* Hourly Frequency */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Frequenza Consegne e Ritiri</Title>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <ChartCard
              title='Frequenza Ordini Giornalieri'
              loading={loading}
              height={400}
            >
              <HourlyFrequencyBarChart data={hourlyData} />
            </ChartCard>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default DashboardPage;
