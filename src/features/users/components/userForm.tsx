import React, { useState, useEffect } from "react";
import { Form, Input, Button, Drawer, FloatButton, notification } from "antd";
import { IUser } from "../../../types/interfaces/IUser";
import { UserAddOutlined } from "@ant-design/icons";
import { sendInvitationEmail, storeInvitation } from "../api/invitationApi";
import { ensureUserExists } from "../api/userApi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebaseConfig";
import { Timestamp } from "firebase/firestore";

interface UserFormProps {
  addUser: (user: IUser) => void;
  updateUser: (id: string, user: Partial<IUser>) => Promise<void>;
  userToEdit?: IUser | null;
  setUserToEdit: (user: IUser | null) => void;
  userType: "rider" | "guide";
}

const UserForm: React.FC<UserFormProps> = ({
  addUser,
  updateUser,
  userToEdit,
  setUserToEdit,
  userType,
}) => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      form.setFieldsValue(userToEdit);
      setDrawerVisible(true);
    }
  }, [userToEdit, form]);

  const openNotification = (
    type: "success" | "error",
    message: string,
    description: string
  ) => {
    notification[type]({
      message,
      description,
      placement: "topRight",
    });
  };

  const getTenantId = (): string => {
    const raw = localStorage.getItem("tenantId");
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object" && "id" in parsed) {
        return String((parsed as any).id);
      }
      return String(parsed);
    } catch {
      return raw;
    }
  };

  // ✅ Create guide directly (no invitation)
  const handleCreateGuide = async (values: {
    email: string;
    displayName: string;
    phoneNumber?: string;
  }) => {
    const tenantId = getTenantId();

    if (!tenantId) {
      openNotification("error", "Errore", "Tenant ID mancante.");
      return;
    }

    setIsLoading(true);
    try {
      const newGuideData: Omit<IUser, "id"> = {
        email: values.email.trim().toLowerCase(),
        displayName: values.displayName.trim(),
        phoneNumber: values.phoneNumber?.trim() || null,
        photoURL: null,
        emailVerified: false,
        role: ["guide"], // ✅ Default role is guide
        disabled: false,
        tenantId: tenantId,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
      };

      const guideId = await ensureUserExists(newGuideData);

      // Add to local state
      addUser({
        ...newGuideData,
        id: guideId,
      } as IUser);

      openNotification(
        "success",
        "Guida creata",
        `La guida ${values.displayName} è stata creata con successo.`
      );

      form.resetFields();
      setDrawerVisible(false);
      setUserToEdit(null);
    } catch (error: any) {
      console.error("Errore creazione guida:", error);
      openNotification(
        "error",
        "Creazione fallita",
        error.message || "Non è stato possibile creare la guida."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Create rider via invitation
  const handleInviteRider = async (values: {
    email: string;
    displayName: string;
  }) => {
    const { email, displayName } = values;
    const tenantId = getTenantId();

    if (!tenantId) {
      openNotification("error", "Errore", "Tenant ID mancante.");
      return;
    }

    if (!email || !displayName) {
      openNotification(
        "error",
        "Dati mancanti",
        "Nome ed email sono obbligatori."
      );
      return;
    }

    setIsLoading(true);
    try {
      const token = await storeInvitation({
        email,
        tenantId,
        role: ["rider"],
      } as any);

      await sendInvitationEmail(email, token);

      openNotification(
        "success",
        "Invito inviato",
        `Abbiamo inviato un link di registrazione a ${email}.`
      );

      form.resetFields();
      setDrawerVisible(false);
      setUserToEdit(null);
    } catch (error) {
      console.error("Errore invito:", error);
      openNotification(
        "error",
        "Invio fallito",
        "Non è stato possibile inviare l'invito."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    try {
      const email = form.getFieldValue("email") || userToEdit?.email;
      if (!email) throw new Error("Email mancante");
      await sendPasswordResetEmail(auth, email);
      openNotification("success", "Reset inviato", `Email inviata a ${email}`);
    } catch (e: any) {
      openNotification(
        "error",
        "Errore reset",
        e.message || "Impossibile inviare il reset"
      );
    }
  };

  const handleUpdateUser = async (values: Partial<IUser>) => {
    if (userToEdit) {
      try {
        setIsLoading(true);
        await updateUser(userToEdit.id, values);

        openNotification(
          "success",
          "Utente Aggiornato",
          `${userType === "rider" ? "Il rider" : "La guida"} ${
            values.displayName || userToEdit.displayName
          } è stato aggiornato con successo.`
        );

        form.resetFields();
        setDrawerVisible(false);
        setUserToEdit(null);
      } catch (error) {
        console.error("Error updating user:", error);
        openNotification(
          "error",
          "Aggiornamento Fallito",
          "Si è verificato un errore durante l'aggiornamento. Riprova."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onFinish = async (values: any) => {
    if (userToEdit) {
      await handleUpdateUser(values);
    } else {
      // ✅ Different logic based on userType
      if (userType === "guide") {
        await handleCreateGuide(values);
      } else {
        await handleInviteRider(values);
      }
    }
  };

  const showDrawer = () => {
    form.resetFields();
    setDrawerVisible(true);
    setUserToEdit(null);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setUserToEdit(null);
  };

  const getTitle = () => {
    if (userToEdit) {
      return `Modifica ${userType === "rider" ? "Rider" : "Guida"}`;
    }
    return `Aggiungi ${userType === "rider" ? "Rider" : "Guida"}`;
  };

  const getSubmitButtonText = () => {
    if (userToEdit) {
      return `Modifica ${userType === "rider" ? "Rider" : "Guida"}`;
    }
    return userType === "guide" ? "Crea Guida" : "Invia Invito";
  };

  return (
    <>
      <FloatButton
        icon={<UserAddOutlined />}
        type='primary'
        onClick={showDrawer}
        style={{ position: "fixed", bottom: 24, right: 24 }}
        tooltip={getTitle()}
      />
      <Drawer
        title={getTitle()}
        width={400}
        onClose={closeDrawer}
        open={drawerVisible}
      >
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item
            label='Nome Completo'
            name='displayName'
            rules={[
              { required: true, message: "Per favore inserisci il nome" },
              { min: 2, message: "Il nome deve avere almeno 2 caratteri" },
            ]}
          >
            <Input placeholder='Es: Mario Rossi' />
          </Form.Item>

          <Form.Item
            label='Email'
            name='email'
            rules={[
              { required: false, message: "Per favore inserisci l'email" },
              {
                type: "email",
                message: "Per favore inserisci un'email valida",
              },
            ]}
          >
            <Input
              placeholder='email@esempio.com'
              disabled={!!userToEdit}
              type='email'
            />
          </Form.Item>

          {(userToEdit || userType === "guide") && (
            <Form.Item
              label='Numero di Telefono'
              name='phoneNumber'
              rules={[
                {
                  pattern: /^[0-9+\s()-]+$/,
                  message: "Numero non valido",
                },
              ]}
            >
              <Input placeholder='+39 123 456 7890' />
            </Form.Item>
          )}

          <Button type='primary' htmlType='submit' loading={isLoading} block>
            {getSubmitButtonText()}
          </Button>

          {userToEdit && (
            <Button
              block
              type='link'
              size='small'
              onClick={handleSendPasswordReset}
              style={{ marginTop: 8 }}
            >
              Invia reset password
            </Button>
          )}
        </Form>
      </Drawer>
    </>
  );
};

export default UserForm;
