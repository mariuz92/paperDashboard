import React, { useEffect, useState } from "react";
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  message,
  DatePicker,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { getOrders } from "../../orders/api/orderApi"; // <-- Your getOrders API
import { IOrder } from "../../../types/interfaces";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Legend,
  Bar,
  LineChart,
  Line,
} from "recharts";
const { Title } = Typography;
const { Content } = Layout;

/**
 * This dashboard:
 * - Fetches all orders via `getOrders`
 * - Lets user pick a month in a `DatePicker`
 * - Displays the # of orders this month vs last month
 * - Shows a chart of this month’s orders grouped by week
 */
export const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // The selected month (default to the current month)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  // Stats
  const [currentMonthCount, setCurrentMonthCount] = useState<number>(0);
  const [lastMonthCount, setLastMonthCount] = useState<number>(0);
  const [variationPercent, setVariationPercent] = useState<number>(0);
  const [totalRadiosDelivered, setTotalRadiosDelivered] = useState<number>(0);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);

  const [totalMoneyReceived, setTotalMoneyReceived] = useState<number>(0);
  const [previousMonthMoneyReceived, setPreviousMonthMoneyReceived] =
    useState<number>(0);
  const [revenueDifference, setRevenueDifference] = useState<number>(0);
  const [saldoChartData, setSaldoChartData] = useState<any[]>([]);
  /** Fetch all orders once on mount */
  useEffect(() => {
    fetchOrders();
  }, []);

  /** Recompute stats & chart whenever selectedMonth or orders change */
  useEffect(() => {
    computeStats();
  }, [selectedMonth, orders]);

  /**
   * 1) Fetch orders from the API
   */
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Example: get all orders
      const { data } = await getOrders({ page: 1, pageSize: 1000 });
      setOrders(data);
    } catch (error) {
      message.error("Errore durante il caricamento degli ordini.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2) Compute monthly stats: selected month vs. previous month
   */
  const computeStats = () => {
    const thisMonthStart = selectedMonth.startOf("month");
    const thisMonthEnd = selectedMonth.endOf("month");

    const lastMonthDate = selectedMonth.subtract(1, "month");
    const lastMonthStart = lastMonthDate.startOf("month");
    const lastMonthEnd = lastMonthDate.endOf("month");

    // Filter orders
    const thisMonthOrders = orders.filter((o) =>
      inRange(o, thisMonthStart, thisMonthEnd)
    );
    const lastMonthOrders = orders.filter((o) =>
      inRange(o, lastMonthStart, lastMonthEnd)
    );

    const currentCount = thisMonthOrders.length;
    const previousCount = lastMonthOrders.length;

    // Variation
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

    // Calculate total money received
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

    // Calculate revenue difference percentage
    const difference =
      lastMonthMoney === 0
        ? 100
        : ((totalMoney - lastMonthMoney) / lastMonthMoney) * 100;
    setRevenueDifference(difference);

    // Prepare saldo data for chart
    const saldoData = thisMonthOrders.map((order) => ({
      date: dayjs(order.orarioConsegna.toDate()).format("YYYY-MM-DD"),
      saldo: order.saldo || 0,
    }));

    setSaldoChartData(saldoData);
    const hourlyFrequency = buildOrderFrequencyData(thisMonthOrders);
    setHourlyData(hourlyFrequency);

    setTotalRadiosDelivered(totalRadios);
    // Build chart data for the selected month
    const chart = buildChartDataByWeek(thisMonthOrders, selectedMonth);
    setChartData(chart);
  };

  /** Function to build hourly order data, limiting only to hours present in orders */
  function buildOrderFrequencyData(ordersList: IOrder[]) {
    const frequencyCounts: Record<
      string,
      { consegne: number; ritiri: number }
    > = {};

    ordersList.forEach((o) => {
      const date = dayjs(o.orarioConsegna.toDate()).format("YYYY-MM-DD");

      // Ensure the date key exists
      if (!frequencyCounts.hasOwnProperty(date)) {
        frequencyCounts[date] = { consegne: 0, ritiri: 0 };
      }

      frequencyCounts[date].consegne += 1;

      if (o.oraRitiro) {
        const rDate = dayjs(o.oraRitiro.toDate()).format("YYYY-MM-DD");

        if (!frequencyCounts.hasOwnProperty(rDate)) {
          frequencyCounts[rDate] = { consegne: 0, ritiri: 0 };
        }

        frequencyCounts[rDate].ritiri += 1;
      }
    });

    return Object.entries(frequencyCounts).map(([date, counts]) => ({
      label: date,
      consegne: counts.consegne,
      ritiri: counts.ritiri,
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
            <DatePicker
              picker='month'
              style={{ width: "100%" }}
              value={selectedMonth}
              onChange={(newVal) => setSelectedMonth(newVal || dayjs())}
            />
          </Col>
        </Row>

        {/* Statistic for Total Money Received */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Entrate</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title={`Totale entrate (${selectedMonth.format("MMMM YYYY")})`}
                value={totalMoneyReceived}
                prefix='€'
                valueStyle={{ fontSize: "1.5rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title='Differenza Mese Precedente'
                value={revenueDifference}
                precision={2}
                suffix='%'
                valueStyle={{
                  color: revenueDifference >= 0 ? "#3f8600" : "#cf1322",
                  fontSize: "1.5rem",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Saldo Radioline Chart */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <Card title='Andamento Entrate'>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={saldoChartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type='monotone' dataKey='saldo' stroke='#1890ff' />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
        {/* Stats: This Month, Last Month, Variation */}
        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Radioline Consegnate</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title={`${selectedMonth.format("MMMM YYYY")}`}
                value={currentMonthCount}
                valueStyle={{ fontSize: "1.5rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title={`${selectedMonth
                  .clone()
                  .subtract(1, "month")
                  .format("MMMM YYYY")}`}
                value={lastMonthCount}
                valueStyle={{ fontSize: "1.5rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title='Variazione M/M'
                precision={2}
                suffix='%'
                value={variationPercent}
                valueStyle={{
                  color: variationPercent >= 0 ? "#3f8600" : "#cf1322",
                  fontSize: "1.5rem",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Chart Section */}
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <Card
              title={`Ordini di ${selectedMonth.format(
                "MMMM YYYY"
              )} (per Settimana)`}
              loading={loading}
            >
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id='colorOrders'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='5%'
                          stopColor='#1890ff'
                          stopOpacity={0.8}
                        />
                        <stop
                          offset='95%'
                          stopColor='#1890ff'
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='label' />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type='monotone'
                      dataKey='count'
                      stroke='#1890ff'
                      fillOpacity={1}
                      fill='url(#colorOrders)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row style={{ marginTop: 32 }}>
          <Title level={4}>Frequenza Consegne e Ritiri per Ora</Title>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card loading={loading}>
              <Statistic
                title='Radioline Consegnate'
                value={totalRadiosDelivered}
                valueStyle={{ fontSize: "1.5rem" }}
              />
            </Card>
          </Col>
        </Row>
        <Row style={{ marginTop: 32 }}>
          <Col span={24}>
            <Card title='Frequenza Ordini per Ora'>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='hour' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='consegne' stackId='a' fill='#1890ff' />
                    <Bar dataKey='ritiri' stackId='a' fill='#ff4d4f' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

/* -------------- Helper Functions --------------- */

/* -------------- Helper Functions --------------- */

/** Check if an order is in [start, end] range by `orarioConsegna`. */
function inRange(o: IOrder, start: Dayjs, end: Dayjs) {
  if (!o.orarioConsegna) return false;

  // Ensure Firestore Timestamp is converted correctly to Day.js
  const orderDate = o.orarioConsegna.toDate
    ? dayjs(o.orarioConsegna.toDate()) // Convert Firestore Timestamp
    : dayjs(o.orarioConsegna); // Already in valid date format

  return orderDate.isSameOrAfter(start) && orderDate.isSameOrBefore(end);
}

/** Build chart data by grouping orders in the selectedMonth by "week of the month". */
function buildChartDataByWeek(ordersList: IOrder[], selectedMonth: Dayjs) {
  const start = selectedMonth.startOf("month");
  const end = selectedMonth.endOf("month");

  // Filter to that month
  const filtered = ordersList.filter((o) => inRange(o, start, end));

  // Group by "week of the month"
  const weekCounts: Record<string, number> = {};

  filtered.forEach((o) => {
    const d = o.orarioConsegna.toDate
      ? dayjs(o.orarioConsegna.toDate()) // Convert Firestore Timestamp
      : dayjs(o.orarioConsegna);

    const dayOfMonth = d.date(); // 1..31
    const weekIndex = Math.ceil((dayOfMonth / selectedMonth.daysInMonth()) * 4); // integer 1..4
    const key = `Settimana ${weekIndex}`;
    weekCounts[key] = (weekCounts[key] || 0) + 1;
  });

  // Convert to array
  const data = Object.entries(weekCounts).map(([k, c]) => ({
    label: k,
    count: c,
  }));

  // Sort by numeric portion (Settimana 1, 2, 3..)
  data.sort((a, b) => {
    const wA = parseInt(a.label.split(" ")[1], 10);
    const wB = parseInt(b.label.split(" ")[1], 10);
    return wA - wB;
  });

  return data;
}

export default DashboardPage;
