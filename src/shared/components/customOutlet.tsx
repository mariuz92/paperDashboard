import React from "react";
import { Outlet } from "react-router-dom";
import { Layout, Card } from "antd";

const { Content } = Layout;

const CustomOutlet: React.FC = () => {
  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
      <Content
        style={{
          padding: "24px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
          <Outlet />
        </Card>
      </Content>
    </Layout>
  );
};

export default CustomOutlet;
