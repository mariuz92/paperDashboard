// src/pages/orders/OrdersPage.tsx
import React, { useState, useEffect, useMemo } from "react";
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
import { watchOrders } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";

import OrderTable from "../components/orderTable";
import OrderDrawer from "../components/orderForm";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import { PlusOutlined } from "@ant-design/icons";
import { saveOrder, updateOrder } from "../api/orderApi";
import { updateFreeChannels } from "../helper/channelsSync";

const { Header, Content } = Layout;
const { Title } = Typography;

const getTenantIdFromStorage = (): string => {
  const raw = localStorage.getItem("tenantId");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return String((parsed as any).id);
    }
    return String(parsed);
  } catch {
    return raw;
  }
};

// ✅ Move this function outside the component to prevent recreating it
const getChannelDataFromStorage = (): {
  totalChannels: number;
  iddleChannels: number[];
  disabledChannels: number[];
} => {
  const storedChannels = localStorage.getItem("channels");
  const totalChannels: number = storedChannels
    ? Number(JSON.parse(storedChannels))
    : 0;

  const storedIddleChannels = localStorage.getItem("Iddlechannels");
  const iddleChannels: number[] = storedIddleChannels
    ? JSON.parse(storedIddleChannels)
    : [];

  const storedDisabledChannels = localStorage.getItem("disabledChannels");
  const disabledChannels: number[] = storedDisabledChannels
    ? JSON.parse(storedDisabledChannels)
    : [];

  return { totalChannels, iddleChannels, disabledChannels };
};

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [tenantId, setTenantId] = useState<string>("");
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

  // ✅ Get tenantId from storage
  useEffect(() => {
    const tid = getTenantIdFromStorage();
    setTenantId(tid);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "tenantId") {
        setTenantId(getTenantIdFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ Set up real-time listener for orders
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = watchOrders(
      tenantId,
      selectedDate.toDate(),
      (updatedOrders) => {
        setOrders(updatedOrders);
        setLoading(false);

        // ✅ Get channel data inside the callback to avoid dependency issues
        const { totalChannels, iddleChannels, disabledChannels } =
          getChannelDataFromStorage();

        // Update free channels list using the available orders
        updateFreeChannels(
          totalChannels,
          iddleChannels,
          disabledChannels,
          updatedOrders
        );
      }
    );

    // Cleanup listener on unmount or when dependencies change
    return () => unsubscribe();
  }, [tenantId, selectedDate]); // ✅ Removed channel dependencies

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
    // ✅ No need to manually update orders state - the watcher will handle it
    if (mode === "create") {
      orderData.status = "Presa in Carico";
      await saveOrder(orderData as Omit<IOrder, "id">);
    } else if (mode === "edit" && selectedOrder) {
      await updateOrder(selectedOrder.id as string, orderData);
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
        <Row justify='space-between' align='middle'>
          <Title level={2} style={{ margin: 0 }}>
            Gestione Ordini
          </Title>
          <DatePicker
            format='DD/MM/YYYY'
            style={{ width: 200 }}
            value={selectedDate}
            onChange={onDateChange}
          />
        </Row>
      </Header>

      <Content>
        <FloatButton
          type='primary'
          tooltip='Aggiungi Ordine'
          icon={<PlusOutlined />}
          onClick={openCreateDrawer}
        />

        <OrderTable
          orders={orders}
          setOrders={setOrders}
          loading={loading}
          selectedDate={selectedDate}
          onRowClick={openViewDrawer}
        />

        <OrderDrawer
          visible={drawerVisible}
          mode={drawerMode}
          order={selectedOrder}
          onClose={() => {
            setDrawerVisible(false);
            setDrawerMode("view");
          }}
          onModeChange={(newMode) => setDrawerMode(newMode)}
          onSubmit={handleSubmit}
        />
      </Content>
    </Layout>
  );
};

export default OrdersPage;
