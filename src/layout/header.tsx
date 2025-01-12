import React, { useEffect, useState } from "react";
import { Layout, Button, Avatar, Dropdown, Menu, Space, theme } from "antd";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "../features/auth/api/authApi";
import { IUser } from "../types/interfaces/IUser";

const { Header } = Layout;

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const shouldRenderHeader = user && (user.displayName || user.photoURL);

  const handleMenuClick = async ({ key }: any) => {
    if (key === "profile") {
      navigate("/Profilo");
    } else if (key === "logout") {
      await signOutUser();
      navigate("/login");
    }
  };

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profilo",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
    },
  ];

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <Header style={headerStyles}>
      {shouldRenderHeader && (
        <Space>
          <Dropdown
            placement='bottomRight'
            arrow
            menu={{ items: menuItems, onClick: handleMenuClick }}
            trigger={["click"]}
          >
            <Button
              type='text'
              style={{ display: "flex", alignItems: "center" }}
            >
              <Avatar
                size={"default"}
                src={user?.photoURL}
                style={{ marginRight: 8 }}
              />
              {user?.displayName || user?.email}
            </Button>
          </Dropdown>
        </Space>
      )}
    </Header>
  );
};

export default ThemedHeaderV2;
