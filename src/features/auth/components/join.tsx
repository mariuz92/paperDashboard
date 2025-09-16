import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  notification,
  Card,
  Typography,
  Result,
  Spin,
} from "antd";
import { getInvitationByToken } from "../../users/api/invitationApi";
import { registerWithInvitation } from "../api/authApi";
import { LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import { db } from "../../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const { Title, Text } = Typography;

const JoinPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");

  const token = searchParams.get("token") || "";
  useDocumentTitle(`Unisciti | ${CONFIG.appName}`);

  // Load & validate invitation by token and resolve tenant/company name
  useEffect(() => {
    const run = async () => {
      if (!token) {
        setInviteError("Token di invito mancante nell'URL.");
        setChecking(false);
        return;
      }
      try {
        setChecking(true);
        // Expecting: { email, tenantId, role?, displayName? }
        const inv = await getInvitationByToken(token);

        form.setFieldsValue({
          email: inv.email,
          tenantId: inv.tenantId, // hidden field to keep it around if needed
          name: "",
        });

        // Resolve tenant/company name by ID for display
        if (inv.tenantId) {
          const tSnap = await getDoc(doc(db, "tenants", inv.tenantId));
          if (tSnap.exists()) {
            const t = tSnap.data() as any;
            setTenantName(t.name || inv.tenantId);
          } else {
            setTenantName(inv.tenantId); // fallback to id
          }
        }
      } catch (e: any) {
        setInviteError(e?.message || "Invito non valido.");
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [token, form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const { password, confirmPassword } = values;

      if (password !== confirmPassword) {
        notification.error({
          message: "Le password non coincidono",
          description: "Le password inserite non corrispondono.",
        });
        return;
      }

      // Token-driven registration: tenant & roles are enforced server-side from the invite
      await registerWithInvitation(token, password);

      notification.success({
        message: "Registrazione completata",
        description:
          "Il tuo account è stato creato con successo. Ora puoi accedere.",
      });

      // e.g., navigate("/login");
    } catch (error: any) {
      notification.error({
        message: "Registrazione fallita",
        description:
          error?.message ||
          "Si è verificato un errore durante la registrazione.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <Spin tip='Verifica invito in corso...' />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
        <Card style={{ width: 480, padding: 20 }}>
          <Result
            status='error'
            title='Invito non valido'
            subTitle={inviteError}
            extra={
              <Button type='primary' href='/auth/request-invite'>
                Richiedi un nuovo invito
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
      <Card style={{ width: 420, padding: 20 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Completa la tua registrazione
        </Title>

        <Form form={form} layout='vertical' onFinish={onFinish}>
          {/* Read-only info from invitation */}
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

          {/* Show the resolved company/tenant name (read-only) */}
          <Form.Item label='Azienda/Tenant'>
            <Input prefix={<SafetyOutlined />} value={tenantName} disabled />
          </Form.Item>

          {/* Keep tenantId around in the form if you need it later (hidden) */}
          <Form.Item name='tenantId' hidden>
            <Input />
          </Form.Item>

          {/* Optional: allow user to confirm/edit their display name */}
          <Form.Item name='name' label='Nome e Cognome'>
            <Input placeholder='Il tuo nome' />
          </Form.Item>

          {/* Password setup */}
          <Form.Item
            name='password'
            label='Password'
            rules={[
              { required: true, message: "Inserisci una password" },
              { min: 6, message: "Almeno 12 caratteri" },
              { pattern: /[A-Z]/, message: "Almeno una maiuscola (A–Z)" },
              { pattern: /[a-z]/, message: "Almeno una minuscola (a–z)" },
              { pattern: /[0-9]/, message: "Almeno una cifra (0–9)" },
              {
                pattern: /[!@#$%^&*()_\-+\[\]{};:'",.<>/?\\|`~]/,
                message: "Almeno un simbolo",
              },
              {
                validator: (_, value) =>
                  value && /\s/.test(value)
                    ? Promise.reject(
                        new Error("La password non può contenere spazi")
                      )
                    : Promise.resolve(),
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
            <Button type='primary' htmlType='submit' loading={loading} block>
              Registrati
            </Button>
          </Form.Item>

          <Text
            type='secondary'
            style={{ display: "block", textAlign: "center" }}
          >
            L’azienda è preassegnata dall’invito e non può essere modificata.
          </Text>
        </Form>
      </Card>
    </div>
  );
};

export default JoinPage;
