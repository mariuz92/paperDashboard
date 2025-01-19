import React, { useState, useEffect } from "react";
import {
  Form,
  InputNumber,
  Button,
  Row,
  Col,
  DatePicker,
  TimePicker,
  message,
  Typography,
  Input,
} from "antd";
import { saveOrder } from "../api/orderApi";
import { IOrder } from "../../../types/interfaces";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useActiveAuthProvider, useGetIdentity } from "@refinedev/core";
import GooglePlacesAutocomplete from "../../../shared/components/googlePlacesAuto";

const { TextArea } = Input;
const { Title } = Typography;

const GuideOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ nomeGuida: user.displayName });
    }
  }, [user, form]);

  const onFinish = async (values: Record<string, any>) => {
    const newOrder: IOrder = {
      ...values,
      orarioConsegna: values.orarioConsegna
        ? values.orarioConsegna.format("HH:mm")
        : null,
      oraRitiro: values.oraRitiro
        ? values.oraRitiro.format("YYYY-MM-DD HH:mm")
        : null,
      status: "In Consegna",
    };

    setLoading(true);
    try {
      await saveOrder(newOrder);
      message.success("Ordine fatto");
      form.resetFields();
      form.setFieldsValue({ nomeGuida: user.displayName }); // Reset the guide name
    } catch (error) {
      message.error("Errore nell'inserimento dell'ordine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      <Title level={4}>Informazioni Guida</Title>
      <Row gutter={16}>
        <Col span={4}>
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
            <GooglePlacesAutocomplete
              placeholder='Inserisci Luogo Consegna'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoConsegna: address })
              }
            />
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
            <GooglePlacesAutocomplete
              placeholder='Inserisci Luogo Ritiro'
              onPlaceSelect={(address) =>
                form.setFieldsValue({ luogoRitiro: address })
              }
            />
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

      <Row>
        <Col span={24} style={{ textAlign: "right" }}>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Inserisci Ordine
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default GuideOrderPage;
