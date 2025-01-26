import React, { useState, useEffect } from "react";
import { Layout, Typography, DatePicker, Row, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getOrders } from "../api/orderApi"; // API to fetch orders
import { IOrder } from "../../../types/interfaces";
import { Timestamp } from "firebase/firestore";
import OrderForm from "../components/orderForm";
import OrderTable from "../components/orderTable";

const { Header, Content } = Layout;
const { Title } = Typography;

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // Default to "today"

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /**
   * Fetch orders for the selected date range (start of day to end of day).
   * Convert the dayjs date range to Firestore Timestamps.
   */
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Convert the selected Dayjs date to JS Date, then to Firestore Timestamp.
      const startOfDay = selectedDate.startOf("day").toDate();
      const endOfDay = selectedDate.endOf("day").toDate();

      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const { data } = await getOrders({
        page: 1,
        pageSize: 50,
        startDate: startTimestamp,
        endDate: endTimestamp,
      });

      setOrders(data);
      // Optionally show a success message
      // message.success(`Orders for ${selectedDate.format("DD/MM/YYYY")} loaded.`);
    } catch (error) {
      message.error("Failed to fetch orders.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync the selected date with the "date" query parameter (e.g. ?date=YYYY-MM-DD).
   */
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsedDate = dayjs(dateParam, "YYYY-MM-DD");
      if (parsedDate.isValid()) {
        setSelectedDate(parsedDate);
      } else {
        message.error("Invalid date in URL; defaulting to today.");
        setSelectedDate(dayjs());
      }
    }
    // If there's no ?date=..., we keep today's date by default.
  }, [searchParams]);

  /**
   * Whenever selectedDate changes, fetch orders again.
   */
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  /**
   * Handle date picker changes and update the query param (?date=...).
   */
  const onDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      navigate(`/?date=${date.format("YYYY-MM-DD")}`);
    } else {
      // If user clears the date, revert to "today"
      const today = dayjs();
      setSelectedDate(today);
      navigate(`/?date=${today.format("YYYY-MM-DD")}`);
      message.info("Resetting to today's orders.");
    }
  };

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Row justify='space-between' align='middle'>
          <Title level={2} style={{ margin: 0 }}>
            Gestione Ordini
          </Title>

          {/* DatePicker with day/month/year format */}
          <DatePicker
            format='DD/MM/YYYY'
            style={{ width: 200 }}
            value={selectedDate}
            onChange={onDateChange}
          />
        </Row>
      </Header>

      <Content>
        {/* Form to add a new order */}
        <OrderForm
          addOrder={(newOrder) => setOrders((prev) => [...prev, newOrder])}
        />

        {/* Table showing fetched orders */}
        <OrderTable
          orders={orders}
          setOrders={setOrders}
          loading={loading}
          selectedDate={selectedDate}
        />
      </Content>
    </Layout>
  );
};
