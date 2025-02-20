// src/pages/orders/OrdersPage.tsx
import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  DatePicker,
  Row,
  Button,
  message,
  FloatButton,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getOrders } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { Timestamp } from "firebase/firestore";

import OrderTable from "../components/orderTable";
import OrderDrawer from "../components/orderForm";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import { PlusOutlined } from "@ant-design/icons";
import { saveOrder, updateOrder } from "../api/orderApi";
import { updateFreeChannels } from "../helper/updateFreeChannels";

const { Header, Content } = Layout;
const { Title } = Typography;

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useDocumentTitle(`Ordini | ${CONFIG.appName}`);

  // State for controlling the OrderDrawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  type Mode = "create" | "view" | "edit";
  const [drawerMode, setDrawerMode] = useState<Mode>("view");

  const [selectedOrder, setSelectedOrder] = useState<IOrder | undefined>(
    undefined
  );

  // Function to retrieve and parse total channels and iddle channels from localStorage
  const getChannelDataFromStorage = (): {
    totalChannels: number;
    iddleChannels: number[];
  } => {
    // Retrieve total channels from localStorage, parse it and convert to a number.
    const storedChannels = localStorage.getItem("channels");
    const totalChannels: number = storedChannels
      ? Number(JSON.parse(storedChannels))
      : 0;

    // Retrieve iddle channels from localStorage, parse it to get an array.
    const storedIddleChannels = localStorage.getItem("Iddlechannels");
    const iddleChannels: number[] = storedIddleChannels
      ? JSON.parse(storedIddleChannels)
      : [];

    return { totalChannels, iddleChannels };
  };

  // Usage example: retrieving channel data then updating free channels list
  const { totalChannels, iddleChannels } = getChannelDataFromStorage();

  const fetchOrders = async () => {
    setLoading(true);
    try {
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

      // Update free channels list using the available orders
      updateFreeChannels(totalChannels, iddleChannels, data);
    } catch (error) {
      message.error("Failed to fetch orders.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync the selected date with the query parameter
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
  }, [searchParams]);

  // Fetch orders whenever the selected date changes
  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  // Handle DatePicker changes
  const onDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      navigate(`/?date=${date.format("YYYY-MM-DD")}`);
    } else {
      const today = dayjs();
      setSelectedDate(today);
      navigate(`/?date=${today.format("YYYY-MM-DD")}`);
      message.info("Resetting to today's orders.");
    }
  };

  // Callback for when an order is submitted from the drawer (create or edit)
  const handleSubmit = async (orderData: Partial<IOrder>, mode: Mode) => {
    if (mode === "create") {
      // Set default status for new orders
      orderData.status = "Presa in Carico";
      // Create new order
      const docId = await saveOrder(orderData as Omit<IOrder, "id">);
      setOrders((prev) => [...prev, { ...orderData, id: docId } as IOrder]);
    } else if (mode === "edit" && selectedOrder) {
      // Update existing order
      await updateOrder(selectedOrder.id as string, orderData);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id ? { ...order, ...orderData } : order
        )
      );
    }
  };

  // Open the drawer in create mode
  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedOrder(undefined);
    setDrawerVisible(true);
  };

  // Open the drawer in view mode (for a given order)
  const openViewDrawer = (order: IOrder, mode?: "view" | "edit") => {
    setDrawerMode(mode || "view");
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Row justify="space-between" align="middle">
          <Title level={2} style={{ margin: 0 }}>
            Gestione Ordini
          </Title>
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: 200 }}
            value={selectedDate}
            onChange={onDateChange}
          />
        </Row>
      </Header>

      <Content>
        {/* Button to open the create order drawer */}
        <FloatButton
          type="primary"
          tooltip="Aggiungi Ordine"
          icon={<PlusOutlined />}
          onClick={openCreateDrawer}
        ></FloatButton>

        {/* Order table; assume it calls onRowClick(order) when a row is clicked */}
        <OrderTable
          orders={orders}
          setOrders={setOrders}
          loading={loading}
          selectedDate={selectedDate}
          onRowClick={openViewDrawer} // You might need to extend OrderTable to support this prop.
        />

        {/* Unified OrderDrawer component */}
        <OrderDrawer
          visible={drawerVisible}
          mode={drawerMode}
          order={selectedOrder}
          onClose={() => {
            setDrawerVisible(false);
            setDrawerMode("view"); // Reset mode on close
          }}
          onModeChange={(newMode) => setDrawerMode(newMode)}
          onSubmit={handleSubmit}
        />
      </Content>
    </Layout>
  );
};

export default OrdersPage;
