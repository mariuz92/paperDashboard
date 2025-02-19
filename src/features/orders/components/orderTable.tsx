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
  Drawer,
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JSX } from "react/jsx-runtime";
import { IUser } from "../../../types/interfaces/IUser";
import { getUsers } from "../../users/api/userApi";
import "../../../shared/style.css";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { useNavigate } from "react-router";

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

/** Convert data to Excel sheet */
const exportToExcel = (orders: IOrder[]) => {
  const worksheet = XLSX.utils.json_to_sheet(orders);
  const workbook = XLSX.utils.book_new();
  const now = new Date();
  const formattedDate = now.toLocaleDateString("it-IT").replace(/\//g, "-"); // Format: DD-MM-YYYY
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, `ordini_${formattedDate}.xlsx`);
};

/** Convert data to PDF (landscape) */
const exportToPDF = (orders: IOrder[]) => {
  const doc = new jsPDF("landscape");
  const columns = [
    { header: "Nome Guida", dataKey: "nomeGuida" },
    // { header: "Canale Radio", dataKey: "canaleRadio" },
    { header: "Orario Consegna", dataKey: "orarioConsegna" },
    { header: "Luogo Consegna", dataKey: "luogoConsegna" },
    { header: "Ora Ritiro", dataKey: "oraRitiro" },
    { header: "Luogo Ritiro", dataKey: "luogoRitiro" },
    { header: "Radioguida", dataKey: "radiolineConsegnate" },
    { header: "Extra", dataKey: "extra" },
    { header: "Saldo", dataKey: "saldo" },
    { header: "Note", dataKey: "note" },
  ];

  const rows = orders.map((order) => ({
    nomeGuida: order.nomeGuida || "",
    canaleRadio: order.canaleRadio || "",
    orarioConsegna: formatDateCell(order.orarioConsegna),
    luogoConsegna: order.luogoConsegna || "",
    oraRitiro: formatDateCell(order.oraRitiro),
    luogoRitiro: order.luogoRitiro || "",
    radiolineConsegnate: order.radiolineConsegnate ?? 0,
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
            <Select.Option value="Presa in Carico">
              Presa in Carico
            </Select.Option>
            <Select.Option value="In Consegna">In Consegna</Select.Option>
            <Select.Option value="Consegnato">Consegnato</Select.Option>
            <Select.Option value="Attesa ritiro">Attesa ritiro</Select.Option>
            <Select.Option value="In Ritiro">In Ritiro</Select.Option>
            <Select.Option value="Ritirato">Ritirato</Select.Option>
            <Select.Option value="Annullato">Annullato</Select.Option>
          </Select>
        );
      case "number":
        return <InputNumber style={{ width: "100%" }} />;
      case "date":
        return (
          <DatePicker
            showTime
            style={{ width: "100%" }}
            format="YYYY-MM-DD hh-mm"
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
      <span title="Nuovo Ordine">
        <Typography.Text>Nuovo</Typography.Text>
      </span>
    );
  }

  const consegnaDay = dayjsValue(order.orarioConsegna);
  const ritiroDay = dayjsValue(order.oraRitiro);

  // 2) Both consegna and ritiro exist and are on the same day
  if (
    consegnaDay.isValid() &&
    ritiroDay.isValid() &&
    consegnaDay.isSame(ritiroDay, "day")
  ) {
    return (
      <span title="Consegna e Ritiro lo Stesso Giorno">
        <Typography.Text>Consegna & Ritiro</Typography.Text>
      </span>
    );
  }

  // 3) Only orarioConsegna is on the selected day
  if (
    consegnaDay.isValid() &&
    consegnaDay.isSame(selectedDate, "day") &&
    (!ritiroDay.isValid() || !ritiroDay.isSame(selectedDate, "day"))
  ) {
    return (
      <span title="Consegna in Questa Data">
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
      <span title="Ritiro in Questa Data">
        {/* If you prefer to have an icon, uncomment the next line and ensure the icon is imported */}
        {/* <SwapLeftOutlined style={{ color: "red", marginRight: 4 }} /> */}
        <Typography.Text>Ritiro</Typography.Text>
      </span>
    );
  }

  // Default fallback: No special icon or label
  return <span>-</span>;
}

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

  const handleNavigateToUsersPage = () => {
    navigate("/Collaboratori"); // Adjust the path as per your routing setup
  };

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

  const handleShare = (rider: IUser, index: number) => {
    const order = orders[index];
    const encodedRider = encodeURIComponent(rider.id || "");
    const url = `${window.location.origin}/rider/${order.id}?riderId=${encodedRider}`;

    // Extract short address (optional: modify if you have a structured address)
    const shortAddress = (address: string | undefined) =>
      address ? address.split(",")[0] : "N/A"; // Takes only the first part of the address

    // Generate Google Maps directions link for a smooth navigation experience
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

    // Construct the improved WhatsApp message
    const shareMessage = `🚀 *Ciao ${rider.displayName}!* 

📦 *Nuovo ordine assegnato a te!*

📋 *Dati Ordine*:
-----------------------------------
👤 *Nome Guida:* ${order.nomeGuida || "N/A"}
☎️ *Telefono Guida:* ${order.telefonoGuida || "N/A"}
📡 *Canale Radio:* ${order.canaleRadio || "N/A"}
📅 *Orario Consegna:* ${formatDateCell(order.orarioConsegna) || "N/A"}

📍 *Consegna:* [${shortAddress(order.luogoConsegna)}](${googleMapsConsegna})
⏰ *Ora Ritiro:* ${formatDateCell(order.oraRitiro) || "N/A"}
🏠 *Ritiro:* [${shortAddress(order.luogoRitiro)}](${googleMapsRitiro})

🎧 *Radioguide Consegnate:* ${order.radiolineConsegnate ?? 0}
➕ *Extra:* ${order.extra ?? 0}
💰 *Saldo:* €${(order.saldo ?? 0).toFixed(2)}
📄 *Stato:* ${order.status || "N/A"}
📝 *Note:* ${order.note || "Nessuna nota"}
-----------------------------------

🔗 *Aggiorna lo stato dell'ordine qui:* [🔄 Clicca qui](${url})

Grazie per la collaborazione! 💪`;

    // Encode message and generate WhatsApp link
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
          title="Sei sicuro di voler eliminare questo ordine?"
          onConfirm={() => order.id && handleDelete(order.id)}
          okText="Sì"
          cancelText="No"
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
    {
      title: "Ordine",
      key: "tipoOrdine",
      render: (_, record) => renderOrderTypeIcon(record, selectedDate),
      width: 120,
      fixed: "left",
    },
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
            placeholder="Cerca Nome Guida"
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
              type="primary"
              onClick={() => confirm()}
              size="small"
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
              size="small"
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
      width: 120,
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
      dataIndex: "orarioConsegna",
      key: "orarioConsegna",
      width: 150,
      sorter: (a, b) =>
        dayjsValue(a.orarioConsegna).valueOf() -
        dayjsValue(b.orarioConsegna).valueOf(),
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
            placeholder="Cerca Luogo Consegna"
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
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
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
            placeholder="Cerca Luogo Ritiro"
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
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
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
        <Row justify="center">
          <Button
            type="text"
            shape="circle"
            onClick={() => onRowClick && onRowClick(record, "view")}
          >
            <EyeOutlined style={{ marginRight: 4 }} />
          </Button>
          <Dropdown
            menu={{ items: getMenuItems(record, orders.indexOf(record)) }}
            trigger={["click"]}
          >
            <Button
              shape="circle"
              type="text"
              style={{ display: "flex", alignItems: "center" }}
              onClick={(e) => {
                e.stopPropagation();
              }}
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
          icon={<FileExcelOutlined />}
          onClick={() => exportToExcel(orders)}
          type="primary"
        >
          Esporta in Excel
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          onClick={() => exportToPDF(orders)}
          type="primary"
        >
          Esporta in PDF
        </Button>
      </Space>
      <Table<IOrder>
        bordered
        dataSource={orders}
        columns={columns}
        rowKey={(record) => record.id as string}
        loading={loading}
        scroll={{ x: 800 }}
      />
    </>
  );
};

export default OrderTable;
