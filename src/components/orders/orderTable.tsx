import React, { useState } from "react";
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
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { IOrder, IOrderStatus } from "../../interfaces";
import { updateOrder, deleteOrder } from "../../api/orderApi";
import ConfirmationModal from "../shared/confirmationModal";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

// For Excel, CSV, PDF exports
import * as XLSX from "xlsx";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Extended column type:
 * - `editable?: boolean` if cell is editable
 * - `required?: boolean` for validation
 */
interface EditableColumnType<T> extends ColumnType<T> {
  editable?: boolean;
  required?: boolean;
}

/**
 * Props for the EditableCell
 * - We allow "date" as an inputType for DatePicker
 */
interface EditableCellProps {
  editing: boolean;
  col?: EditableColumnType<IOrder>;
  dataIndex: keyof IOrder;
  title: string;
  inputType: "text" | "number" | "select" | "date";
  children: React.ReactNode;
}

/** Main props for OrderTable */
interface OrderTableProps {
  orders: IOrder[];
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
  loading: boolean;
}

/* -------------------- Export Helpers -------------------- */
const exportToExcel = (orders: IOrder[]) => {
  const worksheet = XLSX.utils.json_to_sheet(orders);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, "orders.xlsx");
};

const exportToPDF = (orders: IOrder[]) => {
  const doc = new jsPDF();

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
    { header: "Status", dataKey: "status" },
    { header: "Note", dataKey: "note" },
  ];

  const rows = orders.map((order) => ({
    nomeGuida: order.nomeGuida || "",
    canaleRadio: order.canaleRadio || "",
    orarioConsegna: order.orarioConsegna || "",
    luogoConsegna: order.luogoConsegna || "",
    oraRitiro: order.oraRitiro || "",
    luogoRitiro: order.luogoRitiro || "",
    radiolineConsegnate: order.radiolineConsegnate ?? 0,
    extra: order.extra ?? 0,
    saldo: order.saldo?.toFixed(2) ?? "0.00",
    // status: order.status,
    note: order.note || "Nessuna nota",
  }));

  autoTable(doc, { columns, body: rows, margin: { top: 20 } });
  doc.save("orders.pdf");
  const date = new Date().toLocaleDateString("it-IT");
  doc.save(`ordini_${date}.pdf`);
};

/* -------------------- EditableCell -------------------- */
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  col,
  dataIndex,
  title,
  inputType,
  children,
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
          </Select>
        );
      case "number":
        return <InputNumber style={{ width: "100%" }} />;
      case "date":
        // Use DatePicker for date fields
        return <DatePicker style={{ width: "100%" }} format='YYYY-MM-DD' />;
      default:
        return <Input />;
    }
  })();

  // Validation rules if required
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

