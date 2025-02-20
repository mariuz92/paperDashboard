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
  Tooltip,
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
  SaveFilled,
  PlusOutlined,
  InfoCircleFilled,
} from "@ant-design/icons";
import { IOrderStatus } from "../../../types/interfaces/index";
import { useNavigate } from "react-router";

const { Title } = Typography;

// Define the available modes
type Mode = "create" | "view" | "edit";

interface OrderDrawerProps {
  visible: boolean;
  mode: Mode;
  order?: IOrder; // Used in view/edit modes
  onClose: () => void;
  /**
   * onModeChange allows the parent to update the mode (e.g., from "view" to "edit").
   */
  onModeChange: (mode: Mode) => void;
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

const orderStatuses: IOrderStatus[] = [
  "Presa in Carico",
  "In Consegna",
  "Consegnato",
  "Attesa ritiro",
  "In Ritiro",
  "Ritirato",
  "Annullato",
];

const OrderDrawer: React.FC<OrderDrawerProps> = ({
  visible,
  mode,
  order,
  onClose,
  onModeChange,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [guides, setGuides] = useState<IUser[]>([]);
  const [isManualGuide, setIsManualGuide] = useState(false);
  const [freeChannels, setFreeChannels] = useState<number[]>([]);
  const navigate = useNavigate(); // Initialize useNavigate
  // Load free channels from localStorage whenever the drawer is opened
  useEffect(() => {
    if (visible) {
      const storedFreeChannels = localStorage.getItem("freeChannels");
      if (storedFreeChannels) {
        try {
          const parsedChannels = JSON.parse(storedFreeChannels);
          setFreeChannels(parsedChannels);
        } catch (error) {
          console.error("Error parsing freeChannels from localStorage", error);
          setFreeChannels([]);
        }
      } else {
        setFreeChannels([]);
      }
    }
  }, [visible]);

  // When the drawer opens or the mode/order changes, pre-populate or reset the form.
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && order) {
      form.setFieldsValue({
        ...order,
        // Convert Timestamps to dayjs objects for DatePicker/TimePicker
        orarioConsegna: order.orarioConsegna
          ? dayjs(order.orarioConsegna.toDate())
          : undefined,
        oraRitiro: order.oraRitiro
          ? dayjs(order.oraRitiro.toDate())
          : undefined,
      });
    } else if (mode === "create") {
      form.resetFields();
    }
  }, [mode, order, form]);

  // Fetch guides only when in create or edit mode.
  useEffect(() => {
    if (mode === "create" || mode === "edit") {
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
  }, [mode]);

  // Handle guide selection changes in create/edit modes.
  const handleGuideChange = (value: string) => {
    if (value === "aggiungiGuida") {
      // Navigate to the user page to add a new guide
      navigate("/Collaboratori");
      return;
    }
    if (value === "") {
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

  // Process the form submission: convert date/time fields & call onSubmit.
  const handleFinish = async (values: any) => {
    let orarioConsegna: Timestamp | null = null;
    if (values.orarioConsegna) {
      const time = values.orarioConsegna;
      const mergedDateTime = dayjs()
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0);
      orarioConsegna = Timestamp.fromDate(mergedDateTime.toDate());
    }

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
      radioguideConsegnate: values.radioguideConsegnate || 0,
      extra: values.extra || 0,
      note: values.note || "",
      status: values.status || "Presa in Carico",
    };

    try {
      await onSubmit(orderData, mode === "create" ? "create" : "edit");
      message.success(
        mode === "create"
          ? "Ordine creato con successo!"
          : "Ordine aggiornato con successo!"
      );
      if (mode === "create") {
        form.resetFields();
      }
      onClose(); // Parent should reset the mode on close.
    } catch (error) {
      console.error("Errore durante l'invio dell'ordine:", error);
      message.error("Errore, riprova.");
    }
  };

  // Render a read-only view for the "view" mode.
  const renderViewMode = () => (
    <div>
      <Descriptions bordered column={1} size="small">
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
          {order?.radioguideConsegnate || 0}
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

        <Descriptions.Item label="Consegnato da">
          {order?.consegnatoDa || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Data e Ora Ritiro">
          {order?.oraRitiro
            ? dayjs(order.oraRitiro.toDate()).format("YYYY-MM-DD HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Luogo Ritiro">
          {order?.luogoRitiro || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Ritirato da">
          {order?.ritiratoDa || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Note">{order?.note || "-"}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        {/* Call parent's onModeChange to switch to edit mode */}
        <Button
          type="primary"
          icon={<EditFilled />}
          onClick={() => onModeChange("edit")}
        >
          Modifica
        </Button>
      </div>
    </div>
  );

  // Render the form for create and edit modes.
  const renderForm = () => (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {mode === "create" && (
        <Row gutter={16} style={{ paddingBottom: 8 }}>
          <Col span={12}>
            <Form.Item
              label="Seleziona Guida"
              name="guideSelection"
              rules={[
                {
                  required: false,
                  message: "Seleziona Guida o inserisci manualmente",
                },
              ]}
            >
              <Select
                style={{ width: "100%" }}
                placeholder="Seleziona "
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
                {/* <Select.Option key="aggiungiGuida" value="aggiungiGuida">
                  <PlusOutlined /> Aggiungi Guida
                </Select.Option> */}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}
      <Row>
        <Title level={4}>Informazioni Guida</Title>
        <Tooltip title="Puoi aggiungere la guida nella lista Collaboratori direttamente da questa schermata">
          <InfoCircleFilled style={{ marginLeft: 8, paddingBottom: 8 }} />
        </Tooltip>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Nome Guida"
            name="nomeGuida"
            rules={[
              { required: true, message: "Inserisci il nome della guida" },
            ]}
          >
            <Input placeholder="Nome Guida" disabled={mode === "view"} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Telefono Guida" name="telefonoGuida">
            <Input placeholder="Telefono Guida" disabled={mode === "view"} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16} style={{ paddingBottom: 24 }}>
        <Col span={6}>
          <Form.Item label="Canale" name="canaleRadio">
            <Select
              placeholder="Seleziona Canale Radio"
              disabled={mode === "view"}
            >
              {/* Map the free channels from localStorage */}
              {freeChannels.map((channel) => (
                <Select.Option key={channel} value={channel.toString()}>
                  {channel}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label="Radioguide"
            name="radioguideConsegnate"
            rules={[
              { required: true, message: "Inserisci Numero di Radioguide" },
            ]}
          >
            <InputNumber
              placeholder="Radioguide Consegnate"
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Extra" name="extra">
            <InputNumber
              placeholder="Radio Extra"
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Saldo (€)" name="saldo">
            <InputNumber
              placeholder="Saldo (€)"
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Ordine</Title>
      {mode === "edit" && (
        <Row>
          <Col span={8}>
            <Form.Item
              label="Stato Ordine"
              name="status"
              rules={[
                { required: false, message: "Seleziona lo stato dell'ordine" },
              ]}
            >
              <Select placeholder="Seleziona Stato">
                {/* If the current order status is not part of the predefined statuses, add it */}
                {order?.status && !orderStatuses.includes(order.status) && (
                  <Select.Option key={order.status} value={order.status}>
                    {order.status} (attuale)
                  </Select.Option>
                )}
                {orderStatuses.map((status) => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Orario Consegna (Oggi)"
            name="orarioConsegna"
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              placeholder="Inserisci Orario Consegna"
              format="HH:mm"
              style={{ width: "100%" }}
              disabled={mode === "view"}
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
              initialValue={
                form.getFieldValue("luogoConsegna") ??
                order?.luogoConsegna ??
                ""
              }
              placeholder="Inserisci Luogo Consegna"
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoConsegna: address })
              }
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Data e Ora Ritiro" name="oraRitiro">
            <DatePicker
              showTime
              placeholder="Inserisci Ora e Data Ritiro"
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label="Luogo Ritiro" name="luogoRitiro">
            <GooglePlacesAutocomplete
              initialValue={
                form.getFieldValue("luogoRitiro") ?? order?.luogoRitiro ?? ""
              }
              placeholder="Inserisci Luogo Ritiro"
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Note" name="note">
            <Input.TextArea placeholder="Note" disabled={mode === "view"} />
          </Form.Item>
        </Col>
      </Row>

      {mode !== "view" && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          {mode === "edit" ? (
            <Button
              type="primary"
              icon={<SaveFilled />}
              onClick={() => form.submit()}
            >
              Aggiorna
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => form.submit()}
            >
              Crea Ordine
            </Button>
          )}
        </div>
      )}
    </Form>
  );

  return (
    <Drawer
      title={
        mode === "create"
          ? "Crea Ordine"
          : mode === "edit"
          ? "Modifica Ordine"
          : "Dettagli Ordine"
      }
      width={720}
      onClose={onClose}
      open={visible}
    >
      {mode === "view" ? renderViewMode() : renderForm()}
    </Drawer>
  );
};

export default OrderDrawer;
