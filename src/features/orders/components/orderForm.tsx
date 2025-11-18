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
  Switch,
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
  InfoCircleFilled,
} from "@ant-design/icons";
import { IOrderStatus } from "../../../types/interfaces/index";
import { useNavigate } from "react-router";
import { syncChannelsAfterOrderChange } from "../helper/channelsSync";

const { Title } = Typography;

type Mode = "create" | "view" | "edit";

interface OrderDrawerProps {
  visible: boolean;
  mode: Mode;
  order?: IOrder;
  onClose: () => void;
  onModeChange: (mode: Mode) => void;
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
  const [freeChannels, setFreeChannels] = useState<number[]>(
    JSON.parse(localStorage.getItem("freeChannels") || "[]")
  );
  const navigate = useNavigate();

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

  // Load free channels from localStorage whenever the drawer is opened
  useEffect(() => {
    if (!visible) return;
    const tid = getTenantIdFromStorage();
    syncChannelsAfterOrderChange({
      tenantId: tid || undefined,
      setFreeChannels,
    });
  }, [visible]);

  // When the drawer opens or the mode/order changes, pre-populate or reset the form.
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && order) {
      form.setFieldsValue({
        ...order,
        // ✅ Ensure canaleRadio is always a string
        canaleRadio: order.canaleRadio ? String(order.canaleRadio) : undefined,
        invoiceRequired: order.invoiceRequired ?? false,

        // Convert Timestamps to dayjs objects for DatePicker/TimePicker
        oraConsegna: order.oraConsegna
          ? dayjs(order.oraConsegna.toDate())
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
    console.log("🔵 [handleFinish] Starting form submission", { mode, values });

    // Previous state for channel sync logic
    const prevStatus = order?.status ?? null;
    const prevChannelStr = order?.canaleRadio ?? undefined;
    const prevChannelNum = prevChannelStr ? Number(prevChannelStr) : undefined;

    // ✅ Build oraConsegna Timestamp
    let oraConsegna: Timestamp | null = null;
    if (values.oraConsegna) {
      const time = values.oraConsegna;

      if (mode === "edit" && order?.oraConsegna) {
        const originalDate = dayjs(order.oraConsegna.toDate());
        const mergedDateTime = originalDate
          .hour(time.hour())
          .minute(time.minute())
          .second(0)
          .millisecond(0);
        oraConsegna = Timestamp.fromDate(mergedDateTime.toDate());
      } else {
        const mergedDateTime = dayjs()
          .hour(time.hour())
          .minute(time.minute())
          .second(0)
          .millisecond(0);
        oraConsegna = Timestamp.fromDate(mergedDateTime.toDate());
      }
    }

    // ✅ Build oraRitiro Timestamp (or null if not provided)
    let oraRitiro: Timestamp | null = null;
    if (values.oraRitiro) {
      oraRitiro = Timestamp.fromDate(values.oraRitiro.toDate());
    }

    if (!oraConsegna) {
      message.error("Orario Consegna is required!");
      return;
    }

    // ✅ Ensure canaleRadio is always a string
    const selectedChannelStr: string = values.canaleRadio
      ? String(values.canaleRadio)
      : "";
    const selectedChannelNum = selectedChannelStr
      ? Number(selectedChannelStr)
      : undefined;

    // ✅ Build complete order data - PRESERVE rider assignments in edit mode
    const orderData: Partial<IOrder> = {
      // Guide information
      nomeGuida: values.nomeGuida || null,
      telefonoGuida: values.telefonoGuida || null,
      canaleRadio: selectedChannelStr,

      // Delivery information
      oraConsegna,
      luogoConsegna: values.luogoConsegna || null,

      // Pickup information
      oraRitiro,
      luogoRitiro: values.luogoRitiro || null,

      // Quantities and amounts
      radioguideConsegnate: values.radioguideConsegnate ?? null,
      extra: values.extra ?? null,
      saldo: values.saldo ?? null,
      invoiceRequired: values.invoiceRequired ?? null,
      lost: values.lost ?? null,

      // Status and notes
      status:
        values.status ||
        (mode === "edit" && order?.status) ||
        "Presa in Carico",
      note: values.note || null,
    };

    // ✅ CRITICAL: Only add rider fields if they have actual values (not undefined)
    if (mode === "edit" && order) {
      if (order.consegnatoDa !== undefined) {
        orderData.consegnatoDa = order.consegnatoDa;
      }
      if (order.deliveryName !== undefined) {
        orderData.deliveryName = order.deliveryName;
      }
      if (order.ritiratoDa !== undefined) {
        orderData.ritiratoDa = order.ritiratoDa;
      }
      if (order.pickupName !== undefined) {
        orderData.pickupName = order.pickupName;
      }
    }

    console.log("📦 [handleFinish] Order data prepared:", {
      orderData,
      mode,
      orderId: order?.id,
    });

    try {
      console.log("🚀 [handleFinish] Calling onSubmit...");
      await onSubmit(orderData, mode === "create" ? "create" : "edit");

      console.log("✅ [handleFinish] onSubmit successful");

      message.success(
        mode === "create"
          ? "Ordine creato con successo!"
          : "Ordine aggiornato con successo!"
      );

      // Channel sync logic
      const tid = getTenantIdFromStorage() || undefined;
      const newStatus = orderData.status;

      if (mode === "edit") {
        const becameRitirato =
          prevStatus !== "Ritirato" && newStatus === "Ritirato";
        const channelChanged =
          prevChannelStr !== undefined &&
          selectedChannelStr !== undefined &&
          prevChannelStr !== selectedChannelStr;

        if (becameRitirato) {
          await syncChannelsAfterOrderChange({
            tenantId: tid,
            free:
              typeof prevChannelNum === "number" &&
              !Number.isNaN(prevChannelNum)
                ? prevChannelNum
                : typeof selectedChannelNum === "number" &&
                  !Number.isNaN(selectedChannelNum)
                ? selectedChannelNum
                : null,
            setFreeChannels,
          });
        } else if (channelChanged) {
          await syncChannelsAfterOrderChange({
            tenantId: tid,
            free:
              typeof prevChannelNum === "number" &&
              !Number.isNaN(prevChannelNum)
                ? prevChannelNum
                : null,
            reserve:
              typeof selectedChannelNum === "number" &&
              !Number.isNaN(selectedChannelNum)
                ? selectedChannelNum
                : null,
            setFreeChannels,
          });
        } else {
          await syncChannelsAfterOrderChange({
            tenantId: tid,
            reserve:
              typeof selectedChannelNum === "number" &&
              !Number.isNaN(selectedChannelNum)
                ? selectedChannelNum
                : null,
            setFreeChannels,
          });
        }
      } else {
        // CREATE
        if (newStatus === "Ritirato") {
          await syncChannelsAfterOrderChange({
            tenantId: tid,
            free:
              typeof selectedChannelNum === "number" &&
              !Number.isNaN(selectedChannelNum)
                ? selectedChannelNum
                : null,
            setFreeChannels,
          });
        } else {
          await syncChannelsAfterOrderChange({
            tenantId: tid,
            reserve:
              typeof selectedChannelNum === "number" &&
              !Number.isNaN(selectedChannelNum)
                ? selectedChannelNum
                : null,
            setFreeChannels,
          });
        }
      }

      if (mode === "create") form.resetFields();
      onClose();
    } catch (error) {
      console.error(
        "❌ [handleFinish] Error durante l'invio dell'ordine:",
        error
      );

      // More detailed error message
      if (error instanceof Error) {
        console.error("❌ Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        message.error(`Errore: ${error.message}`);
      } else {
        console.error("❌ Unknown error:", error);
        message.error("Errore, riprova.");
      }
    }
  };
  // Render a read-only view for the "view" mode.
  const renderViewMode = () => (
    <div>
      <Descriptions bordered column={1} size='small'>
        <Descriptions.Item label='Nome Guida'>
          {order?.nomeGuida || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Telefono Guida'>
          {order?.telefonoGuida || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Status'>
          {order?.status || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Canale Radio'>
          {order?.canaleRadio || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Radioguide'>
          {order?.radioguideConsegnate ?? 0}
        </Descriptions.Item>
        <Descriptions.Item label='Extra'>{order?.extra ?? 0}</Descriptions.Item>
        <Descriptions.Item label='Fattura richiesta'>
          {order?.invoiceRequired ? "Sì" : "No"}
        </Descriptions.Item>

        <Descriptions.Item label='Saldo (€)'>
          {order?.saldo ?? 0}
        </Descriptions.Item>

        <Descriptions.Item label='Lost'>{order?.lost ?? 0}</Descriptions.Item>
        <Descriptions.Item label='Orario Consegna'>
          {order?.oraConsegna
            ? dayjs(order.oraConsegna.toDate()).format("HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Luogo Consegna'>
          {order?.luogoConsegna || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Consegnato da'>
          {order?.deliveryName || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Data e Ora Ritiro'>
          {order?.oraRitiro
            ? dayjs(order.oraRitiro.toDate()).format("YYYY-MM-DD HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Luogo Ritiro'>
          {order?.luogoRitiro || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Ritirato da'>
          {order?.pickupName || "-"}
        </Descriptions.Item>
        <Descriptions.Item label='Note'>{order?.note || "-"}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button
          type='primary'
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
    <Form form={form} layout='vertical' onFinish={handleFinish}>
      {mode === "create" && (
        <Row gutter={16} style={{ paddingBottom: 8 }}>
          <Col span={12}>
            <Form.Item label='Seleziona Guida' name='guideSelection'>
              <Select
                style={{ width: "100%" }}
                placeholder='Seleziona '
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
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}
      <Row>
        <Title level={4}>Informazioni Guida</Title>
        <Tooltip title='Puoi aggiungere la guida nella lista Collaboratori direttamente da questa schermata'>
          <InfoCircleFilled style={{ marginLeft: 8, paddingBottom: 8 }} />
        </Tooltip>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Nome Guida'
            name='nomeGuida'
            rules={[
              { required: true, message: "Inserisci il nome della guida" },
            ]}
          >
            <Input placeholder='Nome Guida' disabled={mode === "view"} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label='Telefono Guida' name='telefonoGuida'>
            <Input placeholder='Telefono Guida' disabled={mode === "view"} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16} style={{ paddingBottom: 24 }}>
        <Col span={6}>
          <Form.Item label='Canale' name='canaleRadio'>
            <Select
              placeholder='Seleziona Canale Radio'
              disabled={mode === "view"}
            >
              {freeChannels.map((ch) => (
                <Select.Option key={ch} value={String(ch)}>
                  {ch}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label='Radioguide'
            name='radioguideConsegnate'
            rules={[
              { required: true, message: "Inserisci Numero di Radioguide" },
            ]}
          >
            <InputNumber
              placeholder='Radioguide Consegnate'
              style={{ width: "100%" }}
              disabled={mode === "view"}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label='Extra' name='extra'>
            <InputNumber
              placeholder='Radio Extra'
              style={{ width: "100%" }}
              disabled={mode === "view"}
              min={0}
            />
          </Form.Item>
        </Col>
        {mode === "edit" && (
          <Col span={4}>
            <Form.Item label='Lost' name='lost'>
              <InputNumber
                placeholder='Lost'
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
        )}

        {/* ✅ Invoice Required Switch */}
        <Col span={mode === "edit" ? 4 : 4}>
          <Form.Item
            label='Fattura'
            name='invoiceRequired'
            valuePropName='checked'
          >
            <Switch
              checkedChildren='Sì'
              unCheckedChildren='No'
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>

        {/* ✅ Conditionally show Saldo based on invoiceRequired */}
        <Form.Item noStyle>
          <Col span={mode === "edit" ? 4 : 4}>
            <Form.Item label='Saldo (€)' name='saldo'>
              <InputNumber
                placeholder='Saldo (€)'
                style={{ width: "100%" }}
                disabled={mode === "view"}
              />
            </Form.Item>
          </Col>
        </Form.Item>
      </Row>

      <Title level={4}>Informazioni Ordine</Title>
      {mode === "edit" && (
        <Row>
          <Col span={8}>
            <Form.Item label='Stato Ordine' name='status'>
              <Select placeholder='Seleziona Stato'>
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
            label='Data e Orario Consegna '
            name='oraConsegna'
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <DatePicker
              showTime
              placeholder='Inserisci Orario Consegna'
              format='YYYY-MM-DD HH:mm'
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label='Luogo Consegna'
            name='luogoConsegna'
            rules={[{ required: true, message: "Inserisci Luogo Consegna" }]}
          >
            <GooglePlacesAutocomplete
              initialValue={
                form.getFieldValue("luogoConsegna") ??
                order?.luogoConsegna ??
                ""
              }
              placeholder='Inserisci Luogo Consegna'
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
          <Form.Item label='Data e Ora Ritiro' name='oraRitiro'>
            <DatePicker
              showTime
              placeholder='Inserisci Ora e Data Ritiro'
              format='YYYY-MM-DD HH:mm'
              style={{ width: "100%" }}
              disabled={mode === "view"}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label='Luogo Ritiro' name='luogoRitiro'>
            <GooglePlacesAutocomplete
              initialValue={
                form.getFieldValue("luogoRitiro") ?? order?.luogoRitiro ?? ""
              }
              placeholder='Inserisci Luogo Ritiro'
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
          <Form.Item label='Note' name='note'>
            <Input.TextArea placeholder='Note' disabled={mode === "view"} />
          </Form.Item>
        </Col>
      </Row>

      {mode !== "view" && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          {mode === "edit" ? (
            <Button
              type='primary'
              icon={<SaveFilled />}
              onClick={() => form.submit()}
            >
              Aggiorna
            </Button>
          ) : (
            <Button
              type='primary'
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
