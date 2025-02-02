import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Input, Button, notification, Card, Typography } from "antd";
import { validateInvitation } from "../../auth/api/invitationApi"; // Importa API per la validazione
import { LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import { registerWithInvitation, updateEmailVerified } from "../api/authApi";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

const { Title } = Typography;

const JoinPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [otpValid, setOtpValid] = useState(false);

  // Estrai i parametri dall'URL
  const email = searchParams.get("email") || "";
  const tenant = searchParams.get("tenant") || "";
  const otp = searchParams.get("otp") || "";
  useDocumentTitle(`Unisciti | ${CONFIG.appName}`);
  useEffect(() => {
    if (email && tenant && otp) {
      form.setFieldsValue({ email, tenant, otp });
    }
  }, [email, tenant, otp, form]);

  // Gestione della validazione dell'OTP
  const handleOtpValidation = async () => {
    try {
      setLoading(true);
      const otpValue = form.getFieldValue("otp");

      if (!otpValue || otpValue.length !== 6) {
        notification.error({
          message: "OTP non valido",
          description: "L'OTP deve essere di 6 cifre.",
        });
        setLoading(false);
        return;
      }

      const isValid = await validateInvitation(email, otpValue);

      if (isValid) {
        setOtpValid(true);
        notification.success({
          message: "OTP verificato",
          description: "Ora puoi completare la registrazione.",
        });

        // Aggiorna lo stato della verifica email
        await updateEmailVerified(email);
      } else {
        notification.error({
          message: "OTP non valido",
          description: "Inserisci un codice OTP valido.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Verifica fallita",
        description: "Si è verificato un errore nella verifica dell'OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestione della registrazione
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const { password, confirmPassword } = values;

      if (password !== confirmPassword) {
        notification.error({
          message: "Le password non coincidono",
          description: "Le password inserite non corrispondono.",
        });
        setLoading(false);
        return;
      }

      await registerWithInvitation(email, password, tenant);
      notification.success({
        message: "Registrazione completata",
        description: "Il tuo account è stato creato con successo.",
      });
    } catch (error) {
      notification.error({
        message: "Registrazione fallita",
        description: "Si è verificato un errore durante la registrazione.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <Card style={{ width: 400, padding: "20px" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Completa la tua registrazione
        </Title>
        <Form form={form} layout='vertical' onFinish={onFinish}>
          {!otpValid && (
            <>
              <Form.Item
                name='email'
                label='Email'
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "È richiesta un'email valida",
                  },
                ]}
              >
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Form.Item
                name='tenant'
                label='ID Tenant'
                rules={[
                  { required: true, message: "L'ID del tenant è richiesto" },
                ]}
              >
                <Input prefix={<SafetyOutlined />} disabled />
              </Form.Item>

              <Form.Item
                name='otp'
                label='Codice OTP'
                style={{ textAlign: "center" }}
                rules={[
                  { required: true, message: "L'OTP è richiesto" },
                  { len: 6, message: "L'OTP deve essere di 6 cifre" },
                ]}
              >
                <Input.OTP
                  length={6}
                  inputMode='numeric'
                  style={{ textAlign: "center" }}
                />
              </Form.Item>

              <Button
                type='primary'
                onClick={handleOtpValidation}
                loading={loading}
                block
              >
                Verifica OTP
              </Button>
            </>
          )}
          {otpValid && (
            <>
              <Form.Item
                name='password'
                label='Password'
                rules={[
                  { required: true, message: "Inserisci una password" },
                  {
                    min: 6,
                    message: "La password deve contenere almeno 6 caratteri",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Inserisci la tua password'
                />
              </Form.Item>

              <Form.Item
                name='confirmPassword'
                label='Conferma Password'
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Conferma la tua password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Le password non coincidono")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Conferma la tua password'
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  loading={loading}
                  block
                >
                  Registrati
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default JoinPage;
