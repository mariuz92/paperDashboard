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
  Badge,
  Modal,
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
import { useNavigate } from "react-router";
import ManageChannels from "./manageChannels";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import { watchAllRiderStatuses } from "../../users/api/riderStatusApi";

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
  const [riderStatuses, setRiderStatuses] = useState<Map<string, IRiderStatus>>(
    new Map()
  );

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

  useEffect(() => {
    const unsubscribe = watchAllRiderStatuses((statuses) => {
      const statusMap = new Map<string, IRiderStatus>();
      statuses.forEach((status) => {
        statusMap.set(status.riderId, status);
      });
      setRiderStatuses(statusMap);
    });
    return () => unsubscribe();
  }, []);

  const [tenantId, setTenantId] = useState<string>("");
  const [open, setOpen] = useState(false);

  const handleNavigateToUsersPage = () => {
    navigate("/Riders");
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

  console.log("🎯 [handleShare] Starting assignment:", {
    orderId: order.id,
    currentStatus: order.status,
    hasPickupDetails: !!(order.luogoRitiro && order.oraRitiro),
    hasDeliveryDetails: !!(order.luogoConsegna && order.oraConsegna),
    deliveryName: order.deliveryName,
    pickupName: order.pickupName,
  });

  if (order.status === "Annullato") {
    message.warning("Non è possibile assegnare un ordine annullato");
    return;
  }

  // ✅ Determine assignment type based on what's already assigned AND what info is available
  let isPickupAssignment = false;
  
  // If delivery is already assigned and pickup info exists, this is a pickup assignment
  if ((order.deliveryName || order.consegnatoDa) && (order.luogoRitiro && order.oraRitiro)) {
    isPickupAssignment = true;
  }
  // If neither is assigned, check which info is available
  else if (!order.deliveryName && !order.consegnatoDa && !order.pickupName && !order.ritiratoDa) {
    // First assignment - determine by which fields are filled
    if (order.luogoConsegna && order.oraConsegna) {
      isPickupAssignment = false; // Delivery info exists, assign delivery first
    } else if (order.luogoRitiro && order.oraRitiro) {
      isPickupAssignment = true; // Only pickup info exists
    } else {
      message.warning("Definire luogo e orario prima di assegnare");
      return;
    }
  }

  console.log("📍 [handleShare] Assignment type determined:", {
    isPickupAssignment,
    hasDeliveryAssigned: !!(order.deliveryName || order.consegnatoDa),
    hasPickupAssigned: !!(order.pickupName || order.ritiratoDa),
  });

  // ✅ Check if trying to reassign when status is "Assegnato"
  if (order.status === "Assegnato") {
    const currentRiderName = isPickupAssignment ? order.pickupName : order.deliveryName;
    const currentRiderId = isPickupAssignment ? order.ritiratoDa : order.consegnatoDa;
    
    // Check if trying to assign to the same rider
    if (currentRiderId === rider.id) {
      message.info(`Questo ordine è già assegnato a ${currentRiderName}`);
      return;
    }

    // Show confirmation modal for reassignment
    Modal.confirm({
      title: "Riassegna ordine",
      content: `Questo ordine è già assegnato a ${currentRiderName} per ${isPickupAssignment ? 'ritiro' : 'consegna'}. Vuoi riassegnarlo a ${rider.displayName}?`,
      okText: "Sì, riassegna",
      cancelText: "Annulla",
      onOk: async () => {
        await performAssignment(order, rider, isPickupAssignment);
      },
    });
    return;
  }

  // ✅ Check if order has required info - show modal if missing
  if (isPickupAssignment) {
    if (!order.luogoRitiro || !order.oraRitiro) {
      Modal.confirm({
        title: "Informazioni mancanti",
        content:
          "Luogo e/o orario di ritiro non definiti. Vuoi modificare l'ordine ora?",
        okText: "Sì, modifica",
        cancelText: "Annulla",
        onOk: () => {
          if (onRowClick) {
            onRowClick(order, "edit");
          }
        },
      });
      return;
    }
  } else {
    if (!order.luogoConsegna || !order.oraConsegna) {
      Modal.confirm({
        title: "Informazioni mancanti",
        content:
          "Luogo e/o orario di consegna non definiti. Vuoi modificare l'ordine ora?",
        okText: "Sì, modifica",
        cancelText: "Annulla",
        onOk: () => {
          if (onRowClick) {
            onRowClick(order, "edit");
          }
        },
      });
      return;
    }
  }

  // Proceed with normal assignment
  await performAssignment(order, rider, isPickupAssignment);
};

// Helper function to perform the actual assignment
const performAssignment = async (order: IOrder, rider: IUser, isPickupAssignment: boolean) => {
  const updatedOrder: Partial<IOrder> = {
    status: "Assegnato",
  };

  if (isPickupAssignment) {
    // ✅ Assigning pickup rider - only update pickup fields
    updatedOrder.ritiratoDa = rider.id;
    updatedOrder.pickupName = rider.displayName;
  } else {
    // ✅ Assigning delivery rider - only update delivery fields
    updatedOrder.consegnatoDa = rider.id;
    updatedOrder.deliveryName = rider.displayName;
  }

  try {
    console.log("🚀 [performAssignment] Assigning order with update:", {
      orderId: order.id,
      currentStatus: order.status,
      newStatus: updatedOrder.status,
      riderId: rider.id,
      riderName: rider.displayName,
      isPickup: isPickupAssignment,
      fullUpdate: updatedOrder,
    });

    await updateOrder(order.id as string, updatedOrder);

    console.log("✅ [performAssignment] Assignment API call completed");

    // ✅ OPTIMISTIC UPDATE
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === order.id 
          ? { ...o, ...updatedOrder } 
          : o
      )
    );

    const actionType = isPickupAssignment ? "ritiro" : "consegna";
    message.success(
      `Ordine assegnato a ${rider.displayName} per ${actionType}`
    );
  } catch (error) {
    message.error("Errore nell'assegnazione dell'ordine");
    console.error("❌ [performAssignment] Assignment error:", error);
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
        : riders.map((rider) => {
            const riderStatus = riderStatuses.get(rider.id);

            // ✅ Show busy indicator but DON'T disable assignment
            const isBusy = riderStatus?.isBusy ?? false;

            return {
              label: (
                <span
                  onClick={() => handleShare(rider, index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{rider.displayName}</span>
                  {isBusy && (
                    <Badge
                      status='processing'
                      text='Occupato'
                      style={{ marginLeft: 8, fontSize: 12 }}
                    />
                  )}
                </span>
              ),
              key: rider.id,
              disabled: false, // ✅ NEVER disabled - always assignable
            };
          }),
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
          Assegnato: "geekblue",
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
