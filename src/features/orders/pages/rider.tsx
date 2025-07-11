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
        const oraConsegnaDayjs = fetchedOrder.oraConsegna
          ? dayjs(fetchedOrder.oraConsegna.seconds * 1000)
          : null;
        const oraRitiroDayjs = fetchedOrder.oraRitiro
          ? dayjs(fetchedOrder.oraRitiro.seconds * 1000)
          : null;

        // Populate the form fields
        form.setFieldsValue({
          ...fetchedOrder,
          oraConsegna: oraConsegnaDayjs,
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

    const now = dayjs();
    const toleranceMinutes = 30; // tolerance for delivery status

    // Parse delivery time if available (from new values or existing order)
    const deliveryTime = values.oraConsegna
      ? dayjs(values.oraConsegna.toDate())
      : order.oraConsegna
      ? dayjs(
          order.oraConsegna.toDate
            ? order.oraConsegna.toDate()
            : order.oraConsegna
        )
      : null;

    // Parse pickup time (oraRitiro) if available (from new values or existing order)
    const updatedPickupTime = values.oraRitiro
      ? dayjs(values.oraRitiro.toDate())
      : order.oraRitiro
      ? dayjs(
          order.oraRitiro.toDate ? order.oraRitiro.toDate() : order.oraRitiro
        )
      : null;
    // Pickup location from new values or existing order
    const updatedPickupLocation = values.luogoRitiro || order.luogoRitiro;

    let newStatus: IOrderStatus = order.status;

    // If pickup information is provided or already exists
    if (updatedPickupTime && updatedPickupLocation) {
      // If the current time is after the scheduled pickup time,
      // mark the order as "Ritirato" regardless of the difference.
      if (now.isAfter(updatedPickupTime)) {
        newStatus = "Ritirato";
      } else {
        newStatus = "Attesa ritiro";
      }
    }
    // If no pickup info is available, use the delivery time (with tolerance) for "Consegnato"
    else if (deliveryTime) {
      if (
        now.isAfter(deliveryTime.subtract(toleranceMinutes, "minute")) &&
        now.isBefore(deliveryTime.add(toleranceMinutes, "minute"))
      ) {
        newStatus = "Consegnato";
      }
    }

    // Build the Firestore Timestamps for any updated fields
    const oraConsegnaTimestamp = values.oraConsegna
      ? Timestamp.fromDate(values.oraConsegna.toDate())
      : order.oraConsegna;
    const oraRitiroTimestamp = values.oraRitiro
      ? Timestamp.fromDate(values.oraRitiro.toDate())
      : order.oraRitiro;

    // Preserve or update the note as needed
    const updatedNote = order.note ?? "";

    // Build the updated order object
    const updatedOrder: IOrder = {
      ...order,
      ...values,
      note: updatedNote,
      status: newStatus,
      oraConsegna: oraConsegnaTimestamp,
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
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Title level={4}>Informazioni Guida</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Nome Guida / Gruppo"
            name="nomeGuida"
            rules={[{ required: true, message: "Inserisci Nome Guida" }]}
          >
            <Input disabled placeholder="Nome Guida" />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item
            label="Canale Radio"
            name="canaleRadio"
            rules={[{ required: false }]}
          >
            <Input disabled placeholder="Canale Radio" />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
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
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label="Extra" name="extra" rules={[{ required: false }]}>
            <InputNumber placeholder="Radio Extra" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item
            label="Saldo (€)"
            name="saldo"
            rules={[{ required: false }]}
          >
            <InputNumber placeholder="Saldo (€)" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Consegna</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Orario Consegna"
            name="oraConsegna"
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              placeholder="Seleziona Orario Consegna"
              format="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Luogo Consegna"
            name="luogoConsegna"
            rules={[{ required: false }]}
          >
            <GooglePlacesAutocomplete
              initialValue={form.getFieldValue("luogoConsegna") ?? ""}
              placeholder="Inserisci Luogo Consegna"
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
            label="Ora e Data Ritiro"
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
        <Col xs={24} md={12}>
          <Form.Item
            label="Luogo Ritiro"
            name="luogoRitiro"
            rules={[{ required: false, message: "Inserisci Luogo Ritiro" }]}
          >
            <GooglePlacesAutocomplete
              initialValue={form.getFieldValue("luogoRitiro") ?? ""}
              placeholder="Inserisci Luogo Ritiro"
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item label="Note" name="note">
            <TextArea placeholder="Note" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Form.Item label="Radio Smarrite ?">
            <Switch
              checked={showRadioSmarrite}
              onChange={setShowRadioSmarrite}
            />
          </Form.Item>
        </Col>
        {showRadioSmarrite && (
          <Col xs={24} md={10}>
            <Form.Item
              label="Numero di Radio Smarrite"
              name="radioSmarrite"
              rules={[
                {
                  required: showRadioSmarrite,
                  message: "Inserisci Numero di Radio Smarrite",
                },
              ]}
            >
              <InputNumber
                placeholder="Numero di Radio Smarrite"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row>
        <Col xs={24} style={{ textAlign: "right" }}>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Aggiorna Ordine
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default RiderUpdatePage;