/** -------------------- OrderTable -------------------- */
const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  setOrders,
  loading,
}) => {
  const [form] = Form.useForm();
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const isEditing = (index: number) => index === editingRowIndex;

  /** Enter edit mode */
  const handleEdit = (index: number) => {
    // Convert string date to Dayjs for orarioConsegna & oraRitiro
    const rowData = { ...orders[index] };

    if (typeof rowData.orarioConsegna === "string" && rowData.orarioConsegna) {
      rowData.orarioConsegna = dayjs(rowData.orarioConsegna, "YYYY-MM-DD");
    }
    if (typeof rowData.oraRitiro === "string" && rowData.oraRitiro) {
      rowData.oraRitiro = dayjs(rowData.oraRitiro, "YYYY-MM-DD");
    }

    form.setFieldsValue(rowData);
    setEditingRowIndex(index);
  };

  /** Cancel editing */
  const handleCancel = () => {
    setEditingRowIndex(null);
  };

  /** Save after validation */
  const handleSave = async (index: number) => {
    try {
      // Grab form fields
      const updatedRow = (await form.validateFields()) as Partial<IOrder>;

      // Convert Dayjs -> string
      if (dayjs.isDayjs(updatedRow.orarioConsegna)) {
        updatedRow.orarioConsegna =
          updatedRow.orarioConsegna.format("YYYY-MM-DD");
      }
      if (dayjs.isDayjs(updatedRow.oraRitiro)) {
        updatedRow.oraRitiro = updatedRow.oraRitiro.format("YYYY-MM-DD");
      }

      // Replace undefined => null or remove them
      Object.entries(updatedRow).forEach(([k, v]) => {
        if (v === undefined) {
          delete updatedRow[k as keyof IOrder];
        }
      });

      const updatedOrders = [...orders];
      const mergedOrder = { ...updatedOrders[index], ...updatedRow };

      // Update in Firestore
      await updateOrder(mergedOrder.id as string, updatedRow);

      updatedOrders[index] = mergedOrder;
      setOrders(updatedOrders);
      setEditingRowIndex(null);
      message.success("Order updated successfully!");
    } catch (error) {
      console.error("Error saving row:", error);
      message.error("Failed to save the order.");
    }
  };

  /** Show delete modal */
  const showDeleteModal = (index: number) => {
    setDeleteIndex(index);
    setIsModalVisible(true);
  };

  /** Confirm delete */
  const handleDelete = async () => {
    if (deleteIndex === null) return;
    try {
      const orderToDelete = orders[deleteIndex];
      await deleteOrder(orderToDelete.id as string);

      const updatedOrders = orders.filter((_, i) => i !== deleteIndex);
      setOrders(updatedOrders);

      setIsModalVisible(false);
      message.success("Order deleted successfully!");
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error("Failed to delete the order.");
    }
  };

  // Build CSV data
  const csvData = orders.map((o) => ({
    NomeGuida: o.nomeGuida || "",
    CanaleRadio: o.canaleRadio || "",
    OrarioConsegna: o.orarioConsegna || "",
    LuogoConsegna: o.luogoConsegna || "",
    OraRitiro: o.oraRitiro || "",
    LuogoRitiro: o.luogoRitiro || "",
    Radioline: o.radiolineConsegnate ?? 0,
    Extra: o.extra ?? 0,
    Saldo: (o.saldo ?? 0).toFixed(2),
    Status: o.status,
    Note: o.note || "Nessuna nota",
  }));

  // Define columns
  const columns: EditableColumnType<IOrder>[] = [
    {
      title: "Nome Guida",
      dataIndex: "nomeGuida",
      key: "nomeGuida",
      editable: true,
      required: true,
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
        new Date(a.orarioConsegna || "").getTime() -
        new Date(b.orarioConsegna || "").getTime(),
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
      title: "Azione",
      key: "action",
      render: (_, __, index) => {
        const editing = isEditing(index);
        return editing ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type='link' onClick={() => handleSave(index)}>
              Salva
            </Button>
            <Button type='link' onClick={handleCancel}>
              Annulla
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type='link'
              onClick={() => handleEdit(index)}
              disabled={editingRowIndex !== null}
            >
              <EditOutlined />
            </Button>
            <Button
              type='link'
              danger
              onClick={() => showDeleteModal(index)}
              style={{ marginLeft: 8 }}
            >
              <DeleteOutlined />
            </Button>
          </div>
        );
      },
    },
  ];

  const mergedColumns: ColumnsType<IOrder> = columns.map((col) => {
    if (!col.editable) {
      return col as ColumnType<IOrder>;
    }

    return {
      ...col,
      onCell: (record: IOrder, index?: number) => {
        let inputType: "text" | "number" | "select" | "date" = "text";

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
          inputType = "date"; // DatePicker for these fields
        }

        return {
          record,
          col,
          dataIndex: col.dataIndex,
          title: String(col.title),
          editing: isEditing(index!),
          inputType,
        };
      },
    } as ColumnType<IOrder>;
  }) as ColumnsType<IOrder>;

  return (
    <Form form={form} component={false}>
      {/* Export Buttons */}
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button
          type='primary'
          onClick={() => exportToPDF(orders)}
          style={{ marginRight: 8 }}
        >
          Esporta in PDF
        </Button>
        <Button
          type='primary'
          onClick={() => exportToExcel(orders)}
          style={{ marginRight: 8 }}
        >
          Esporta in Excel
        </Button>
        <CSVLink data={csvData} filename='orders.csv'>
          <Button type='primary'>Esporta in CSV</Button>
        </CSVLink>
      </div>

      <Table<IOrder>
        components={{
          body: {
            cell: (props: EditableCellProps) => <EditableCell {...props} />,
          },
        }}
        bordered
        dataSource={orders}
        columns={mergedColumns}
        rowClassName='editable-row'
        rowKey={(record) => record.id as string}
        pagination={{
          defaultPageSize: 25,
          pageSizeOptions: ["10", "25", "50", "100"],
          showSizeChanger: true,
        }}
        loading={loading}
      />

      <ConfirmationModal
        visible={isModalVisible}
        title='Conferma Eliminazione'
        content='Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata.'
        onConfirm={handleDelete}
        onCancel={() => setIsModalVisible(false)}
      />
    </Form>
  );
};

export default OrderTable;
