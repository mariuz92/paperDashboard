import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  Typography,
  Switch,
} from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getOrderById, updateOrder } from "../api/orderApi";
import { IOrder, IOrderStatus } from "../../../types/interfaces";
import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore"; // if you're storing Timestamps
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";

const { TextArea } = Input;
const { Title } = Typography;

const RiderUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRadioSmarrite, setShowRadioSmarrite] = useState<boolean>(false);

  const queryParams = new URLSearchParams(location.search);
  const riderName = queryParams.get("riderName") || "Rider Name";

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const fetchedOrder = await getOrderById(orderId);
      if (fetchedOrder) {
        setOrder(fetchedOrder);

        // Convert Firestore Timestamps into Day.js objects
        const orarioConsegnaDayjs = fetchedOrder.orarioConsegna
          ? dayjs(fetchedOrder.orarioConsegna.seconds * 1000)
          : null;

        const oraRitiroDayjs = fetchedOrder.oraRitiro
          ? dayjs(fetchedOrder.oraRitiro.seconds * 1000)
          : null;

        // Populate the form fields
        form.setFieldsValue({
          ...fetchedOrder,
          orarioConsegna: orarioConsegnaDayjs,
          oraRitiro: oraRitiroDayjs,
          // Make sure these are strings if your GPlaces component expects strings
          luogoConsegna: fetchedOrder.luogoConsegna || "",
          luogoRitiro: fetchedOrder.luogoRitiro || "",
        });
      }
    } catch (error) {
      message.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: Record<string, any>) => {
    if (!order) return;

    // 2. Use riderName from the query in your note
    const newNote = `${riderName}: ${values.note}`;
    const updatedNote = order.note ? `${order.note}\n${newNote}` : newNote;

    // Convert back to Firestore Timestamp if needed
    const orarioConsegnaTimestamp = values.orarioConsegna
      ? Timestamp.fromDate(values.orarioConsegna.toDate())
      : null;

    const oraRitiroTimestamp = values.oraRitiro
      ? Timestamp.fromDate(values.oraRitiro.toDate())
      : null;

    // Build updated order
    const updatedOrder: IOrder = {
      ...order,
      ...values,
      note: updatedNote,
      status: "Ritirato" as IOrderStatus,
      orarioConsegna: orarioConsegnaTimestamp,
      oraRitiro: oraRitiroTimestamp,
    };

    try {
      await updateOrder(order.id as string, updatedOrder);
      message.success("Ordine aggiornato con successo");
    } catch (error) {
      message.error("Failed to update order");
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      <Title level={4}>Informazioni Guida</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label='Nome Guida / Gruppo'
            name='nomeGuida'
            rules={[{ required: true, message: "Inserisci Nome Guida" }]}
          >
            <Input disabled placeholder='Nome Guida' />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Canale Radio'
            name='canaleRadio'
            rules={[{ required: false }]}
          >
            <Input placeholder='Canale Radio' />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Radioline'
            name='radiolineConsegnate'
            rules={[
              { required: true, message: "Inserisci Numero di Radioline" },
            ]}
          >
            <InputNumber
              disabled
              placeholder='Radioline Consegnate'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label='Extra' name='extra' rules={[{ required: false }]}>
            <InputNumber placeholder='Radio Extra' style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Saldo (€)'
            name='saldo'
            rules={[{ required: false }]}
          >
            <InputNumber placeholder='Saldo (€)' style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Consegna</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label='Orario Consegna'
            name='orarioConsegna'
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              disabled
              placeholder='Seleziona Orario Consegna'
              format='HH:mm'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/* Example of GooglePlacesAutocomplete for 'Luogo Consegna' */}
        <Col span={12}>
          <Form.Item
            label='Luogo Consegna'
            name='luogoConsegna'
            rules={[{ required: false }]}
          >
            <GooglePlacesAutocomplete
              initialValue={form.getFieldValue("luogoConsegna") ?? ""}
              placeholder='Inserisci Luogo Consegna'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoConsegna: address })
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Ritiro</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label='Ora e Data Ritiro'
            name='oraRitiro'
            rules={[{ required: true, message: "Inserisci Ora e Data Ritiro" }]}
          >
            <DatePicker
              showTime
              placeholder='Seleziona Ora e Data Ritiro'
              format='YYYY-MM-DD HH:mm'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/* 'Luogo Ritiro' text input instead of a second GooglePlacesAutocomplete */}
        <Col span={12}>
          <Form.Item
            label='Luogo Ritiro'
            name='luogoRitiro'
            rules={[{ required: true, message: "Inserisci Luogo Ritiro" }]}
          >
            <GooglePlacesAutocomplete
              initialValue={form.getFieldValue("luogoRitiro") ?? ""}
              placeholder='Inserisci Luogo Ritiro'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label='Note' name='note'>
            <TextArea placeholder='Note' />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={4}>
          <Form.Item label='Radio Smarrite'>
            <Switch
              checked={showRadioSmarrite}
              onChange={setShowRadioSmarrite}
            />
          </Form.Item>
        </Col>
        {showRadioSmarrite && (
          <Col span={10}>
            <Form.Item
              label='Numero di Radio Smarrite'
              name='radioSmarrite'
              rules={[
                {
                  required: showRadioSmarrite,
                  message: "Inserisci Numero di Radio Smarrite",
                },
              ]}
            >
              <InputNumber
                placeholder='Numero di Radio Smarrite'
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row>
        <Col span={24} style={{ textAlign: "right" }}>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Aggiorna Ordine
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default RiderUpdatePage;
