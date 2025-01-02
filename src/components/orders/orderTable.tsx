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
  Dropdown,
  Menu,
  Divider,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { MenuProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { IOrder, IOrderStatus } from "../../interfaces";
import { updateOrder, deleteOrder } from "../../api/orderApi";
import ConfirmationModal from "../shared/confirmationModal";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  ShareAltOutlined,
  SaveOutlined,
  CloseOutlined,
  MenuOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import * as XLSX from "xlsx";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JSX } from "react/jsx-runtime";

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
 * Props for the EditableCell:
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
    // { header: "Status", dataKey: "status" }, // commented out in your snippet
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
    note: order.note || "Nessuna nota",
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

/** Main OrderTable component */
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

  /** Enter edit mode for row */
  const handleEdit = (index: number) => {
    const rowData = { ...orders[index] };

    // Convert orarioConsegna and oraRitiro to Dayjs if they are strings
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

  /** Save updated row */
  const handleSave = async (index: number) => {
    try {
      const updatedRow = (await form.validateFields()) as Partial<IOrder>;

      // Convert dayjs back to string
      if (dayjs.isDayjs(updatedRow.orarioConsegna)) {
        updatedRow.orarioConsegna =
          updatedRow.orarioConsegna.format("YYYY-MM-DD");
      }
      if (dayjs.isDayjs(updatedRow.oraRitiro)) {
        updatedRow.oraRitiro = updatedRow.oraRitiro.format("YYYY-MM-DD");
      }

      // Remove undefined fields
      Object.entries(updatedRow).forEach(([k, v]) => {
        if (v === undefined) {
          delete updatedRow[k as keyof IOrder];
        }
      });

      const updatedOrders = [...orders];
      const mergedOrder = { ...updatedOrders[index], ...updatedRow };

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

  /** Confirm deletion */
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

  const riders = [
    { id: 1, name: "John Doe", cell: "3270149663" },
    { id: 2, name: "Jane Smith", cell: "987-654-3210" },
    { id: 3, name: "Alice Johnson", cell: "555-555-5555" },
  ];

  const handleShare = (
    rider: { id?: number; name: string; cell: string },
    index: number
  ) => {
    const order = orders[index];
    console.log(`Sharing order ${order.id} with ${rider.name} (${rider.cell})`);
    const url = `${window.location.origin}/rider/${order.id}`;
    // 1. Build your share message text
    // You can customize the message any way you need (e.g. using order data)
    const shareMessage = `Ciao ${rider.name}, ti invio i dettagli dell'ordine.

  Ecco le informazioni principali:
  - Nome Guida: ${order.nomeGuida || "N/A"}
  - Canale Radio: ${order.canaleRadio || "N/A"}
  - Orario Consegna: ${order.orarioConsegna || "N/A"}
  - Luogo Consegna: ${order.luogoConsegna || "N/A"}
  - Ora Ritiro: ${order.oraRitiro || "N/A"}
  - Luogo Ritiro: ${order.luogoRitiro || "N/A"}
  - Radioline Consegnate: ${order.radiolineConsegnate ?? 0}
  - Extra: ${order.extra ?? 0}
  - Saldo: €${(order.saldo ?? 0).toFixed(2)}
  - Status: ${order.status || "N/A"}
  - Note: ${order.note || "Nessuna nota"}
  
  Aggiorna l'ordine da qui: ${url}
  `;

    // 2. Encode the message for URLs
    const encodedMessage = encodeURIComponent(shareMessage);

    // 3. Construct the WhatsApp link
    // Use the rider's cell in international format (no "+" sign, no spaces)
    const phoneNumber = rider.cell.replace(/\D/g, ""); // remove non-digits if needed
    const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

    // 4. Open the link in a new tab
    window.open(whatsappLink, "_blank");
  };

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
      label: "Condividi",
      key: "share",
      icon: <ShareAltOutlined />,
      children: riders.map((rider) => ({
        label: (
          <span onClick={() => handleShare(rider, index)}>{rider.name}</span>
        ),
        key: rider.id,
      })),
    },
    {
      type: "divider",
    },
    {
      label: (
        <span onClick={() => showDeleteModal(index)}>
          <DeleteOutlined /> Elimina
        </span>
      ),
      key: "delete",
    },
  ];

  // Build columns (including fixed: "right" for the action column)
  const columns: EditableColumnType<IOrder>[] = [
    {
      title: "Nome Guida",
      dataIndex: "nomeGuida",
      key: "nomeGuida",
      editable: true,
      required: true,
      fixed: "left", // Pin this column to the left
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
      title: "Azione",
      key: "action",
      fixed: "right", // Pin this column to the right
      width: 120, // Example width, adjust as needed
      render: (_, __, index) => {
        const editing = isEditing(index);
        return editing ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-evenly",

              flexDirection: "row",
            }}
          >
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
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
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
          inputType = "date";
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
      <Table<IOrder>
        components={{
          body: {
            cell: (props: JSX.IntrinsicAttributes & EditableCellProps) => (
              <EditableCell {...props} />
            ),
          },
        }}
        bordered
        dataSource={orders}
        columns={mergedColumns}
        rowClassName='editable-row'
        rowKey={(record) => record.id as string}
        // pagination={{
        //   defaultPageSize: 25,
        //   pageSizeOptions: ["10", "25", "50", "100"],
        //   showSizeChanger: true,
        // }}
        loading={loading}
        virtual
        scroll={{ x: 3000, y: 4500 }} // Enable horizontal scrolling
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
