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
  Result,
} from "antd";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { saveOrder } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import { ensureUserExists } from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import RegistrationCTA from "../components/registrationCTA";

const { TextArea } = Input;
const { Title } = Typography;

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);

  useDocumentTitle(`Crea Ordine | ${CONFIG.appName}`);

  useEffect(() => {
    const storedData = localStorage.getItem("userInfo");
    const email = localStorage.getItem("email");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRegistrationData(parsedData);
        form.setFieldsValue({
          email: email || parsedData.email,
          phone: parsedData.phoneNumber,
          nomeGuida: parsedData.displayName,
        });
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }
  }, [form]);

  const onFinish = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      // Convert DatePicker to Timestamp for oraConsegna
      const oraConsegnaTimestamp = values.oraConsegna
        ? Timestamp.fromDate(values.oraConsegna.toDate())
        : null;

      // Convert DatePicker to Timestamp for oraRitiro
      const oraRitiroTimestamp = values.oraRitiro
        ? Timestamp.fromDate(values.oraRitiro.toDate())
        : null;

      // Prepare user details
      const userDetails: Omit<IUser, "id"> = {
        email: values.email,
        displayName: values.nomeGuida,
        emailVerified: false,
        phoneNumber: values.phone || null,
        photoURL: null,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        role: ["guide"],
        disabled: false,
        tenantId: "",
      };

      // Ensure user exists
      if (values.email || values.phone) {
        await ensureUserExists(userDetails);
      }

      // Create order object matching IOrder interface
      const newOrder: Omit<IOrder, "id"> = {
        nomeGuida: values.nomeGuida || undefined,
        telefonoGuida: values.phone || undefined,
        canaleRadio: undefined,
        oraConsegna: oraConsegnaTimestamp,
        luogoConsegna: values.luogoConsegna || undefined,
        oraRitiro: oraRitiroTimestamp,
        luogoRitiro: values.luogoRitiro || undefined,
        radioguideConsegnate: values.radioguideConsegnate || undefined,
        extra: undefined,
        saldo: undefined,
        status: "Presa in Carico",
        note: values.note || undefined,
        lost: undefined,
        consegnatoDa: undefined,
        ritiratoDa: undefined,
      };

      await saveOrder(newOrder);
      message.success("Ordine inserito con successo!");
      setOrderSubmitted(true);
    } catch (error) {
      console.error("Errore nell'inserimento dell'ordine:", error);
      message.error("Errore nell'inserimento dell'ordine");
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setOrderSubmitted(false);
    form.resetFields();
  };

  if (orderSubmitted) {
    return (
      <Result
        status='success'
        title='Ordine inserito con successo!'
        subTitle="Grazie per aver inserito l'ordine. Il sistema lo elaborerà a breve."
        extra={[
          <Button type='primary' key='new' onClick={handleNewOrder}>
            Inserisci un nuovo ordine
          </Button>,
          <Button
            key='external'
            onClick={() => (window.location.href = "https://www.youngtour.it")}
          >
            Vai su YoungTour
          </Button>,
        ]}
      />
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <RegistrationCTA registrationData={registrationData} />

      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Title level={4}>Informazioni generali</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='Email'
              name='email'
              rules={[
                { required: false, message: "Inserisci l'email" },
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
          <Col xs={24} md={12}>
            <Form.Item
              label='Radioguide'
              name='radioguideConsegnate'
              rules={[
                { required: true, message: "Inserisci Numero di Radioguide" },
              ]}
            >
              <InputNumber
                placeholder='Radioguide da Consegnare'
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Title level={4}>Informazioni Consegna</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label='Data e Ora Consegna'
              name='oraConsegna'
              rules={[
                { required: true, message: "Inserisci Data e Ora Consegna" },
              ]}
            >
              <DatePicker
                showTime
                placeholder='Seleziona Data e Ora Consegna'
                format='YYYY-MM-DD HH:mm'
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
            <Form.Item label='Data e Ora Ritiro' name='oraRitiro'>
              <DatePicker
                showTime
                placeholder='Seleziona Data e Ora Ritiro'
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

        <Title level={4}>Note</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item label='Note' name='note'>
              <TextArea placeholder='Note' rows={4} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col xs={24} style={{ textAlign: "right" }}>
            <Form.Item>
              <Button
                type='primary'
                htmlType='submit'
                loading={loading}
                size='large'
              >
                Inserisci Ordine
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default GuideOrderPage;
