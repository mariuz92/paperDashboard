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
  Result,
} from "antd";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // for navigation to register page
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";
import { saveOrder } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

import { omitKeys } from "../../../shared/utils/omitKeys";
import { ensureUserExists } from "../../users/api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import RegistrationCTA from "../components/registrationCTA";

const { TextArea } = Input;
const { Title, Text } = Typography;

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);

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

      // Prepare user details for checking or creating a user
      const userDetails: Omit<IUser, "id"> = {
        email: values.email,
        displayName: values.nomeGuida, // Assuming 'nomeGuida' is the display name
        emailVerified: false, // Default false unless verified externally
        phoneNumber: values.phone || "",
        photoURL: "",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        role: "guide",
        disabled: false,
        tenantId: "",
      };

      // Ensure the user exists before saving the order
      if (values.email || values.phone) {
        await ensureUserExists(userDetails);
      }

      // Create order object, but omit email (and possibly phone)
      const newOrder: IOrder = {
        ...omitKeys(values, ["email"]),
        telefonoGuida: values["phone"],
        orarioConsegna: orarioConsegnaTimestamp,
        oraRitiro: oraRitiroTimestamp,
        note: values["note"] ?? "",
        status: "Presa in Carico",
      };

      console.log("newOrder:", newOrder);
      await saveOrder(newOrder);
      message.success("Ordine inserito con successo!");

      // Instead of resetting the form immediately, show the success result screen.
      setOrderSubmitted(true);
      // Optionally, you could reset the form here if you plan on letting the user create a new order.
      // form.resetFields();
    } catch (error) {
      console.error("Errore nell'inserimento dell'ordine:", error);
      message.error("Errore nell'inserimento dell'ordine");
    } finally {
      setLoading(false);
    }
  };

  // Reset the process to allow a new order submission.
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
    <>
      {/* CTA: Shown only if registration data is not present */}
      <RegistrationCTA registrationData={registrationData} />
      <Form form={form} layout='vertical' onFinish={onFinish}>
        {/* --- SECTION: Informazioni generali --- */}
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
          <Col xs={24} md={8}>
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
