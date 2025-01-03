import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Drawer, FloatButton } from "antd";
import { IUser } from "../../../types/interfaces/IUser";
import { PlusOutlined, UserAddOutlined } from "@ant-design/icons";

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

  useEffect(() => {
    if (userToEdit) {
      form.setFieldsValue(userToEdit);
      setDrawerVisible(true);
    }
  }, [userToEdit, form]);

  const onFinish = (values: Omit<IUser, "id">) => {
    if (userToEdit) {
      updateUser(userToEdit.id, values);
    } else {
      addUser({
        ...values,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: false,
        disabled: false,
      });
    }
    form.resetFields();
    setDrawerVisible(false);
    setUserToEdit(null);
  };

  const showDrawer = () => {
    form.resetFields(); // Reset form fields when opening the drawer
    setDrawerVisible(true);
    setUserToEdit(null); // Ensure the form is in "add" mode
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
        title={userToEdit ? "Modifica Utente" : "Aggiungi Utente"}
        width={360}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
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
            ]}
          >
            <Input placeholder='Email' />
          </Form.Item>
          <Form.Item
            label='Numero di Telefono'
            name='phoneNumber'
            rules={[
              {
                required: true,
                message: "Per favore inserisci il numero di telefono",
              },
            ]}
          >
            <Input placeholder='Numero di Telefono' />
          </Form.Item>
          <Form.Item
            label='Ruolo'
            name='role'
            rules={[
              { required: true, message: "Per favore seleziona il ruolo" },
            ]}
          >
            <Select placeholder='Seleziona un ruolo'>
              <Select.Option value='admin'>Admin</Select.Option>
              <Select.Option value='rider'>Rider</Select.Option>
              <Select.Option value='guide'>Guida</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit'>
              {userToEdit ? "Modifica Utente" : "Aggiungi Utente"}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserForm;
