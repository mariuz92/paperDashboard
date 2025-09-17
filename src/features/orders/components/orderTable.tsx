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
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { FormInstance, MenuProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore"; // If you need to convert back to Timestamps
import { colors, IOrder, IOrderStatus } from "../../../types/interfaces";
import { updateOrder, deleteOrder } from "../api/orderApi";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IUser } from "../../../types/interfaces/IUser";
import { getUsers } from "../../users/api/userApi";
import "../../../shared/style.css";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { useNavigate } from "react-router";
import ManageChannels from "./manageChannels";
/** Helper: Safely convert a `Timestamp|string|undefined` to a Dayjs object. */
function dayjsValue(value?: Timestamp | string) {
  if (!value) {
    // Return an invalid Dayjs by passing an un-parseable string
    return dayjs("");
  }
  if (value instanceof Timestamp) {
    return dayjs(value.toDate());
  }
  return dayjs(value);
}

/** Helper: Format a `Timestamp|string` nicely for display in the table. */
function formatDateCell(value?: Timestamp | string) {
  const d = dayjsValue(value);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "";
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
  form: FormInstance; // <-- Must declare this!
}

/** Main props for OrderTable */
interface OrderTableProps {
  orders: IOrder[];
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
  loading: boolean;
  selectedDate: Dayjs;
  /**
   * onRowClick will be called when a row or its menu “Modifica” action is clicked.
   * The parent component can then open the unified OrderDrawer in either view or edit mode.
   */
  onRowClick?: (order: IOrder, mode?: "view" | "edit") => void;
}

/** Convert data to PDF (landscape) */
const exportToPDF = (orders: IOrder[]) => {
  const doc = new jsPDF("landscape");
  const columns = [
    { header: "Nome Guida", dataKey: "nomeGuida" },
    // { header: "Canale Radio", dataKey: "canaleRadio" },
    { header: "Orario Consegna", dataKey: "oraConsegna" },
    { header: "Luogo Consegna", dataKey: "luogoConsegna" },
    { header: "Ora Ritiro", dataKey: "oraRitiro" },
    { header: "Luogo Ritiro", dataKey: "luogoRitiro" },
    { header: "Radioguida", dataKey: "radioguideConsegnate" },
    { header: "Extra", dataKey: "extra" },
    { header: "Saldo", dataKey: "saldo" },
    { header: "Note", dataKey: "note" },
  ];

  const rows = orders.map((order) => ({
    nomeGuida: order.nomeGuida || "",
    canaleRadio: order.canaleRadio || "",
    oraConsegna: formatDateCell(order.oraConsegna),
    luogoConsegna: order.luogoConsegna || "",
    oraRitiro: formatDateCell(order.oraRitiro),
    luogoRitiro: order.luogoRitiro || "",
    radioguideConsegnate: order.radioguideConsegnate ?? 0,
    extra: order.extra ?? 0,
    saldo: order.saldo?.toFixed(2) ?? "0.00",
    note: order.note || "Nessuna nota",
    lost: order.lost ?? 0,
  }));

  autoTable(doc, { columns, body: rows, margin: { top: 20 } });
  const date = new Date().toLocaleDateString("it-IT");
  doc.save(`ordini_${date}.pdf`);
};

/**
 * Editable cell component
 */
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  col,
  dataIndex,
  title,
  inputType,
  children,
  form,
  ...restProps
}) => {
  const inputNode = (() => {
    switch (inputType) {
      case "select":
        return (
          <Select>
            <Select.Option value='Presa in Carico'>
              Presa in Carico
            </Select.Option>
            <Select.Option value='In Consegna'>In Consegna</Select.Option>
            <Select.Option value='Consegnato'>Consegnato</Select.Option>
            <Select.Option value='Attesa ritiro'>Attesa ritiro</Select.Option>
            <Select.Option value='In Ritiro'>In Ritiro</Select.Option>
            <Select.Option value='Ritirato'>Ritirato</Select.Option>
            <Select.Option value='Annullato'>Annullato</Select.Option>
          </Select>
        );
      case "number":
        return <InputNumber style={{ width: "100%" }} />;
      case "date":
        return (
          <DatePicker
            showTime
            style={{ width: "100%" }}
            format='YYYY-MM-DD hh-mm'
          />
        );
      case "places":
        // Use GooglePlacesAutocomplete for luogoConsegna/luogoRitiro
        const currentValue = form.getFieldValue(dataIndex);
        return (
          <GooglePlacesAutocomplete
            placeholder={title} // e.g. "Luogo Consegna" or "Luogo Ritiro"
            initialValue={currentValue}
            onPlaceSelect={(address: string) => {
              // Update this field in the Form
              form.setFieldsValue({ [dataIndex]: address });
            }}
          />
        );
      default:
        // "text"
        return <Input />;
    }
  })();

  const rules = col?.required
    ? [{ required: true, message: `Inserisci ${title}` }]
    : [];

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }} rules={rules}>
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

