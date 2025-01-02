import React, { useState } from "react";
import { Form, Input, Button, Select, Drawer, FloatButton } from "antd";
import { IUser } from "../../api/userInterface/IUser";
import { PlusOutlined, UserAddOutlined } from "@ant-design/icons";

interface UserFormProps {
  addUser: (user: Omit<IUser, "id">) => void;
}

const UserForm: React.FC<UserFormProps> = ({ addUser }) => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const onFinish = (values: Omit<IUser, "id">) => {
    addUser(values);
    form.resetFields();
    setDrawerVisible(false);
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
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
        title='Aggiungi Utente'
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
              Aggiungi Utente
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserForm;
