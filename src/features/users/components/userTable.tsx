import React from "react";
import { Table, Button, Dropdown, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { IUser, Role } from "../../../types/interfaces/IUser";
import { deleteUser } from "../api/userApi";
import { Tag } from "antd/lib";

interface UserTableProps {
  users: IUser[];
  setUsers: (users: IUser[]) => void;
  loading: boolean;
  setUserToEdit: (user: IUser | null) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  setUsers,
  loading,
  setUserToEdit,
}) => {
  /**
   * Handle menu item click from the dropdown.
   */
  const handleMenuClick = async (key: string, record: IUser) => {
    if (key === "edit") {
      setUserToEdit(record);
    }
  };

  const normalizeRoles = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
      // prova JSON -> array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
      // fallback: split su separatori comuni
      return value
        .split(/[,\|; ]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (value == null) return [];
    return [String(value)];
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      const updatedUsers = users.filter((user) => user.id !== id);
      setUsers(updatedUsers);
      message.success("Utente eliminato con successo");
    } catch (error) {
      message.error("Errore durante l'eliminazione dell'utente");
      console.error("Error deleting user:", error);
    }
  };

  /**
   * Define the columns with proper typing.
   */
  const columns: ColumnsType<IUser> = [
    {
      title: "Nome",
      dataIndex: "displayName",
      key: "displayName",
      sorter: (a, b) => a.displayName.localeCompare(b.displayName),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Numero di Telefono",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Ruolo",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Rider", value: "rider" },
        { text: "Guida", value: "guide" },
      ],
      filterMultiple: true,
      onFilter: (value, record) => {
        const roles = normalizeRoles(record.role);
        return roles.some(
          (r) => r.toLowerCase() === String(value).toLowerCase()
        );
      },

      render: (value) =>
        normalizeRoles(value).map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: "Azione",
      key: "actions",
      render: (_value, record: IUser) => {
        /**
         * Build the dropdown menu items.
         * We use `MenuProps["items"]` for typed item definitions.
         */
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
                title='Sei sicuro di voler eliminare questo utente?'
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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Button type='text'>
                Menu <MoreOutlined />
              </Button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <Table<IUser>
      bordered
      dataSource={users}
      columns={columns}
      loading={loading}
      rowKey='id'
    />
  );
};

export default UserTable;
