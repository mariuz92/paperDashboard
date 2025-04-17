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
import { UserAddOutlined } from "@ant-design/icons";
import { generateOTP } from "../../../shared/utils/generateOTP";
import { sendInvitationEmail, storeInvitation } from "../api/invitationApi";

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
  const handleNewUser = async (values: Omit<IUser, "id">) => {
    const { email, displayName, phoneNumber, role } = values;
    const tenantId = localStorage.getItem("tenantId") || "";

    if (!tenantId) {
      openNotification("error", "Error", "Tenant ID is missing.");
      return;
    }

    setIsLoading(true);

    try {
      if (role.includes("guide")) {
        // Generate OTP and process invitation only if role is NOT guide
        const otp = generateOTP();

        // Save invitation in Firestore
        await storeInvitation({ email, tenantId, otp });

        // Send invitation email
        await sendInvitationEmail(email, otp, tenantId);

        openNotification(
          "success",
          "Invito Inviato",
          `L'invito è stato inviato con successo a ${email}.`
        );
      }

      // Add the user regardless of the role
      addUser({
        ...values,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: false,
        disabled: false,
        role: role,
      });

      form.resetFields();
      setDrawerVisible(false);
      setUserToEdit(null);
    } catch (error) {
      console.error("Error sending invitation:", error);
      openNotification(
        "error",
        "Invio Fallito",
        "Si è verificato un errore durante l'invio dell'invito. Riprova."
      );
    } finally {
      setIsLoading(false);
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
        type="primary"
        onClick={showDrawer}
        style={{ position: "fixed", bottom: 24, right: 24 }}
      />
      <Drawer
        title={userToEdit ? "Modifica Utente" : "Aggiungi Collaboratore"}
        width={360}
        onClose={closeDrawer}
        open={drawerVisible}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nome"
            name="displayName"
            rules={[
              { required: true, message: "Per favore inserisci il nome" },
            ]}
          >
            <Input placeholder="Nome" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Per favore inserisci l'email" },
              {
                type: "email",
                message: "Per favore inserisci un'email valida",
              },
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            label="Numero di Telefono"
            name="phoneNumber"
            rules={[
              {
                required: true,
                message: "Per favore inserisci il numero di telefono",
              },
            ]}
          >
            <Input placeholder="Numero di Telefono" />
          </Form.Item>

          <Form.Item
            label="Ruolo"
            name="role"
            rules={[
              { required: true, message: "Per favore seleziona il ruolo" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Seleziona uno o più ruoli"
              allowClear
            >
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="rider">Rider</Select.Option>
              <Select.Option value="guide">Guida</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {userToEdit ? "Modifica Utente" : "Invita"}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserForm;