/**
 * Render the type of order with icons and/or text based on the logic:
 * 1. New Order (no `canaleRadio`)
 * 2. Delivered and Retrieved on the same day
 * 3. Only Delivered on the selected date
 * 4. Only Retrieved on the selected date
 */
function renderOrderTypeIcon(order: IOrder, selectedDate: Dayjs) {
  // 1) If no canaleRadio => New Order
  if (!order.canaleRadio) {
    return (
      <span title='Nuovo Ordine'>
        <Typography.Text>Nuovo</Typography.Text>
      </span>
    );
  }

  const consegnaDay = dayjsValue(order.oraConsegna);
  const ritiroDay = dayjsValue(order.oraRitiro);

  // 2) Both consegna and ritiro exist and are on the same day
  if (
    consegnaDay.isValid() &&
    ritiroDay.isValid() &&
    consegnaDay.isSame(ritiroDay, "day")
  ) {
    return (
      <span title='Consegna e Ritiro lo Stesso Giorno'>
        <Typography.Text>Consegna & Ritiro</Typography.Text>
      </span>
    );
  }

  // 3) Only oraConsegna is on the selected day
  if (
    consegnaDay.isValid() &&
    consegnaDay.isSame(selectedDate, "day") &&
    (!ritiroDay.isValid() || !ritiroDay.isSame(selectedDate, "day"))
  ) {
    return (
      <span title='Consegna in Questa Data'>
        <Typography.Text>Consegna</Typography.Text>
      </span>
    );
  }

  // 4) Only oraRitiro is on the selected day
  if (
    ritiroDay.isValid() &&
    ritiroDay.isSame(selectedDate, "day") &&
    (!consegnaDay.isValid() || !consegnaDay.isSame(selectedDate, "day"))
  ) {
    return (
      <span title='Ritiro in Questa Data'>
        {/* If you prefer to have an icon, uncomment the next line and ensure the icon is imported */}
        {/* <SwapLeftOutlined style={{ color: "red", marginRight: 4 }} /> */}
        <Typography.Text>Ritiro</Typography.Text>
      </span>
    );
  }

  // Default fallback: No special icon or label
  return <span>-</span>;
}

