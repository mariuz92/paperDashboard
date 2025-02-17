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
  FloatButton,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

import { saveOrder } from "../api/orderApi"; // Firebase saveOrder function
import { IOrder } from "../../../types/interfaces/index";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { getUsers } from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import { Select } from "antd/lib";

const { Title } = Typography;

interface OrderFormProps {
  addOrder: (order: IOrder) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ addOrder }) => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);
  const [guides, setGuides] = useState<IUser[]>([]);
  // NEW: track whether we’re in “manual mode” (typing a new guide) or not
  const [isManualGuide, setIsManualGuide] = useState(false);
  /** Fetch all users with role = "guide" */
  useEffect(() => {
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
  }, []);
  /**
   * Handles form submission:
   *  - Converts time/date fields to Firestore Timestamps
   *  - Saves data to Firebase
   */
  const onFinish = async (values: Record<string, any>) => {
    // 1) Convert orarioConsegna (TimePicker) into a full Date, then to Timestamp
    //    We assume "today" as the date portion if you only have a TimePicker.
    //    If you want the user to pick an actual date, replace TimePicker with a DatePicker + showTime.
    let orarioConsegna: Timestamp | null = null;
    if (values.orarioConsegna) {
      // Dayjs time from TimePicker
      const time = values.orarioConsegna;
      // Merge today's date with the selected time
      const mergedDateTime = dayjs()
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0);
      orarioConsegna = Timestamp.fromDate(mergedDateTime.toDate());
    }

    // 2) Convert oraRitiro (DatePicker w/ time) to Timestamp
    let oraRitiro: Timestamp | null = null;
    if (values.oraRitiro) {
      // Dayjs date+time from DatePicker
      const dateTime = values.oraRitiro;
      oraRitiro = Timestamp.fromDate(dateTime.toDate());
    }

    // If either field is required, handle that here:
    if (!orarioConsegna) {
      message.error("Orario Consegna (Time) is required!");
      return;
    }

    // 3) Build the order object matching IOrder but with Timestamps
    const newOrder: Omit<IOrder, "id"> = {
      nomeGuida: values.nomeGuida || "",
      telefonoGuida: values.telefonoGuida || "",
      canaleRadio: values.canaleRadio || "",
      orarioConsegna,
      luogoConsegna: values.luogoConsegna || "",
      oraRitiro: oraRitiro || null,
      luogoRitiro: values.luogoRitiro || "",
      saldo: values.saldo || 0,
      radiolineConsegnate: values.radiolineConsegnate || 0,
      extra: values.extra || 0,
      note: values.note || "",
      status: "Presa in Carico", // Default status
    };

    try {
      // 4) Save the order to Firebase, then update local state
      const docId = await saveOrder(newOrder);
      message.success("Order saved successfully!");
      addOrder({ ...newOrder, id: docId });
      form.resetFields();
      closeDrawer();
    } catch (error) {
      message.error("Failed to save the order. Please try again.");
      console.error("Error saving order:", error);
    }
  };

  /**
   * Handler for guide selection changes in the Select.
   * If the user chooses “manual”, we let them type name & phone.
   * Otherwise we auto-fill from the chosen guide.
   */
  const handleGuideChange = (value: string) => {
    if (value === "manual") {
      // Switch to manual entry mode
      setIsManualGuide(true);
      // Clear out any auto-filled fields from a previous selection
      form.setFieldsValue({
        nomeGuida: "",
        telefonoGuida: "",
      });
    } else {
      // They picked an existing guide from the list
      setIsManualGuide(false);

      // Find the chosen guide object
      const selectedGuide = guides.find((g) => g.id === value);
      if (selectedGuide) {
        form.setFieldsValue({
          nomeGuida: selectedGuide.displayName,
          telefonoGuida: selectedGuide.phoneNumber || "",
        });
      } else {
        // Safety fallback
        form.setFieldsValue({
          nomeGuida: "",
          telefonoGuida: "",
        });
      }
    }
  };

  return (
    <>
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        onClick={showDrawer}
        style={{ position: "fixed", bottom: 24, right: 24 }}
      />
      <Drawer
        title="Crea Ordine"
        width={720}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ marginBottom: "20px" }}
        >
          {/* First Row */}
          <Title level={4}>Informazioni Guida</Title>
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
                  // only needed if you want custom filtering
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {/* Render known guides from fetch */}
                  {guides.map((guide) => (
                    <Select.Option key={guide.id} value={guide.id}>
                      {guide.displayName}
                    </Select.Option>
                  ))}

                  {/* Manual entry option */}
                  <Select.Option key="manual" value="manual">
                    ➕ Aggiungi Guida Manualmente
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              {/* Nome Guida (always displayed). If the user picked a known guide, it auto-fills (readOnly optional). */}
              <Form.Item
                label="Nome Guida"
                name="nomeGuida"
                rules={[
                  {
                    required: true,
                    message: "Inserisci il nome della guida",
                  },
                ]}
              >
                <Input
                  placeholder="Nome Guida"
                  // readOnly if not manual
                  readOnly={!isManualGuide}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} style={{ paddingBottom: 24 }}>
            <Col span={12}>
              <Form.Item
                label="Telefono Guida"
                name="telefonoGuida"
                rules={[{ required: false }]}
              >
                <Input
                  placeholder="Telefono Guida"
                  // readOnly if not manual
                  readOnly={!isManualGuide}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} style={{ paddingBottom: 24 }}>
            <Col span={6}>
              <Form.Item
                label="Canale"
                name="canaleRadio"
                rules={[{ required: false, message: "Inserisci Canale Radio" }]}
              >
                <Input placeholder="Canale Radio" />
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
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Extra"
                name="extra"
                rules={[
                  { required: false, message: "Inserisci Numero di Extra" },
                ]}
              >
                <InputNumber
                  placeholder="Radio Extra"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Saldo (€)"
                name="saldo"
                rules={[{ required: false, message: "Inserisci Saldo" }]}
              >
                <InputNumber
                  placeholder="Saldo (€)"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Second Row */}
          <Title level={4}>Informazioni Ordine</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Orario Consegna (Oggi)"
                name="orarioConsegna"
                rules={[
                  { required: true, message: "Inserisci Orario Consegna" },
                ]}
              >
                <TimePicker
                  placeholder="Seleziona Orario Consegna"
                  format="HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="Luogo Consegna"
                name="luogoConsegna"
                rules={[
                  { required: true, message: "Inserisci Luogo Consegna" },
                ]}
              >
                <GooglePlacesAutocomplete
                  initialValue=""
                  placeholder="Inserisci Luogo Consegna"
                  onPlaceSelect={(address) =>
                    form.setFieldsValue({ luogoConsegna: address })
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Data e Ora Ritiro"
                name="oraRitiro"
                rules={[
                  { required: false, message: "Inserisci Ora e Data Ritiro" },
                ]}
              >
                <DatePicker
                  showTime
                  placeholder="Seleziona Ora e Data Ritiro"
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="Luogo Ritiro"
                name="luogoRitiro"
                rules={[{ required: false, message: "Inserisci Luogo Ritiro" }]}
              >
                <GooglePlacesAutocomplete
                  initialValue=""
                  placeholder="Inserisci Luogo Ritiro"
                  onPlaceSelect={(address) =>
                    form.setFieldsValue({ luogoRitiro: address })
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Note"
                name="note"
                rules={[{ required: false, message: "Inserisci Note" }]}
              >
                <Input.TextArea placeholder="Note" />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Button */}
          <Row>
            <Col span={24} style={{ textAlign: "right" }}>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Aggiungi Ordine
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </>
  );
};

export default OrderForm;
