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
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { FormInstance, MenuProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore"; // If you need to convert back to Timestamps
import { IOrder, IOrderStatus } from "../../../types/interfaces";
import { updateOrder, deleteOrder } from "../api/orderApi";
import {
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  SaveOutlined,
  CloseOutlined,
  MoreOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CarryOutOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  SendOutlined,
  RollbackOutlined,
  SwapRightOutlined,
  SwapOutlined,
  SwapLeftOutlined,
  IssuesCloseOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JSX } from "react/jsx-runtime";
import { IUser } from "../../../types/interfaces/IUser";
import { getUsers } from "../../users/api/userApi";
import "../../../shared/style.css";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";

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
}

/** Convert data to Excel sheet */
const exportToExcel = (orders: IOrder[]) => {
  const worksheet = XLSX.utils.json_to_sheet(orders);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, "orders.xlsx");
};

/** Convert data to PDF (landscape) */
const exportToPDF = (orders: IOrder[]) => {
  const doc = new jsPDF("landscape");
  const columns = [
    { header: "Nome Guida", dataKey: "nomeGuida" },
    { header: "Canale Radio", dataKey: "canaleRadio" },
    { header: "Orario Consegna", dataKey: "orarioConsegna" },
    { header: "Luogo Consegna", dataKey: "luogoConsegna" },
    { header: "Ora Ritiro", dataKey: "oraRitiro" },
    { header: "Luogo Ritiro", dataKey: "luogoRitiro" },
    { header: "Radioline", dataKey: "radiolineConsegnate" },
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
            <Select.Option value='Presa in Carico'>
              Presa in Carico
            </Select.Option>
            <Select.Option value='In Consegna'>In Consegna</Select.Option>
            <Select.Option value='Consegnato'>Consegnato</Select.Option>
            <Select.Option value='Ritirato'>Ritirato</Select.Option>
          </Select>
        );
      case "number":
        return <InputNumber style={{ width: "100%" }} />;
      case "date":
        return <DatePicker style={{ width: "100%" }} format='YYYY-MM-DD' />;
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
 * Decide which icon to render for "Tipo Ordine" based on your rules:
 *   1) If there's no canaleRadio => "New" icon
 *   2) If orarioConsegna and oraRitiro exist and are the same day => "same-day" icon
 *   3) If only orarioConsegna matches selectedDate => "deliver" icon
 *   4) If only oraRitiro matches selectedDate => "retrieve" icon
 *   (Adjust or add more rules as needed.)
 */
function renderOrderTypeIcon(order: IOrder, selectedDate: Dayjs) {
  // 1) If no canaleRadio => new
  if (!order.canaleRadio) {
    return (
      <span title='Nuovo Ordine'>
        <IssuesCloseOutlined style={{ color: "blue", fontSize: 18 }} />
      </span>
    );
  }

  const consegnaDay = dayjsValue(order.orarioConsegna);
  const ritiroDay = dayjsValue(order.oraRitiro);

  // Both exist and are the same day
  if (
    consegnaDay.isValid() &&
    ritiroDay.isValid() &&
    consegnaDay.isSame(ritiroDay, "day")
  ) {
    return (
      <span title='Consegna e ritiro lo stesso giorno'>
        <SwapOutlined style={{ color: "green", fontSize: 18 }} />
      </span>
    );
  }

  // Only orarioConsegna is the selected day
  if (
    consegnaDay.isValid() &&
    consegnaDay.isSame(selectedDate, "day") &&
    (!ritiroDay.isValid() || !ritiroDay.isSame(selectedDate, "day"))
  ) {
    return (
      <span title='Consegna in questa data'>
        <SwapRightOutlined style={{ fontSize: 18 }} />
      </span>
    );
  }

  // Only oraRitiro is the selected day
  if (
    ritiroDay.isValid() &&
    ritiroDay.isSame(selectedDate, "day") &&
    (!consegnaDay.isValid() || !consegnaDay.isSame(selectedDate, "day"))
  ) {
    return (
      <span title='Ritiro in questa data'>
        <SwapLeftOutlined style={{ fontSize: 18 }} />
      </span>
    );
  }

  // Default fallback: no special icon
  return <span>-</span>;
}