// put this near the top of the file (above OrderTable)
const getTenantIdFromStorage = (): string => {
  const raw = localStorage.getItem("tenantId");
  if (!raw) return "";
  // supports raw string or JSON string
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return String((parsed as any).id);
    }
    return String(parsed);
  } catch {
    return raw; // not JSON, plain string
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

    // optional: keep in sync if another tab changes it
    const onStorage = (e: StorageEvent) => {
      if (e.key === "tenantId") setTenantId(getTenantIdFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Helper: Format a `Timestamp|string` nicely for display in European format. */
  function formatDateCell(value?: Timestamp | string) {
    const d = dayjsValue(value);
    return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "";
  }

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
    const now = dayjs();
    const toleranceMinutes = 30;

    // Initialize new status and an object to hold updates
    let newStatus: IOrderStatus = order.status;
    let orderUpdates: Partial<IOrder> = {};

    // Check if delivery time exists and is already passed
    if (order.oraConsegna) {
      const deliveryTime = dayjs(
        order.oraConsegna.toDate
          ? order.oraConsegna.toDate()
          : order.oraConsegna
      );
      if (now.isAfter(deliveryTime)) {
        newStatus = "In Consegna";
        orderUpdates.consegnatoDa = rider.displayName;
      }
    }

    // Otherwise, check the pickup time condition
    if (order.oraRitiro && newStatus !== "In Consegna") {
      const pickupTime = dayjs(
        order.oraRitiro.toDate ? order.oraRitiro.toDate() : order.oraRitiro
      );
      // If the current time is within ±toleranceMinutes of the pickup time...
      if (Math.abs(pickupTime.diff(now, "minute")) <= toleranceMinutes) {
        newStatus = "In Ritiro";
        orderUpdates.ritiratoDa = rider.displayName;
      }
    }

    // Build the updated order object
    const updatedOrder: IOrder = {
      ...order,
      ...orderUpdates,
      status: newStatus,
    };

    // Update the order (assuming updateOrder is an async function)
    try {
      await updateOrder(order.id as string, updatedOrder);
      message.success("Ordine aggiornato con successo");
    } catch (error) {
      message.error("Failed to update order");
    }

    // Now build the share URL and message as before
    const encodedRider = encodeURIComponent(rider.id || "");
    const url = `${window.location.origin}/rider/${order.id}?riderId=${encodedRider}`;

    // Helper: Extract a short address from a full address string
    const shortAddress = (address: string | undefined) =>
      address ? address.split(",")[0] : "N/A";

    // Generate Google Maps directions links for delivery and pickup
    const googleMapsConsegna = order.luogoConsegna
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          order.luogoConsegna
        )}`
      : "N/A";

    const googleMapsRitiro = order.luogoRitiro
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          order.luogoRitiro
        )}`
      : "N/A";

    // Construct the WhatsApp message with order details and updated status
    const shareMessage = `🚀 *Ciao ${rider.displayName}!* 

📦 *Nuovo ordine assegnato a te!*

📋 *Dati Ordine*:
-----------------------------------
👤 *Nome Guida:* ${order.nomeGuida || "N/A"}
☎️ *Telefono Guida:* ${order.telefonoGuida || "N/A"}
📡 *Canale Radio:* ${order.canaleRadio || "N/A"}
📅 *Orario Consegna:* ${formatDateCell(order.oraConsegna) || "N/A"}

📍 *Consegna:* [${shortAddress(order.luogoConsegna)}](${googleMapsConsegna})
⏰ *Ora Ritiro:* ${formatDateCell(order.oraRitiro) || "N/A"}
🏠 *Ritiro:* [${shortAddress(order.luogoRitiro)}](${googleMapsRitiro})

🎧 *Radioguide Consegnate:* ${order.radioguideConsegnate ?? 0}
➕ *Extra:* ${order.extra ?? 0}
💰 *Saldo:* €${(order.saldo ?? 0).toFixed(2)}
📄 *Stato:* ${newStatus || "N/A"}
📝 *Note:* ${order.note || "Nessuna nota"}
-----------------------------------

🔗 *Aggiorna lo stato dell'ordine qui:* [🔄 Clicca qui](${url})

Grazie per la collaborazione! 💪`;

    // Encode the message and generate the WhatsApp link
    const encodedMessage = encodeURIComponent(shareMessage);
    const phoneNumber = rider.phoneNumber?.replace(/\D/g, "");
    const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

    window.open(whatsappLink, "_blank");
  };

  // Build the menu items for each row.
  // For "Modifica" we delegate to the parent's onRowClick callback (in "edit" mode).
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

  // Build columns
  const columns: ColumnType<IOrder>[] = [
    // {
    //   title: "Ordine",
    //   key: "tipoOrdine",
    //   render: (_, record) => renderOrderTypeIcon(record, selectedDate),
    //   width: 120,
    //   fixed: "left",
    // },
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
      width: 130,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      filters: [
        { text: "Presa in Carico", value: "Presa in Carico" },
        { text: "In Consegna", value: "In Consegna" },
        { text: "Consegnato", value: "Consegnato" },
        { text: "Ritirato", value: "Ritirato" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: IOrderStatus) => {
        const colors: Record<IOrderStatus, string> = {
          "In Consegna": "blue",
          "Presa in Carico": "gold",
          Consegnato: "green",
          "Attesa ritiro": "orange",
          Annullato: "red",
          "In Ritiro": "purple",
          Ritirato: "cyan",
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
      width: 160,
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
              onClick={() => clearFilters && clearFilters()}
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
      width: 160,
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
              onClick={() => clearFilters && clearFilters()}
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
          visible={open} // antd v2
          onClose={() => setOpen(false)}
          onSaved={() => {
            // optional: refresh page data
          }}
          // startFromZero={false}       // uncomment to switch to 1..N
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
        scroll={{ x: 1200, y: 2000 }}
      />
    </>
  );
};

export default OrderTable;
