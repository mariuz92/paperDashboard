import React from "react";
import {
  Table,
  Button,
  Dropdown,
  message,
  Popconfirm,
  Tag,
  Space,
  Tooltip,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { IUser } from "../../../types/interfaces/IUser";
import { deleteUser } from "../api/userApi";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/it";

dayjs.extend(relativeTime);
dayjs.locale("it");

interface UserTableProps {
  users: IUser[];
  setUsers: (users: IUser[]) => void;
  loading: boolean;
  setUserToEdit: (user: IUser | null) => void;
  userType: "rider" | "guide" | "admin"; // New prop
  riderStatuses?: IRiderStatus[]; // Optional for riders only
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    "Presa in Carico": "gold",
    "In Consegna": "blue",
    Consegnato: "green",
    "Attesa ritiro": "orange",
    "In Ritiro": "purple",
    Ritirato: "cyan",
    Annullato: "red",
  };
  return colorMap[status] || "default";
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  setUsers,
  loading,
  setUserToEdit,
  userType,
  riderStatuses = [],
}) => {
  const handleMenuClick = async (key: string, record: IUser) => {
    if (key === "edit") {
      setUserToEdit(record);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      const updatedUsers = users.filter((user) => user.id !== id);
      setUsers(updatedUsers);
      message.success(
        `${userType === "rider" ? "Rider" : "Guida"} eliminato con successo`
      );
    } catch (error) {
      message.error("Errore durante l'eliminazione");
      console.error("Error deleting user:", error);
    }
  };

  const getRiderStatus = (riderId: string): IRiderStatus | undefined => {
    return riderStatuses.find((status) => status.riderId === riderId);
  };

  // Base columns for both riders and guides
  const baseColumns: ColumnsType<IUser> = [
    {
      title: "Nome",
      dataIndex: "displayName",
      key: "displayName",
      fixed: "left" as const,
      width: 180,
      render: (name: string, record: IUser) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
          {record.disabled && <Tag color='red'>Disabilitato</Tag>}
        </Space>
      ),
      sorter: (a, b) => a.displayName.localeCompare(b.displayName),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (email: string) => (
        <Space>
          <MailOutlined />
          {email}
        </Space>
      ),
    },
    {
      title: "Telefono",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 150,
      render: (phone: string) =>
        phone ? (
          <Space>
            <PhoneOutlined />
            {phone}
          </Space>
        ) : (
          "-"
        ),
    },
  ];

  // Rider-specific columns
  const riderColumns: ColumnsType<IUser> = [
    {
      title: "Stato",
      key: "status",
      width: 80,
      fixed: "left" as const,
      render: (_: any, record: IUser) => {
        const status = getRiderStatus(record.id);
        if (!status) {
          return <Badge status='default' />;
        }
        return (
          <Tooltip title={status.isBusy ? "Occupato" : "Libero"}>
            <Badge status={status.isBusy ? "processing" : "success"} />
          </Tooltip>
        );
      },
    },

    {
      title: "Stato Attuale",
      key: "currentStatus",
      width: 150,
      render: (_: any, record: IUser) => {
        const status = getRiderStatus(record.id);
        if (!status) {
          return <Tag>Nessun stato</Tag>;
        }
        return (
          <Tag
            color={getStatusColor(status.lastStatus)}
            icon={status.isBusy ? <ClockCircleOutlined /> : undefined}
          >
            {status.lastStatus}
          </Tag>
        );
      },
    },
    {
      title: "Ultima posizione",
      key: "headingTo",
      width: 200,
      render: (_: any, record: IUser) => {
        const status = getRiderStatus(record.id);
        if (!status || !status.headingTo) {
          return "-";
        }
        return (
          <Tooltip title={status.headingTo}>
            <Space>
              <EnvironmentOutlined style={{ color: "#1890ff" }} />
              <span
                style={{
                  maxWidth: 150,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                }}
              >
                {status.headingTo}
              </span>
            </Space>
          </Tooltip>
        );
      },
    },
    ...baseColumns,
  ];

  // Actions column
  const actionsColumn: ColumnsType<IUser>[0] = {
    title: "Azioni",
    key: "actions",
    fixed: "right" as const,
    width: 120,
    render: (_: any, record: IUser) => {
      const items: MenuProps["items"] = [
        {
          key: "edit",
          label: (
            <span onClick={() => handleMenuClick("edit", record)}>
              <EditOutlined /> Modifica
            </span>
          ),
        },
        {
          type: "divider",
        },
        {
          key: "delete",
          label: (
            <Popconfirm
              title={`Sei sicuro di voler eliminare questo ${
                userType === "rider" ? "rider" : "guida"
              }?`}
              onConfirm={() => handleDelete(record.id)}
              okText='Sì'
              cancelText='No'
            >
              <span>
                <DeleteOutlined /> Elimina
              </span>
            </Popconfirm>
          ),
        },
      ];

      return (
        <Dropdown menu={{ items }} trigger={["click"]}>
          <Button type='text'>
            Menu <MoreOutlined />
          </Button>
        </Dropdown>
      );
    },
  };

  // Choose columns based on userType
  const columns =
    userType === "rider"
      ? [...riderColumns, actionsColumn]
      : [...baseColumns, actionsColumn];

  return (
    <Table<IUser>
      bordered
      dataSource={users}
      columns={columns}
      loading={loading}
      rowKey='id'
      scroll={{ x: userType === "rider" ? 1200 : 800 }}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default UserTable;