/** Main OrderTable component */
const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  setOrders,
  loading,
  selectedDate,
}) => {
  const [form] = Form.useForm();
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [riders, setRiders] = useState<IUser[]>([]);

  const isEditing = (index: number) => index === editingRowIndex;

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

  /** Enter edit mode for row */
  const handleEdit = (index: number) => {
    const rowData = { ...orders[index] };

    // Convert orarioConsegna and oraRitiro to Dayjs if they exist
    if (rowData.orarioConsegna) {
      rowData.orarioConsegna = dayjsValue(rowData.orarioConsegna);
    }
    if (rowData.oraRitiro) {
      rowData.oraRitiro = dayjsValue(rowData.oraRitiro);
    }

    form.setFieldsValue(rowData);
    setEditingRowIndex(index);
  };

  /** Cancel editing */
  const handleCancel = () => {
    setEditingRowIndex(null);
  };

  /** Helper: Format a `Timestamp|string` nicely for display in European format. */
  function formatDateCell(value?: Timestamp | string) {
    const d = dayjsValue(value);
    return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "";
  }

  /** Save updated row */
  const handleSave = async (index: number) => {
    try {
      const updatedRow = (await form.validateFields()) as Partial<IOrder>;

      // 1. If orarioConsegna is a Dayjs, convert it to a Firestore Timestamp.
      if (dayjs.isDayjs(updatedRow.orarioConsegna)) {
        const dayjsValue = updatedRow.orarioConsegna as Dayjs;
        updatedRow.orarioConsegna = Timestamp.fromDate(dayjsValue.toDate());
      }

      // 2. If oraRitiro is a Dayjs, convert it to a Firestore Timestamp.
      if (dayjs.isDayjs(updatedRow.oraRitiro)) {
        const dayjsValue = updatedRow.oraRitiro as Dayjs;
        updatedRow.oraRitiro = Timestamp.fromDate(dayjsValue.toDate());
      }

      // Remove any undefined fields
      Object.entries(updatedRow).forEach(([k, v]) => {
        if (v === undefined) {
          delete updatedRow[k as keyof IOrder];
        }
      });

      // Merge updated fields into the existing order
      const updatedOrders = [...orders];
      const mergedOrder = { ...updatedOrders[index], ...updatedRow };

      // Update Firestore
      await updateOrder(mergedOrder.id as string, updatedRow);

      // Update local state
      updatedOrders[index] = mergedOrder;
      setOrders(updatedOrders);

      setEditingRowIndex(null);
      message.success("Ordine salvato con successo!");
    } catch (error) {
      console.error("Error saving row:", error);
      message.error("Failed to save the order.");
    }
  };

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
    // console.log(
    //   `Sharing order ${order.id} with ${rider.displayName} (${rider.phoneNumber})`
    // );
    // 1. Encode rider name for use in the URL
    const encodedRiderName = encodeURIComponent(rider.displayName || "");

    // 2. Construct URL with query param for the rider name
    const url = `${window.location.origin}/rider/${order.id}?riderName=${encodedRiderName}`;

    // Build an engaging share message text
    const shareMessage = `🚀 Ciao ${rider.displayName}! 

Ti affido un nuovo ordine con i seguenti dettagli: 📦

📋 *Dati Ordine*:
-----------------------------------
👤 *Nome Guida:* ${order.nomeGuida || "N/A"}
📡 *Canale Radio:* ${order.canaleRadio || "N/A"}
📅 *Orario Consegna:* ${formatDateCell(order.orarioConsegna) || "N/A"}
📍 *Luogo Consegna:* ${order.luogoConsegna || "N/A"}
⏰ *Ora Ritiro:* ${formatDateCell(order.oraRitiro) || "N/A"}
🏠 *Luogo Ritiro:* ${order.luogoRitiro || "N/A"}
🎧 *Radioline Consegnate:* ${order.radiolineConsegnate ?? 0}
➕ *Extra:* ${order.extra ?? 0}
💰 *Saldo:* €${(order.saldo ?? 0).toFixed(2)}
📄 *Stato:* ${order.status || "N/A"}
📝 *Note:* ${order.note || "Nessuna nota"}
-----------------------------------

🔗 Aggiorna l'ordine direttamente qui: ${url}

Grazie per la collaborazione! 💪`;

    const encodedMessage = encodeURIComponent(shareMessage);
    const phoneNumber = rider.phoneNumber?.replace(/\D/g, "");
    const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    window.open(whatsappLink, "_blank");
  };

  /** Build the menu items (Edit, Share, Delete) */
  const getMenuItems = (index: number): MenuProps["items"] => [
    {
      label: (
        <span onClick={() => handleEdit(index)}>
          <EditOutlined /> Modifica
        </span>
      ),
      key: "edit",
    },
    {
      label: "Assegna a",
      key: "share",
      icon: <ShareAltOutlined />,
      children: riders.map((rider) => ({
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
    },
    {
      label: (
        <Popconfirm
          title='Sei sicuro di voler eliminare questo ordine?'
          onConfirm={() => orders[index].id && handleDelete(orders[index].id!)}
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
  const columns: EditableColumnType<IOrder>[] = [
    {
      title: "Ordine",
      key: "tipoOrdine",
      // no dataIndex, we compute it with render
      render: (_, record) => renderOrderTypeIcon(record, selectedDate),
      width: 80,
      fixed: "left",
    },
    {
      title: "Nome Guida",
      dataIndex: "nomeGuida",
      key: "nomeGuida",
      editable: true,
      required: true,
      fixed: "left",
      width: 220,
    },
    {
      title: "Canale Radio",
      dataIndex: "canaleRadio",
      key: "canaleRadio",
      editable: true,
    },
    {
      title: "Orario Consegna",
      dataIndex: "orarioConsegna",
      key: "orarioConsegna",
      editable: true,
      sorter: (a, b) =>
        dayjsValue(a.orarioConsegna).valueOf() -
        dayjsValue(b.orarioConsegna).valueOf(),
      render: (val) => formatDateCell(val),
    },
    {
      title: "Luogo Consegna",
      dataIndex: "luogoConsegna",
      key: "luogoConsegna",
      editable: true,
    },
    {
      title: "Ora Ritiro",
      dataIndex: "oraRitiro",
      key: "oraRitiro",
      editable: true,
      render: (val) => formatDateCell(val),
    },
    {
      title: "Luogo Ritiro",
      dataIndex: "luogoRitiro",
      key: "luogoRitiro",
      editable: true,
    },
    {
      title: "Radioline",
      dataIndex: "radiolineConsegnate",
      key: "radiolineConsegnate",
      editable: true,
      render: (val) => val ?? 0,
    },
    {
      title: "Extra",
      dataIndex: "extra",
      key: "extra",
      editable: true,
      render: (val) => val ?? 0,
    },
    {
      title: "Saldo (€)",
      dataIndex: "saldo",
      key: "saldo",
      editable: true,
      render: (val) => `€${(val ?? 0).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      editable: true,
      required: true,
      render: (status: IOrderStatus) => {
        const colors: Record<IOrderStatus, string> = {
          "In Consegna": "blue",
          "Presa in Carico": "gold",
          Consegnato: "green",
          Ritirato: "purple",
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      editable: true,
      render: (val) => val || "Nessuna nota",
    },
    {
      title: "Radio Perse",
      dataIndex: "lost",
      key: "lost",
      editable: true,
      render: (val) => val ?? 0,
    },
    {
      title: "Azione",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, __, index) => {
        const editing = isEditing(index);
        return editing ? (
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <Button
              type='default'
              onClick={() => handleSave(index)}
              icon={<SaveOutlined />}
            />
            <Button
              type='text'
              onClick={handleCancel}
              icon={<CloseOutlined />}
            />
          </div>
        ) : (
          <Dropdown menu={{ items: getMenuItems(index) }} trigger={["click"]}>
            <Button
              type='text'
              style={{ display: "flex", alignItems: "center" }}
            >
              Menu
              <MoreOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  // Merge columns for editable
  const mergedColumns: ColumnsType<IOrder> = columns.map((col) => {
    if (!col.editable) {
      return col as ColumnType<IOrder>;
    }

    return {
      ...col,
      onCell: (record: IOrder, index?: number) => {
        let inputType: "text" | "number" | "select" | "date" | "places" =
          "text";
        // Decide the input type based on dataIndex
        if (col.dataIndex === "status") {
          inputType = "select";
        } else if (
          ["saldo", "extra", "radiolineConsegnate"].includes(
            col.dataIndex as string
          )
        ) {
          inputType = "number";
        } else if (
          col.dataIndex === "orarioConsegna" ||
          col.dataIndex === "oraRitiro"
        ) {
          inputType = "date";
        } else if (
          col.dataIndex === "luogoConsegna" ||
          col.dataIndex === "luogoRitiro"
        ) {
          inputType = "places";
        }

        return {
          record,
          col,
          dataIndex: col.dataIndex!,
          title: String(col.title),
          editing: isEditing(index!),
          inputType,
          form,
        };
      },
    } as ColumnType<IOrder>;
  });

  return (
    <>
      <Space
        style={{ marginBottom: 16, display: "flex", justifyContent: "end" }}
      >
        <Button
          icon={<FileExcelOutlined />}
          onClick={() => exportToExcel(orders)}
          type='primary'
        >
          Esporta in Excel
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          onClick={() => exportToPDF(orders)}
          type='primary'
        >
          Esporta in PDF
        </Button>
      </Space>
      <Form form={form} component={false}>
        <Table<IOrder>
          components={{
            body: {
              cell: (props: JSX.IntrinsicAttributes & EditableCellProps) => (
                <EditableCell {...props} />
              ),
            },
          }}
          // rowClassName={(record) => {
          //   const selectedDateFormatted = selectedDate;

          //   // Safely check if orarioConsegna and oraRitiro exist before conversion
          //   const orarioConsegna = record.orarioConsegna
          //     ? dayjs(record.orarioConsegna.toDate())
          //     : null;
          //   const oraRitiro = record.oraRitiro
          //     ? dayjs(record.oraRitiro.toDate())
          //     : null;

          //   console.log("Selected Date:", selectedDateFormatted);
          //   console.log("Orario Consegna:", orarioConsegna);
          //   console.log("Ora Ritiro:", oraRitiro);

          //   // If both consegna and ritiro match the selected date, do not highlight
          //   if (
          //     selectedDateFormatted === orarioConsegna &&
          //     selectedDateFormatted === oraRitiro
          //   ) {
          //     console.log("No highlight - Both dates match selected date.");
          //     return "";
          //   }

          //   // If the selected date differs from either consegna or ritiro, highlight
          //   if (
          //     selectedDateFormatted !== orarioConsegna ||
          //     selectedDateFormatted == oraRitiro
          //   ) {
          //     console.log("Highlight row - Date mismatch found.");
          //     return "highlight-row";
          //   }

          //   return "";
          // }}
          virtual
          bordered
          dataSource={orders}
          columns={mergedColumns}
          rowKey={(record) => record.id as string}
          loading={loading}
          scroll={{ x: 3000, y: 4500 }} // Example large scroll area
        />
      </Form>
    </>
  );
};

export default OrderTable;
