import React, { useState } from "react";
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
  Drawer,
  FloatButton,
  Typography,
} from "antd";
import { ArrowRightOutlined, PlusOutlined } from "@ant-design/icons";
import { saveOrder } from "../api/orderApi"; // Firebase saveOrder function
import { IOrder } from "../../../types/interfaces/index";
const { Title } = Typography;

interface OrderFormProps {
  addOrder: (order: IOrder) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ addOrder }) => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  /**
   * Handles form submission.
   * Converts date/time fields to the required format and saves data to Firebase.
   */
  const onFinish = async (values: Record<string, any>) => {
    // Format date and time fields
    const orarioConsegna = values.orarioConsegna
      ? values.orarioConsegna.format("YYYY-MM-DD HH:mm")
      : null;
    const oraRitiro = values.oraRitiro
      ? values.oraRitiro.format("YYYY-MM-DD HH:mm")
      : null;

    if (!orarioConsegna || !oraRitiro) {
      message.error("Date fields are required!");
      return;
    }

    const formattedValues: Omit<IOrder, "id"> = {
      nomeGuida: values.nomeGuida || "", // Required
      canaleRadio: values.canaleRadio || "", // Required
      orarioConsegna, // Required
      luogoConsegna: values.luogoConsegna || "", // Required
      oraRitiro, // Required
      luogoRitiro: values.luogoRitiro || "", // Required
      saldo: values.saldo || 0, // Optional
      radiolineConsegnate: values.radiolineConsegnate || 0, // Optional
      extra: values.extra || 0, // Optional
      note: values.note || "", // Optional
      status: "Presa in Carico", // Default status
    };

    try {
      // Save the order and handle the response
      const docId = await saveOrder(formattedValues); // Save to Firebase
      message.success("Order saved successfully!");
      addOrder({ ...formattedValues, id: docId }); // Add the saved order locally
      form.resetFields(); // Reset the form fields after submission
      closeDrawer(); // Close the drawer after submission
    } catch (error) {
      message.error("Failed to save the order. Please try again.");
      console.error("Error saving order:", error);
    }
  };

  return (
    <>
      <FloatButton
        icon={<PlusOutlined />}
        type='primary'
        onClick={showDrawer}
        style={{ position: "fixed", bottom: 24, right: 24 }}
      />
      <Drawer
        title='Crea Ordine'
        width={720}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          style={{ marginBottom: "20px" }}
        >
          {/* First Row */}
          <Title level={4}>Informazioni Guida</Title>
          <Row gutter={16} style={{ paddingBottom: 24 }}>
            <Col span={12}>
              <Form.Item
                label='Nome Guida / Gruppo'
                name='nomeGuida'
                rules={[{ required: true, message: "Inserisci Nome Guida" }]}
              >
                <Input placeholder='Nome Guida' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label='Canale'
                name='canaleRadio'
                rules={[{ required: false, message: "Inserisci Canale Radio" }]}
              >
                <Input placeholder='Canale Radio' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label='Radioline'
                name='radiolineConsegnate'
                rules={[
                  { required: true, message: "Inserisci Numero di Radioline" },
                ]}
              >
                <InputNumber
                  placeholder='Radioline Consegnate'
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label='Extra'
                name='extra'
                rules={[
                  { required: false, message: "Inserisci Numero di Extra" },
                ]}
              >
                <InputNumber
                  placeholder='Radio Extra'
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label='Saldo (€)'
                name='saldo'
                rules={[{ required: false, message: "Inserisci Saldo" }]}
              >
                <InputNumber
                  placeholder='Saldo (€)'
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Second Row */}
          <Title level={4}>Informazioni Ordine</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Orario Consegna'
                name='orarioConsegna'
                rules={[
                  { required: true, message: "Inserisci Orario Consegna" },
                ]}
              >
                <TimePicker
                  placeholder='Seleziona Orario Consegna'
                  format='HH:mm'
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label='Luogo Consegna'
                name='luogoConsegna'
                rules={[
                  { required: true, message: "Inserisci Luogo Consegna" },
                ]}
              >
                <Input placeholder='Luogo Consegna' />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Ora e Data Ritiro'
                name='oraRitiro'
                rules={[
                  { required: false, message: "Inserisci Ora e Data Ritiro" },
                ]}
              >
                <DatePicker
                  showTime
                  placeholder='Seleziona Ora e Data Ritiro'
                  format='YYYY-MM-DD HH:mm'
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label='Luogo Ritiro'
                name='luogoRitiro'
                rules={[{ required: false, message: "Inserisci Luogo Ritiro" }]}
              >
                <Input placeholder='Luogo Ritiro' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label='Note'
                name='note'
                rules={[{ required: false, message: "Inserisci Note" }]}
              >
                <Input.TextArea placeholder='Note' />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Button */}
          <Row>
            <Col span={24} style={{ textAlign: "right" }}>
              <Form.Item>
                <Button type='primary' htmlType='submit'>
                  Aggiungi Ordine
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </>
  );
};

export default OrderForm;
