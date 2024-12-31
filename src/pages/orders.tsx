import React, { useState, useEffect } from "react";
import { message } from "antd";
import { Layout, Typography, DatePicker, Row, Collapse, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useSearchParams, useNavigate } from "react-router-dom"; // Handle query params and navigation
import { getOrders } from "../api/orderApi"; // API to fetch orders
import { IOrder } from "../interfaces/index";
import OrderForm from "../components/orders/orderForm";
import OrderTable from "../components/orders/orderTable";

const { Header, Content } = Layout;
const { Title } = Typography;

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // Default to today
  const [searchParams] = useSearchParams(); // Get query parameters
  const navigate = useNavigate(); // For redirecting with query params

  // Controls whether the form is open or closed
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  /**
   * Fetch orders for the selected date.
   */
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const startDate = selectedDate
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      const endDate = selectedDate.endOf("day").format("YYYY-MM-DD HH:mm:ss");

      const { data } = await getOrders({
        page: 1,
        pageSize: 10,
        startDate,
        endDate,
      });
      setOrders(data);
      message.success(
        `Orders for ${selectedDate.format("DD/MM/YYYY")} loaded.`
      );
    } catch (error) {
      message.error("Failed to fetch orders.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Synchronize the selectedDate with the query parameter.
   */
  useEffect(() => {
    const dateParam = searchParams.get("date"); // Read the 'date' query parameter
    if (dateParam) {
      const parsedDate = dayjs(dateParam, "YYYY-MM-DD");
      if (parsedDate.isValid()) {
        setSelectedDate(parsedDate);
      } else {
        message.error("Invalid date in URL, defaulting to today.");
        setSelectedDate(dayjs()); // Fallback to today
      }
    }
  }, [searchParams]);

  /**
   * Fetch orders whenever the selected date changes.
   */
  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  /**
   * Handle date picker change and update the query parameter.
   */
  const onDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      navigate(`/?date=${date.format("YYYY-MM-DD")}`); // Update the URL
    } else {
      const today = dayjs();
      setSelectedDate(today);
      navigate(`/?date=${today.format("YYYY-MM-DD")}`);
      message.info("Resetting to today's orders.");
    }
  };

  /**
   * The panel header has only the button:
   * - Blue (default) when "Crea ordine" is displayed
   * - Grey (#bfbfbf) when "Chiudi ordine" is displayed
   */
  const panelHeader = (
    <div style={{ textAlign: "right", width: "100%" }}>
      <Button
        type='primary'
        style={
          isFormOpen
            ? {
                backgroundColor: "#bfbfbf",
                borderColor: "#bfbfbf",
                color: "#fff",
              }
            : {}
        }
        onClick={() => setIsFormOpen((prev) => !prev)}
      >
        {isFormOpen ? "Chiudi ordine" : "Crea ordine"}
      </Button>
    </div>
  );

  const collapseItems = [
    {
      key: "orderFormPanel",
      label: panelHeader,
      children: (
        <OrderForm
          addOrder={(newOrder) => setOrders((prev) => [...prev, newOrder])}
        />
      ),
    },
  ];

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Row justify='space-between' align='middle'>
          <Title level={2} style={{ margin: 0 }}>
            Gestione Ordini
          </Title>
          <DatePicker
            format='DD/MM/YYYY'
            style={{ width: "200px" }}
            value={selectedDate}
            onChange={onDateChange}
          />
        </Row>
      </Header>

      <Content>
        <Collapse
          expandIcon={() => null} // Hide the default arrow
          style={{ marginBottom: 20 }}
          activeKey={isFormOpen ? ["orderFormPanel"] : []}
          items={collapseItems}
        />

        <OrderTable orders={orders} setOrders={setOrders} loading={loading} />
      </Content>
    </Layout>
  );
};
