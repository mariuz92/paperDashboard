import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  DatePicker,
  TimePicker,
  message,
  Drawer,
  Typography,
  Select,
  Descriptions,
  FloatButton,
} from "antd";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import { IOrder } from "../../../types/interfaces/index";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { getUsers } from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import {
  CheckOutlined,
  EditFilled,
  PlusOutlined,
  RollbackOutlined,
  SaveFilled,
  SaveOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// Define the available modes
type Mode = "create" | "view" | "edit";

interface OrderDrawerProps {
  visible: boolean;
  mode: Mode;
  order?: IOrder; // Used in view/edit modes
  onClose: () => void;
  /**
   * onSubmit will be called with the processed order data.
   * The parent component can decide whether to call saveOrder (for create)
   * or updateOrder (for edit) based on the mode.
   */
  onSubmit: (
    orderData: Partial<IOrder>,
    mode: "create" | "edit"
  ) => Promise<void>;
}

const OrderDrawer: React.FC<OrderDrawerProps> = ({
  visible,
  mode,
  order,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [guides, setGuides] = useState<IUser[]>([]);
  const [isManualGuide, setIsManualGuide] = useState(false);

  // We'll use an internal state for mode so we can switch from view to edit
  const [currentMode, setCurrentMode] = useState<Mode>(mode);
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Fetch guides only in create/edit modes
  useEffect(() => {
    if (currentMode === "create" || currentMode === "edit") {
      const fetchGuides = async () => {
        try {
          const data = await getUsers("guide");
          setGuides(data);
        } catch (error) {
          console.error("Error fetching guides:", error);
          message.error("Impossibile recuperare le guide.");
        }
      };
      fetchGuides();
    }
  }, [currentMode]);

  // When the drawer opens or the mode/order changes, pre-populate or reset the form
  useEffect(() => {
    if ((currentMode === "edit" || currentMode === "view") && order) {
      form.setFieldsValue({
        ...order,
        // Convert Timestamps to dayjs objects for the pickers
        orarioConsegna: order.orarioConsegna
          ? dayjs(order.orarioConsegna.toDate())
          : undefined,
        oraRitiro: order.oraRitiro
          ? dayjs(order.oraRitiro.toDate())
          : undefined,
      });
    } else if (currentMode === "create") {
      form.resetFields();
    }
  }, [currentMode, order, form]);

  // Handle guide selection changes in create/edit modes
  const handleGuideChange = (value: string) => {
    if (value === "manual") {
      setIsManualGuide(true);
      form.setFieldsValue({
        nomeGuida: "",
        telefonoGuida: "",
      });
    } else {
      setIsManualGuide(false);
      const selectedGuide = guides.find((g) => g.id === value);
      if (selectedGuide) {
        form.setFieldsValue({
          nomeGuida: selectedGuide.displayName,
          telefonoGuida: selectedGuide.phoneNumber || "",
        });
      } else {
        form.setFieldsValue({
          nomeGuida: "",
          telefonoGuida: "",
        });
      }
    }
  };

  // Process the form submission: convert date/time fields & call onSubmit
  const handleFinish = async (values: any) => {
    // Process orarioConsegna (from TimePicker)
    let orarioConsegna: Timestamp | null = null;
    if (values.orarioConsegna) {
      const time = values.orarioConsegna; // dayjs object from TimePicker
      const mergedDateTime = dayjs()
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0);
      orarioConsegna = Timestamp.fromDate(mergedDateTime.toDate());
    }

    // Process oraRitiro (from DatePicker with time)
    let oraRitiro: Timestamp | null = null;
    if (values.oraRitiro) {
      oraRitiro = Timestamp.fromDate(values.oraRitiro.toDate());
    }

    if (!orarioConsegna) {
      message.error("Orario Consegna (Time) is required!");
      return;
    }

    const orderData: Partial<IOrder> = {
      nomeGuida: values.nomeGuida || "",
      telefonoGuida: values.telefonoGuida || "",
      canaleRadio: values.canaleRadio || "",
      orarioConsegna,
      luogoConsegna: values.luogoConsegna || "",
      oraRitiro: oraRitiro,
      luogoRitiro: values.luogoRitiro || "",
      saldo: values.saldo || 0,
      radiolineConsegnate: values.radiolineConsegnate || 0,
      extra: values.extra || 0,
      note: values.note || "",
      status: values.status || "Presa in Carico",
    };

    try {
      await onSubmit(orderData, currentMode === "create" ? "create" : "edit");
      message.success(
        currentMode === "create"
          ? "Ordine creato con successo!"
          : "Ordine aggiornato con successo!"
      );
      if (currentMode === "create") {
        form.resetFields();
      }
      onClose();
    } catch (error) {
      console.error("Errore durante l'invio dell'ordine:", error);
      message.error("Errore, riprova.");
    }
  };

  // Render a read-only view for the "view" mode

  const renderViewMode = () => (
    <div>
      <Descriptions
        bordered
        column={1}
        size="middle"
        style={{ backgroundColor: "#fafafa", padding: "24px", borderRadius: 4 }}
      >
        <Descriptions.Item label="Nome Guida">
          {order?.nomeGuida || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Telefono Guida">
          {order?.telefonoGuida || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {order?.status || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Canale Radio">
          {order?.canaleRadio || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Radioguide">
          {order?.radiolineConsegnate || 0}
        </Descriptions.Item>

        <Descriptions.Item label="Extra">{order?.extra || 0}</Descriptions.Item>
        <Descriptions.Item label="Saldo (€)">
          {order?.saldo || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Orario Consegna">
          {order?.orarioConsegna
            ? dayjs(order.orarioConsegna.toDate()).format("HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Luogo Consegna">
          {order?.luogoConsegna || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Data e Ora Ritiro">
          {order?.oraRitiro
            ? dayjs(order.oraRitiro.toDate()).format("YYYY-MM-DD HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Luogo Ritiro">
          {order?.luogoRitiro || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Note">{order?.note || "-"}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <FloatButton
          type="primary"
          icon={<EditFilled />}
          tooltip="Modifica Ordine"
          onClick={() => setCurrentMode("edit")}
        ></FloatButton>
      </div>
    </div>
  );

  // Render the form for create and edit modes
  const renderForm = () => (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {currentMode === "create" && (
        <Row gutter={16} style={{ paddingBottom: 24 }}>
          <Col span={12}>
            <Form.Item
              label="Seleziona Guida"
              name="guideSelection"
              rules={[
                {
                  required: true,
                  message: "Seleziona Guida o inserisci manualmente",
                },
              ]}
            >
              <Select
                style={{ width: "100%" }}
                placeholder="Seleziona o aggiungi manualmente"
                onChange={handleGuideChange}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {guides.map((guide) => (
                  <Select.Option key={guide.id} value={guide.id}>
                    {guide.displayName}
                  </Select.Option>
                ))}
                <Select.Option key="manual" value="manual">
                  ➕ Aggiungi Guida Manualmente
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Title level={4}>Informazioni Guida</Title>
      <Row gutter={16} style={{ paddingBottom: 24 }}>
        <Col span={12}>
          <Form.Item
            label="Nome Guida"
            name="nomeGuida"
            rules={[
              { required: true, message: "Inserisci il nome della guida" },
            ]}
          >
            <Input placeholder="Nome Guida" disabled={currentMode === "view"} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Telefono Guida" name="telefonoGuida">
            <Input
              placeholder="Telefono Guida"
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16} style={{ paddingBottom: 24 }}>
        <Col span={6}>
          <Form.Item label="Canale" name="canaleRadio">
            <Input
              placeholder="Canale Radio"
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label="Radioguide"
            name="radiolineConsegnate"
            rules={[
              { required: true, message: "Inserisci Numero di Radioguide" },
            ]}
          >
            <InputNumber
              placeholder="Radioguide Consegnate"
              style={{ width: "100%" }}
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Extra" name="extra">
            <InputNumber
              placeholder="Radio Extra"
              style={{ width: "100%" }}
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Saldo (€)" name="saldo">
            <InputNumber
              placeholder="Saldo (€)"
              style={{ width: "100%" }}
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Ordine</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Orario Consegna (Oggi)"
            name="orarioConsegna"
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              placeholder="Seleziona Orario Consegna"
              format="HH:mm"
              style={{ width: "100%" }}
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Luogo Consegna"
            name="luogoConsegna"
            rules={[{ required: true, message: "Inserisci Luogo Consegna" }]}
          >
            <GooglePlacesAutocomplete
              initialValue=""
              placeholder="Inserisci Luogo Consegna"
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoConsegna: address })
              }
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Data e Ora Ritiro" name="oraRitiro">
            <DatePicker
              showTime
              placeholder="Seleziona Ora e Data Ritiro"
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label="Luogo Ritiro" name="luogoRitiro">
            <GooglePlacesAutocomplete
              initialValue=""
              placeholder="Inserisci Luogo Ritiro"
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Note" name="note">
            <Input.TextArea
              placeholder="Note"
              disabled={currentMode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      {currentMode !== "view" && (
        <FloatButton.Group style={{ insetInlineEnd: 24 }}>
          {currentMode === "edit" ? (
            <>
              <FloatButton
                type="primary"
                icon={<SaveFilled />}
                onClick={() => form.submit()}
                tooltip="Aggiorna"
              />
              <FloatButton
                icon={<RollbackOutlined />}
                onClick={() => setCurrentMode("view")}
                tooltip="Annulla"
              />
            </>
          ) : (
            <FloatButton
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => form.submit()}
              tooltip="Crea Ordine"
            />
          )}
        </FloatButton.Group>
      )}
    </Form>
  );

  return (
    <Drawer
      title={
        currentMode === "create"
          ? "Crea Ordine"
          : currentMode === "edit"
          ? "Modifica Ordine"
          : "Dettagli Ordine"
      }
      width={720}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 80 }}
    >
      {currentMode === "view" ? renderViewMode() : renderForm()}
    </Drawer>
  );
};

export default OrderDrawer;
