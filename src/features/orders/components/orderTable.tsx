import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Select,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  DatePicker,
  Dropdown,
  Popconfirm,
  Space,
  Typography,
  Row,
  Tooltip,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { FormInstance, MenuProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";
import { colors, IOrder, IOrderStatus } from "../../../types/interfaces";
import { updateOrder, deleteOrder } from "../api/orderApi";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilePdfOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IUser } from "../../../types/interfaces/IUser";
import { getUsers } from "../../users/api/userApi";
import "../../../shared/style.css";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { useNavigate } from "react-router";
import ManageChannels from "./manageChannels";

/** Helper: Safely convert a `Timestamp|string|null|undefined` to a Dayjs object. */
function dayjsValue(value?: Timestamp | string | null) {
  if (!value) {
    return dayjs("");
  }
  if (value instanceof Timestamp) {
    return dayjs(value.toDate());
  }
  return dayjs(value);
}

/** Helper: Format a `Timestamp|string` nicely for display in the table. */
function formatDateCell(value?: Timestamp | string | null) {
  const d = dayjsValue(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "";
}

/** Extended column type: can be editable, required, etc. */
interface EditableColumnType<T> extends ColumnType<T> {
  editable?: boolean;
  required?: boolean;
}

/** Props for the EditableCell */
interface EditableCellProps {
  editing: boolean;
  col?: EditableColumnType<IOrder>;
  dataIndex: keyof IOrder;
  title: string;
  inputType: "text" | "number" | "select" | "date" | "places";
  children: React.ReactNode;
  form: FormInstance;
}

/** Main props for OrderTable */
interface OrderTableProps {
  orders: IOrder[];
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
  loading: boolean;
  selectedDate: Dayjs;
  onRowClick?: (order: IOrder, mode?: "view" | "edit") => void;
}

/** Convert data to PDF (landscape) */
const exportToPDF = (orders: IOrder[]) => {
  const doc = new jsPDF("landscape");
  const columns = [
    { header: "Nome Guida", dataKey: "nomeGuida" },
    { header: "Status", dataKey: "status" },
    { header: "Orario Consegna", dataKey: "oraConsegna" },
    { header: "Luogo Consegna", dataKey: "luogoConsegna" },
    { header: "Consegnato Da", dataKey: "deliveryName" },
    { header: "Ora Ritiro", dataKey: "oraRitiro" },
    { header: "Luogo Ritiro", dataKey: "luogoRitiro" },
    { header: "Ritirato Da", dataKey: "pickupName" },
  ];

  const rows = orders.map((order) => ({
    nomeGuida: order.nomeGuida || "",
    status: order.status || "",
    oraConsegna: formatDateCell(order.oraConsegna),
    luogoConsegna: order.luogoConsegna || "",
    deliveryName: order.deliveryName || "-",
    oraRitiro: formatDateCell(order.oraRitiro),
    luogoRitiro: order.luogoRitiro || "",
    pickupName: order.pickupName || "-",
  }));

  autoTable(doc, { columns, body: rows, margin: { top: 20 } });
  const date = new Date().toLocaleDateString("it-IT");
  doc.save(`ordini_${date}.pdf`);
};

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

/** Main OrderTable component */
const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  setOrders,
  loading,
  selectedDate,
  onRowClick,
}) => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<any[]>([]);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const _riders = await getUsers("rider");
        setRiders(_riders);
      } catch (error) {
        console.error("Error fetching riders:", error);
      }
    };

    fetchRiders();
  }, []);

  const [tenantId, setTenantId] = useState<string>("");
  const [open, setOpen] = useState(false);

  const handleNavigateToUsersPage = () => {
    navigate("/Collaboratori");
  };

  useEffect(() => {
    setTenantId(getTenantIdFromStorage());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "tenantId") setTenantId(getTenantIdFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      const updatedOrders = orders.filter((order) => order.id !== id);
      setOrders(updatedOrders);
      message.success("Ordine eliminato con successo!");
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error("Ordine non eliminato.");
    }
  };

  const handleShare = async (rider: IUser, index: number) => {
    const order = orders[index];

    if (order.status === "Annullato") {
      message.warning("Non è possibile assegnare un ordine annullato");
      return;
    }

    const isPickupAssignment =
      order.status === "Consegnato" || order.status === "Attesa ritiro";

    const updatedOrder: IOrder = isPickupAssignment
      ? {
          ...order,
          status: "In Ritiro",
          ritiratoDa: rider.id,
          pickupName: rider.displayName,
        }
      : {
          ...order,
          status: "In Consegna",
          consegnatoDa: rider.id,
          deliveryName: rider.displayName,
        };

    try {
      await updateOrder(order.id as string, updatedOrder);

      const actionType = isPickupAssignment ? "ritiro" : "consegna";
      message.success(
        `Ordine assegnato a ${rider.displayName} per ${actionType}`
      );

      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? updatedOrder : o))
      );
    } catch (error) {
      message.error("Errore nell'assegnazione dell'ordine");
      console.error(error);
    }
  };

  const getMenuItems = (order: IOrder, index: number) => [
    {
      label: (
        <span onClick={() => onRowClick && onRowClick(order, "edit")}>
          <EditOutlined /> Modifica
        </span>
      ),
      key: "edit",
    },
    {
      label: "Assegna a",
      key: "share",
      icon: <ShareAltOutlined />,
      children:
        riders.length === 0
          ? [
              {
                label: (
                  <span onClick={handleNavigateToUsersPage}>
                    <UserAddOutlined style={{ marginRight: 8 }} />
                    Aggiungi Rider
                  </span>
                ),
                key: "add_rider",
              },
            ]
          : riders.map((rider) => ({
              label: (
                <span onClick={() => handleShare(rider, index)}>
                  {rider.displayName}
                </span>
              ),
              key: rider.id,
            })),
    },
    {
      type: "divider",
    } as const,
    {
      label: (
        <Popconfirm
          title='Sei sicuro di voler eliminare questo ordine?'
          onConfirm={() => order.id && handleDelete(order.id)}
          okText='Sì'
          cancelText='No'
        >
          <span>
            <DeleteOutlined /> Elimina
          </span>
        </Popconfirm>
      ),
      key: "delete",
    },
  ];

  const columns: ColumnType<IOrder>[] = [
    {
      title: "Nome Guida",
      dataIndex: "nomeGuida",
      key: "nomeGuida",
      fixed: "left",
      width: 180,
      sorter: (a, b) => (a.nomeGuida || "").localeCompare(b.nomeGuida || ""),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder='Cerca Nome Guida'
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type='primary'
              onClick={() => confirm()}
              size='small'
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                setSelectedKeys([]);
                confirm();
              }}
              size='small'
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.nomeGuida
          ? record.nomeGuida
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      filters: [
        { text: "Attesa ritiro", value: "Attesa ritiro" },
        { text: "Presa in Carico", value: "Presa in Carico" },
        { text: "In Consegna", value: "In Consegna" },
        { text: "Consegnato", value: "Consegnato" },
        { text: "In Ritiro", value: "In Ritiro" },
        { text: "Ritirato", value: "Ritirato" },
        { text: "Annullato", value: "Annullato" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: IOrderStatus) => {
        const colors: Record<IOrderStatus, string> = {
          "Attesa ritiro": "orange",
          "Presa in Carico": "gold",
          "In Consegna": "blue",
          Consegnato: "green",
          "In Ritiro": "purple",
          Ritirato: "cyan",
          Annullato: "red",
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: "Orario Consegna",
      dataIndex: "oraConsegna",
      key: "oraConsegna",
      width: 150,
      sorter: (a, b) =>
        dayjsValue(a.oraConsegna).valueOf() -
        dayjsValue(b.oraConsegna).valueOf(),
      render: (val) => formatDateCell(val),
    },
    {
      title: "Luogo Consegna",
      dataIndex: "luogoConsegna",
      key: "luogoConsegna",
      width: 220,
      sorter: (a, b) =>
        (a.luogoConsegna || "").localeCompare(b.luogoConsegna || ""),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder='Cerca Luogo Consegna'
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type='primary'
              onClick={() => confirm()}
              size='small'
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                setSelectedKeys([]);
                confirm();
              }}
              size='small'
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.luogoConsegna
          ? record.luogoConsegna
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false,
      render: (text) => (
        <Tooltip title={text}>
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text || "-"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Consegnato Da",
      dataIndex: "deliveryName",
      key: "deliveryName",
      width: 180,
      sorter: (a, b) =>
        (a.deliveryName || "").localeCompare(b.deliveryName || ""),
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <Tag
              icon={<UserOutlined />}
              color='blue'
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              {text}
            </Tag>
          </Tooltip>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Ora Ritiro",
      dataIndex: "oraRitiro",
      key: "oraRitiro",
      width: 150,
      sorter: (a, b) =>
        dayjsValue(a.oraRitiro).valueOf() - dayjsValue(b.oraRitiro).valueOf(),
      render: (val) => formatDateCell(val),
    },
    {
      title: "Luogo Ritiro",
      dataIndex: "luogoRitiro",
      key: "luogoRitiro",
      width: 220,
      sorter: (a, b) =>
        (a.luogoRitiro || "").localeCompare(b.luogoRitiro || ""),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder='Cerca Luogo Ritiro'
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type='primary'
              onClick={() => confirm()}
              size='small'
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                setSelectedKeys([]);
                confirm();
              }}
              size='small'
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.luogoRitiro
          ? record.luogoRitiro
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false,
      render: (text) => (
        <Tooltip title={text}>
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text || "-"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Ritirato Da",
      dataIndex: "pickupName",
      key: "pickupName",
      width: 180,
      sorter: (a, b) => (a.pickupName || "").localeCompare(b.pickupName || ""),
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <Tag
              icon={<UserOutlined />}
              color='purple'
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              {text}
            </Tag>
          </Tooltip>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Azione",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Row justify='center'>
          <Button
            type='text'
            shape='circle'
            onClick={() => onRowClick && onRowClick(record, "view")}
          >
            <EyeOutlined style={{ marginRight: 4 }} />
          </Button>
          <Dropdown
            menu={{ items: getMenuItems(record, orders.indexOf(record)) }}
            trigger={["click"]}
          >
            <Button
              shape='circle'
              type='text'
              style={{ display: "flex", alignItems: "center" }}
            >
              <MoreOutlined />
            </Button>
          </Dropdown>
        </Row>
      ),
    },
  ];

  return (
    <>
      <Space
        style={{ marginBottom: 16, display: "flex", justifyContent: "end" }}
      >
        <Button
          icon={<FilePdfOutlined />}
          onClick={() => exportToPDF(orders)}
          type='primary'
        >
          Esporta PDF
        </Button>
        <Button type='default' onClick={() => setOpen(true)}>
          Gestisci canali
        </Button>

        <ManageChannels
          tenantId={tenantId}
          visible={open}
          onClose={() => setOpen(false)}
          onSaved={() => {}}
        />
      </Space>
      <Table<IOrder>
        virtual
        bordered
        dataSource={orders}
        columns={columns}
        rowKey={(record) => record.id as string}
        loading={loading}
        tableLayout='fixed'
        scroll={{ x: 1480, y: 2000 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Totale: ${total} ordini`,
          pageSizeOptions: ["20", "50", "100", "200"],
        }}
      />
    </>
  );
};

export default OrderTable;
