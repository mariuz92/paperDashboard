import React, { useState, useEffect } from "react";
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
  Card,
} from "antd";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // for navigation to register page
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { saveOrder } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import { InfoCircleOutlined, SettingOutlined } from "@ant-design/icons";
import Meta from "antd/es/card/Meta";

const { TextArea } = Input;
const { Title, Text } = Typography;

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const navigate = useNavigate();
  useDocumentTitle(`Crea Ordine | ${CONFIG.appName}`);

  // Check localStorage for registration data (e.g., saved during registration)
  useEffect(() => {
    const storedData = localStorage.getItem("userInfo");
    const email = localStorage.getItem("email");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setRegistrationData(parsedData);
      form.setFieldsValue({
        email: email,
        phone: parsedData.phone,
        role: parsedData.role,
        nomeGuida: parsedData.displayName,
        // If desired, you can also auto-fill the name if stored, e.g.:
        // nomeGuida: parsedData.nome,
      });
    }
  }, [form]);

  const onFinish = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      // Convert Day.js objects to Firestore Timestamps (if provided)
      const orarioConsegnaTimestamp = values.orarioConsegna
        ? Timestamp.fromDate(values.orarioConsegna.toDate())
        : null;

      const oraRitiroTimestamp = values.oraRitiro
        ? Timestamp.fromDate(values.oraRitiro.toDate())
        : null;

      // Build the IOrder object with all form values
      const newOrder: IOrder = {
        ...values,
        orarioConsegna: orarioConsegnaTimestamp,
        oraRitiro: oraRitiroTimestamp,
        status: "Presa in Carico", // Example default status
      };

      await saveOrder(newOrder);
      message.success("Ordine inserito con successo!");

      // Reset the form after successful submission
      form.resetFields();
    } catch (error) {
      console.error("Errore nell'inserimento dell'ordine:", error);
      message.error("Errore nell'inserimento dell'ordine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CTA: Shown only if registration data is not present */}
      {!registrationData && (
        <Row justify='start' style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card
              style={{
                border: `1px solid ${"#91d5ff"}`,
              }}
              actions={[
                <Button
                  key='register'
                  type='primary'
                  size='middle'
                  onClick={() => navigate("/register")}
                >
                  Registrati
                </Button>,
                <Text>Oppure</Text>,
                <Button
                  type='primary'
                  size='middle'
                  onClick={() => navigate("/login")}
                >
                  Accedi
                </Button>,
              ]}
            >
              <Meta
                avatar={<InfoCircleOutlined color='#91d5ff' />}
                title={
                  <Text strong style={{ fontSize: 16 }}>
                    Vuoi risparmiare tempo in futuro?
                  </Text>
                }
                description='Registrati per salvare le tue informazioni e velocizzare i prossimi ordini.'
              />
            </Card>
          </Col>
        </Row>
      )}

      <Form form={form} layout='vertical' onFinish={onFinish}>
        {/* --- SECTION: Informazioni generali --- */}
        <Title level={4}>Informazioni generali</Title>
        {/* New section for email and phone number */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='Email'
              name='email'
              rules={[
                { required: true, message: "Inserisci l'email" },
                { type: "email", message: "Inserisci un'email valida" },
              ]}
            >
              <Input placeholder='Email' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='Telefono'
              name='phone'
              rules={[
                { required: true, message: "Inserisci il numero di telefono" },
                { type: "number" },
              ]}
            >
              <Input placeholder='Numero di telefono' />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='Nome Guida / Gruppo'
              name='nomeGuida'
              rules={[{ required: true, message: "Inserisci Nome Guida" }]}
            >
              <Input placeholder='Nome Guida' />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label='Radioguide'
              name='RadioguideConsegnate'
              rules={[
                { required: true, message: "Inserisci Numero di Radioguide" },
              ]}
            >
              <InputNumber
                placeholder='Radioguide da Consegnare'
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
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

          <Col xs={24} md={16}>
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

          <Col xs={24} md={16}>
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
    </>
  );
};

export default GuideOrderPage;
