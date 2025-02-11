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

import { getOrderById, updateOrder } from "../api/orderApi";
import { IOrder, IOrderStatus } from "../../../types/interfaces";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

const { TextArea } = Input;
const { Title } = Typography;

const RiderUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRadioSmarrite, setShowRadioSmarrite] = useState<boolean>(false);

  const queryParams = new URLSearchParams(location.search);
  const riderId = queryParams.get("riderId") || "";
  useDocumentTitle(`Rider | ${CONFIG.appName}`);
  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const fetchedOrder = await getOrderById(orderId, riderId);
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

    // Append the rider's name to the note
    const newNote = `Ordine per ${values.nomeGuida}: ${values.note}`;
    const updatedNote = order.note ? `${order.note}\n${newNote}` : newNote;

    // Convert Day.js objects to Firestore Timestamps (if provided)
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
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label='Nome Guida / Gruppo'
            name='nomeGuida'
            rules={[{ required: true, message: "Inserisci Nome Guida" }]}
          >
            <Input disabled placeholder='Nome Guida' />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item
            label='Canale Radio'
            name='canaleRadio'
            rules={[{ required: false }]}
          >
            <Input placeholder='Canale Radio' />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
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
        <Col xs={24} md={4}>
          <Form.Item label='Extra' name='extra' rules={[{ required: false }]}>
            <InputNumber placeholder='Radio Extra' style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
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
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label='Orario Consegna'
            name='orarioConsegna'
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              placeholder='Seleziona Orario Consegna'
              format='HH:mm'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
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
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
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
        <Col xs={24} md={12}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item label='Note' name='note'>
            <TextArea placeholder='Note' />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Form.Item label='Radio Smarrite ?'>
            <Switch
              checked={showRadioSmarrite}
              onChange={setShowRadioSmarrite}
            />
          </Form.Item>
        </Col>
        {showRadioSmarrite && (
          <Col xs={24} md={10}>
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
        <Col xs={24} style={{ textAlign: "right" }}>
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
