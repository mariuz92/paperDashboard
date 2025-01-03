import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  Switch,
} from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getOrderById, updateOrder } from "../api/orderApi";
import { IOrder, IOrderStatus } from "../../../types/interfaces";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title } = Typography;

const RiderUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // e.g. /order/:id
  const [form] = Form.useForm();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRadioSmarrite, setShowRadioSmarrite] = useState<boolean>(false);

  // Fetch the order on mount
  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const fetchedOrder = await getOrderById(id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        form.setFieldsValue({
          ...fetchedOrder,
          orarioConsegna: fetchedOrder.orarioConsegna
            ? dayjs(fetchedOrder.orarioConsegna)
            : null,
          oraRitiro: fetchedOrder.oraRitiro
            ? dayjs(fetchedOrder.oraRitiro)
            : null,
        });
      }
    } catch (error) {
      message.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: Record<string, any>) => {
    if (!order) return;

    const riderName = "Rider Name"; // Replace with actual rider name
    const newNote = `${riderName}: ${values.note}`;
    const updatedNote = order.note ? `${order.note}\n${newNote}` : newNote;

    const updatedOrder = {
      ...order,
      ...values,
      note: updatedNote,
      status: "Ritirato" as IOrderStatus,
    };

    try {
      await updateOrder(order.id as string, updatedOrder);
      message.success("Order updated successfully");
    } catch (error) {
      message.error("Failed to update order");
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      <Title level={4}>Informazioni Guida</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label='Nome Guida / Gruppo'
            name='nomeGuida'
            rules={[{ required: true, message: "Inserisci Nome Guida" }]}
          >
            <Input disabled placeholder='Nome Guida' />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Canale Radio'
            name='canaleRadio'
            rules={[{ required: false, message: "Inserisci Canale Radio" }]}
          >
            <Input placeholder='Canale Radio' />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Radioline'
            name='radiolineConsegnate'
            rules={[
              { required: true, message: "Inserisci Numero di Radioline" },
            ]}
          >
            <InputNumber
              disabled
              placeholder='Radioline Consegnate'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Extra'
            name='extra'
            rules={[{ required: false, message: "Inserisci Numero di Extra" }]}
          >
            <InputNumber
              disabled
              placeholder='Radio Extra'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label='Saldo (€)'
            name='saldo'
            rules={[{ required: false, message: "Inserisci Saldo" }]}
          >
            <InputNumber
              disabled
              placeholder='Saldo (€)'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Informazioni Consegna</Title>
      <Row gutter={16}>
        <Col span={4}>
          <Form.Item
            label='Orario Consegna'
            name='orarioConsegna'
            rules={[{ required: true, message: "Inserisci Orario Consegna" }]}
          >
            <TimePicker
              disabled
              placeholder='Seleziona Orario Consegna'
              format='HH:mm'
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            label='Luogo Consegna'
            name='luogoConsegna'
            rules={[{ required: true, message: "Inserisci Luogo Consegna" }]}
          >
            <Input disabled placeholder='Luogo Consegna' />
          </Form.Item>
        </Col>

        <Col
          span={2}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRightOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
        </Col>

        <Col span={4}>
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
        <Col span={7}>
          <Form.Item
            label='Luogo Ritiro'
            name='luogoRitiro'
            rules={[{ required: false, message: "Inserisci Luogo Ritiro" }]}
          >
            <Input placeholder='Luogo Ritiro' />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4}>Note</Title>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label='Note'
            name='note'
            rules={[{ required: false, message: "Inserisci Note" }]}
          >
            <TextArea placeholder='Note' />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={4}>
          <Form.Item label='Radio Smarrite'>
            <Switch
              checked={showRadioSmarrite}
              onChange={setShowRadioSmarrite}
            />
          </Form.Item>
        </Col>
        {showRadioSmarrite && (
          <Col span={6}>
            <Form.Item
              label='Numero di Radio Smarrite'
              name='radioSmarrite'
              rules={[
                {
                  required: showRadioSmarrite ? true : false,
                  message: "Inserisci Numero di Radio Smarrite",
                },
              ]}
            >
              <InputNumber
                placeholder='Numero di Radio Smarrite'
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row>
        <Col span={24} style={{ textAlign: "right" }}>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Aggiorna Ordine
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default RiderUpdatePage;
