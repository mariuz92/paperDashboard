import React from "react";
import {
  pickNotDeprecated,
  useActiveAuthProvider,
  useGetIdentity,
} from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  theme,
  Dropdown,
  Button,
} from "antd";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "../../api/authApi";

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  isSticky,
  sticky,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  const shouldRenderHeader = user && (user.name || user.avatar);

  if (!shouldRenderHeader) {
    return null;
  }

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (pickNotDeprecated(sticky, isSticky)) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

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

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={["click"]}
        >
          <Button type='text' style={{ display: "flex", alignItems: "center" }}>
            <Avatar
              size={"large"}
              src={user?.avatar}
              style={{ marginRight: 8 }}
            />
            {user?.name || user?.email}
          </Button>
        </Dropdown>
      </Space>
    </AntdLayout.Header>
  );
};
