import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Drawer,
  FloatButton,
  notification,
} from "antd";
import { IUser } from "../../../types/interfaces/IUser";
import { MailOutlined, UserAddOutlined } from "@ant-design/icons";
import { generateOTP } from "../../../shared/utils/generateOTP";
import { sendInvitationEmail, storeInvitation } from "../api/invitationApi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebaseConfig";

interface UserFormProps {
  addUser: (user: Omit<IUser, "id">) => void;
  updateUser: (id: string, user: Partial<IUser>) => void;
  userToEdit?: IUser | null;
  setUserToEdit: (user: IUser | null) => void;
}

const UserForm: React.FC<UserFormProps> = ({
  addUser,
  updateUser,
  userToEdit,
  setUserToEdit,
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

  // Handle new user invitation
  // ⬇️ REPLACE handleNewUser with this version
  const handleNewUser = async (values: Omit<IUser, "id">) => {
    const { email, displayName, role } = values;
    const tenantId = localStorage.getItem("tenantId") || "";

    if (!tenantId) {
      openNotification("error", "Errore", "Tenant ID mancante.");
      return;
    }

    if (!email || !displayName || !role?.length) {
      openNotification(
        "error",
        "Dati mancanti",
        "Nome, email e ruolo sono obbligatori."
      );
      return;
    }

    setIsLoading(true);
    try {
      // 1) Crea invito (ritorna token)
      const token = await storeInvitation({
        email,
        tenantId,
        role, // preassegna i ruoli
      } as any); // tip match con IInvitation esteso

      // 2) Invia email con link /join?token=...
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

  // ⬆️ ADD inside the component (with other handlers)
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

  // Handle updating existing user
  const handleUpdateUser = async (values: Partial<IUser>) => {
    if (userToEdit) {
      try {
        setIsLoading(true);
        await updateUser(userToEdit.id, values);

        openNotification(
          "success",
          "Utente Aggiornato",
          `L'utente ${values.email} è stato aggiornato con successo.`
        );

        form.resetFields();
        setDrawerVisible(false);
        setUserToEdit(null);
      } catch (error) {
        console.error("Error updating user:", error);
        openNotification(
          "error",
          "Aggiornamento Fallito",
          "Si è verificato un errore durante l'aggiornamento dell'utente. Riprova."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle form submission
  const onFinish = async (values: Omit<IUser, "id">) => {
    if (userToEdit) {
      await handleUpdateUser(values);
    } else {
      await handleNewUser(values);
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

  return (
    <>
      <FloatButton
        icon={<UserAddOutlined />}
        type='primary'
        onClick={showDrawer}
        style={{ position: "fixed", bottom: 24, right: 24 }}
      />
      <Drawer
        title={userToEdit ? "Modifica Utente" : "Aggiungi Collaboratore"}
        width={360}
        onClose={closeDrawer}
        open={drawerVisible}
      >
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item
            label='Nome'
            name='displayName'
            rules={[
              { required: true, message: "Per favore inserisci il nome" },
            ]}
          >
            <Input placeholder='Nome' />
          </Form.Item>
          <Form.Item
            label='Email'
            name='email'
            rules={[
              { required: true, message: "Per favore inserisci l'email" },
              {
                type: "email",
                message: "Per favore inserisci un'email valida",
              },
            ]}
          >
            <Input placeholder='Email' />
          </Form.Item>

          {userToEdit && (
            <Form.Item
              label='Numero di Telefono'
              name='phoneNumber'
              rules={[
                {
                  required: false,
                  message: "Per favore inserisci il numero di telefono",
                },
              ]}
            >
              <Input placeholder='Numero di Telefono' />
            </Form.Item>
          )}
          <Form.Item
            label='Ruolo'
            name='role'
            rules={[
              { required: true, message: "Per favore seleziona il ruolo" },
            ]}
          >
            <Select
              mode='multiple'
              placeholder='Seleziona uno o più ruoli'
              allowClear
            >
              <Select.Option value='admin'>Admin</Select.Option>
              <Select.Option value='rider'>Rider</Select.Option>
              <Select.Option value='guide'>Guida</Select.Option>
            </Select>
          </Form.Item>

          <Button type='primary' htmlType='submit' loading={isLoading} block>
            {userToEdit ? "Modifica Utente" : "Invita"}
          </Button>

          {userToEdit && (
            <Button
              block
              type='link'
              size='small'
              onClick={handleSendPasswordReset}
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
