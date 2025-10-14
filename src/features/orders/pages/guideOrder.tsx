import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  DatePicker,
  message,
  Typography,
  Result,
  Card,
  Space,
  Divider,
  Avatar,
  AutoComplete,
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
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  SendOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;

const countryCodes = [
  { code: "+39", country: "Italia", flag: "🇮🇹" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+49", country: "Germania", flag: "🇩🇪" },
  { code: "+34", country: "Spagna", flag: "🇪🇸" },
  { code: "+41", country: "Svizzera", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+86", country: "Cina", flag: "🇨🇳" },
  { code: "+81", country: "Giappone", flag: "🇯🇵" },
  { code: "+82", country: "Corea", flag: "🇰🇷" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+55", country: "Brasile", flag: "🇧🇷" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+27", country: "Sud Africa", flag: "🇿🇦" },
];

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);
  const [phonePrefix, setPhonePrefix] = useState<string>("+39");

  useDocumentTitle(`Prenota Servizio | ${CONFIG.appName}`);

  useEffect(() => {
    const storedData = localStorage.getItem("userInfo");
    const email = localStorage.getItem("email");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRegistrationData(parsedData);

        let phoneNumber = parsedData.phoneNumber || "";
        let prefix = "+39";

        if (phoneNumber) {
          const matchedPrefix = countryCodes.find((c) =>
            phoneNumber.startsWith(c.code)
          );
          if (matchedPrefix) {
            prefix = matchedPrefix.code;
            phoneNumber = phoneNumber.substring(prefix.length).trim();
          }
        }

        setPhonePrefix(prefix);
        form.setFieldsValue({
          email: email || parsedData.email,
          phonePrefix: prefix,
          phone: phoneNumber,
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
      const fullPhoneNumber =
        values.phonePrefix && values.phone
          ? `${values.phonePrefix} ${values.phone}`
          : values.phone;

      const oraConsegnaTimestamp = values.oraConsegna
        ? Timestamp.fromDate(values.oraConsegna.toDate())
        : null;

      const oraRitiroTimestamp = values.oraRitiro
        ? Timestamp.fromDate(values.oraRitiro.toDate())
        : null;

      if (!oraConsegnaTimestamp) {
        message.error("Data e ora di consegna sono obbligatorie");
        return;
      }

      const userDetails: Omit<IUser, "id"> = {
        email: values.email,
        displayName: values.nomeGuida,
        emailVerified: false,
        phoneNumber: fullPhoneNumber || null,
        photoURL: null,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        role: ["guide"],
        disabled: false,
        tenantId: "",
      };

      if (values.email || fullPhoneNumber) {
        await ensureUserExists(userDetails);
      }

      const newOrder: Omit<IOrder, "id"> = {
        nomeGuida: values.nomeGuida,
        telefonoGuida: fullPhoneNumber,
        canaleRadio: undefined,
        oraConsegna: oraConsegnaTimestamp,
        luogoConsegna: values.luogoConsegna,
        oraRitiro: oraRitiroTimestamp || null,
        luogoRitiro: values.luogoRitiro || null,
        radioguideConsegnate: values.radioguideConsegnate,
        extra: undefined,
        saldo: undefined,
        invoiceRequired: false,
        status: "Attesa ritiro",
        note: values.note || null,
        lost: undefined,
        consegnatoDa: undefined,
        ritiratoDa: undefined,
      };

      await saveOrder(newOrder);
      message.success("Prenotazione effettuata con successo!");
      setOrderSubmitted(true);
    } catch (error) {
      console.error("Errore nella prenotazione:", error);
      message.error("Errore nella prenotazione, riprova");
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setOrderSubmitted(false);
    form.resetFields();
    form.setFieldsValue({ phonePrefix: "+39" });
  };

  if (orderSubmitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <Card
          style={{
            maxWidth: 650,
            width: "100%",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
          bodyStyle={{ padding: "60px 40px" }}
        >
          <Result
            status='success'
            icon={
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                  borderRadius: "50%",
                  width: 120,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 64, color: "#fff" }} />
              </div>
            }
            title={
              <Title
                level={2}
                style={{ marginTop: 24, marginBottom: 16, fontSize: 28 }}
              >
                Prenotazione Confermata!
              </Title>
            }
            subTitle={
              <Text
                style={{
                  fontSize: 16,
                  color: "#595959",
                  display: "block",
                  lineHeight: 1.6,
                }}
              >
                La tua richiesta è stata ricevuta con successo. Il nostro team
                ti contatterà a breve per confermare i dettagli del servizio.
              </Text>
            }
            extra={[
              <Button
                type='primary'
                size='large'
                key='new'
                onClick={handleNewOrder}
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500,
                  minWidth: 180,

                  border: "none",
                }}
              >
                Nuova Prenotazione
              </Button>,
              <Button
                size='large'
                key='external'
                onClick={() =>
                  (window.location.href = "https://www.youngtour.it")
                }
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  minWidth: 180,
                }}
              >
                Torna al Sito
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header Card */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          background: " #8D9BB3FF ",
          border: "none",
        }}
        bodyStyle={{ padding: "32px 24px" }}
      >
        <div style={{ textAlign: "center" }}>
          <Avatar
            size={80}
            icon={<AudioOutlined />}
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              marginBottom: 16,
            }}
          />
          <Title
            level={1}
            style={{
              color: "#fff",
              marginBottom: 8,
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            Prenota il Servizio Radioguide
          </Title>
          <Text
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: 16,
              display: "block",
            }}
          >
            Compila il modulo per richiedere il servizio di radioguide per il
            tuo gruppo
          </Text>
        </div>
      </Card>

      {/* Main Form Card */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "40px" }}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          initialValues={{ phonePrefix: "+39" }}
          requiredMark='optional'
        >
          {/* Contact Information Section */}
          <div style={{ marginBottom: 48 }}>
            <Space align='center' style={{ marginBottom: 20 }}>
              <UserOutlined style={{ fontSize: 24, color: "#667eea" }} />
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#262626",
                }}
              >
                Informazioni di Contatto
              </Title>
            </Space>
            <Divider style={{ margin: "0 0 28px 0" }} />

            <Row gutter={[24, 20]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <MailOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Indirizzo Email
                    </span>
                  }
                  name='email'
                  rules={[
                    {
                      required: true,
                      message: "Per favore inserisci la tua email",
                    },
                    { type: "email", message: "Inserisci un'email valida" },
                  ]}
                >
                  <Input
                    placeholder='tuaemail@esempio.com'
                    size='large'
                    style={{ borderRadius: 8, fontSize: 15 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <PhoneOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Numero di Telefono
                    </span>
                  }
                  required
                >
                  <Input.Group compact style={{ display: "flex" }}>
                    <Form.Item
                      name='phonePrefix'
                      noStyle
                      rules={[
                        { required: true, message: "Prefisso richiesto" },
                      ]}
                    >
                      <AutoComplete
                        style={{ width: 110 }}
                        size='large'
                        onChange={(value) => setPhonePrefix(value)}
                        placeholder='+39'
                        options={countryCodes.map((country) => ({
                          value: country.code,
                          label: `${country.flag} ${country.code}`,
                        }))}
                        filterOption={(inputValue, option) =>
                          option?.value?.toString().includes(inputValue) ??
                          false
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      name='phone'
                      noStyle
                      rules={[
                        { required: true, message: "Inserisci il numero" },
                        {
                          pattern: /^[0-9\s]+$/,
                          message: "Solo numeri",
                        },
                      ]}
                    >
                      <Input
                        placeholder='123 456 7890'
                        size='large'
                        style={{ flex: 1, fontSize: 15 }}
                      />
                    </Form.Item>
                  </Input.Group>
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <UserOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Nome Guida / Gruppo
                    </span>
                  }
                  name='nomeGuida'
                  rules={[
                    {
                      required: true,
                      message: "Inserisci il nome della guida o gruppo",
                    },
                  ]}
                >
                  <Input
                    placeholder='Mario Rossi / Gruppo Turistico Roma'
                    size='large'
                    style={{ borderRadius: 8, fontSize: 15 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <AudioOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Numero di Radioguide
                    </span>
                  }
                  name='radioguideConsegnate'
                  rules={[
                    {
                      required: true,
                      message: "Inserisci il numero di radioguide",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder='Es: 20'
                    size='large'
                    style={{ width: "100%", borderRadius: 8, fontSize: 15 }}
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Delivery Information Section */}
          <div style={{ marginBottom: 48 }}>
            <Space align='center' style={{ marginBottom: 20 }}>
              <SendOutlined style={{ fontSize: 24, color: "#667eea" }} />
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#262626",
                }}
              >
                Informazioni Consegna
              </Title>
            </Space>
            <Divider style={{ margin: "0 0 28px 0" }} />

            <Row gutter={[24, 20]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <ClockCircleOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Data e Ora Consegna
                    </span>
                  }
                  name='oraConsegna'
                  rules={[
                    {
                      required: true,
                      message: "Seleziona data e ora di consegna",
                    },
                  ]}
                >
                  <DatePicker
                    showTime
                    placeholder='Seleziona data e ora'
                    format='DD/MM/YYYY HH:mm'
                    size='large'
                    style={{ width: "100%", borderRadius: 8, fontSize: 15 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <EnvironmentOutlined
                        style={{ marginRight: 8, color: "#667eea" }}
                      />
                      Luogo Consegna
                    </span>
                  }
                  name='luogoConsegna'
                  rules={[
                    {
                      required: true,
                      message: "Inserisci il luogo di consegna",
                    },
                  ]}
                >
                  <GooglePlacesAutocomplete
                    initialValue=''
                    placeholder='Inserisci indirizzo di consegna'
                    onPlaceSelect={(address) =>
                      form.setFieldsValue({ luogoConsegna: address })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Pickup Information Section */}
          <div style={{ marginBottom: 48 }}>
            <Space align='center' style={{ marginBottom: 12 }}>
              <EnvironmentOutlined style={{ fontSize: 24, color: "#764ba2" }} />
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#262626",
                }}
              >
                Informazioni Ritiro
              </Title>
            </Space>
            <Text
              type='secondary'
              style={{
                display: "block",
                marginBottom: 20,
                fontSize: 14,
                color: "#8c8c8c",
              }}
            >
              Opzionale - Compila solo se desideri programmare il ritiro delle
              radioguide
            </Text>
            <Divider style={{ margin: "0 0 28px 0" }} />

            <Row gutter={[24, 20]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <ClockCircleOutlined
                        style={{ marginRight: 8, color: "#764ba2" }}
                      />
                      Data e Ora Ritiro
                    </span>
                  }
                  name='oraRitiro'
                >
                  <DatePicker
                    showTime
                    placeholder='Seleziona data e ora'
                    format='DD/MM/YYYY HH:mm'
                    size='large'
                    style={{ width: "100%", borderRadius: 8, fontSize: 15 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#262626",
                      }}
                    >
                      <EnvironmentOutlined
                        style={{ marginRight: 8, color: "#764ba2" }}
                      />
                      Luogo Ritiro
                    </span>
                  }
                  name='luogoRitiro'
                >
                  <GooglePlacesAutocomplete
                    initialValue=''
                    placeholder='Inserisci indirizzo di ritiro'
                    onPlaceSelect={(address) =>
                      form.setFieldsValue({ luogoRitiro: address })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Notes Section */}
          <div style={{ marginBottom: 40 }}>
            <Space align='center' style={{ marginBottom: 20 }}>
              <FileTextOutlined style={{ fontSize: 24, color: "#667eea" }} />
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#262626",
                }}
              >
                Note Aggiuntive
              </Title>
            </Space>
            <Divider style={{ margin: "0 0 28px 0" }} />

            <Form.Item name='note'>
              <TextArea
                placeholder='Inserisci eventuali richieste speciali o informazioni aggiuntive che potrebbero esserci utili per il servizio...'
                rows={4}
                style={{ borderRadius: 8, fontSize: 15 }}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </div>

          {/* Submit Button */}
          <Row>
            <Col xs={24} style={{ textAlign: "center" }}>
              <Button
                type='primary'
                htmlType='submit'
                loading={loading}
                size='large'
                icon={<SendOutlined />}
                style={{
                  borderRadius: 10,
                  height: 56,
                  fontSize: 17,
                  fontWeight: 600,
                  minWidth: 280,

                  border: "none",
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
                }}
              >
                Invia Prenotazione
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 32, marginBottom: 16 }}>
        <Text style={{ color: "#8c8c8c", fontSize: 14 }}>
          © 2025 {CONFIG.appName}
        </Text>
      </div>
    </div>
  );
};

export default GuideOrderPage;
