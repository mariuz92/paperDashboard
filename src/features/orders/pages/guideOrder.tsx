import React, { useState } from "react";
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
} from "antd";
import { Timestamp } from "firebase/firestore";

import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { saveOrder } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

const { TextArea } = Input;
const { Title } = Typography;

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  useDocumentTitle(`Crea Ordine | ${CONFIG.appName}`);

  const onFinish = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      // Convert from Day.js to Firestore Timestamp (or null if not provided)
      const orarioConsegnaTimestamp = values.orarioConsegna
        ? Timestamp.fromDate(values.orarioConsegna.toDate())
        : null;

      const oraRitiroTimestamp = values.oraRitiro
        ? Timestamp.fromDate(values.oraRitiro.toDate())
        : null;

      // Build the IOrder object
      const newOrder: IOrder = {
        ...values,
        orarioConsegna: orarioConsegnaTimestamp,
        oraRitiro: oraRitiroTimestamp,
        status: "Presa in Carico", // Example default status
      };

      await saveOrder(newOrder);
      message.success("Ordine inserito con successo!");

      // Reset the form
      form.resetFields();
    } catch (error) {
      console.error("Errore nell'inserimento dell'ordine:", error);
      message.error("Errore nell'inserimento dell'ordine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      {/* --- SECTION: Informazioni generali --- */}
      <Title level={4}>Informazioni generali</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label='Nome Guida / Gruppo'
            name='nomeGuida'
            rules={[{ required: true, message: "Inserisci Nome Guida" }]}
          >
            <Input placeholder='Nome Guida' />
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
              placeholder='Radioline Consegnate'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/*
          // If you want to re-enable these fields, simply uncomment:
          <Col xs={24} md={4}>
            <Form.Item label="Extra" name="extra">
              <InputNumber placeholder="Radio Extra" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={4}>
            <Form.Item label="Saldo (€)" name="saldo">
              <InputNumber placeholder="Saldo (€)" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        */}
      </Row>

      {/* --- SECTION: Informazioni Consegna --- */}
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
            rules={[{ required: true, message: "Inserisci Luogo Consegna" }]}
          >
            <GooglePlacesAutocomplete
              initialValue=''
              placeholder='Inserisci Luogo Consegna'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoConsegna: address })
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item label='Ora e Data Ritiro' name='oraRitiro'>
            <DatePicker
              showTime
              placeholder='Seleziona Ora e Data Ritiro'
              format='YYYY-MM-DD HH:mm'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label='Luogo Ritiro' name='luogoRitiro'>
            <GooglePlacesAutocomplete
              initialValue=''
              placeholder='Inserisci Luogo Ritiro'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
            />
          </Form.Item>
        </Col>
      </Row>

      {/* --- SECTION: Note --- */}
      <Title level={4}>Note</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item label='Note' name='note'>
            <TextArea placeholder='Note' />
          </Form.Item>
        </Col>
      </Row>

      {/* --- SUBMIT BUTTON --- */}
      <Row>
        <Col xs={24} style={{ textAlign: "right" }}>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Inserisci Ordine
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default GuideOrderPage;
