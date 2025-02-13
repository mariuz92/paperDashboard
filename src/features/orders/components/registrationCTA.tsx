import React, { useState } from "react";
import type { CollapseProps } from "antd";
import { Collapse, Row, Col, Card, Button, Typography } from "antd";
import { InfoCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Meta } = Card;
const { Text } = Typography;

interface Props {
  registrationData?: any; // Change to your real type if available
}

const RegistrationCTA: React.FC<Props> = ({ registrationData }) => {
  const navigate = useNavigate();

  // Control which panels are open
  const [activeKeys, setActiveKeys] = useState<string[] | string>([
    "cta-panel",
  ]);

  // Close handler removes the panel from activeKeys
  const onClosePanel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent collapse toggle
    setActiveKeys([]);
  };

  // Only render if registration data doesn't exist
  if (registrationData) return null;

  // The content inside the panel
  const panelContent = (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Text>
            Registrati per salvare le tue informazioni e velocizzare i prossimi
            ordini.
          </Text>
        </Col>
        <Col span={24}>
          <Button
            key="register"
            type="primary"
            size="middle"
            onClick={() => navigate("/register")}
          >
            Registrati
          </Button>
        </Col>
      </Row>
      <Row style={{ paddingTop: 16 }}>
        <Text>
          Sei già registrato ?
          <Button
            key="login"
            type="link"
            size="middle"
            onClick={() => navigate("/login")}
          >
            Accedi
          </Button>
        </Text>
      </Row>
    </>
  );

  // Generate the items array (Ant Design 5+)
  const items: CollapseProps["items"] = [
    {
      key: "cta-panel",
      label: (
        <Text strong style={{ fontSize: 16 }}>
          Vuoi risparmiare tempo in futuro?
        </Text>
      ),
      children: panelContent,
      // "extra" renders on the right side of the panel header
      extra: (
        <CloseOutlined
          onClick={onClosePanel}
          style={{ fontSize: 16, color: "#999" }}
        />
      ),
    },
  ];

  return (
    <Collapse
      style={{ border: "1px solid #91d5ff", marginBottom: 16 }}
      // Controlled open/close with activeKeys
      activeKey={activeKeys}
      onChange={(keys) => setActiveKeys(keys)}
      items={items}
    />
  );
};

export default RegistrationCTA;
