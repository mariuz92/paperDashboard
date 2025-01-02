import React from "react";
import { Table, Button, Space } from "antd";
import { IUser } from "../../api/userInterface/IUser";

interface UserTableProps {
  users: IUser[];
  setUsers: (users: IUser[]) => void;
  loading: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ users, setUsers, loading }) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text: string, record: IUser) => (
        <Space size='middle'>
          <Button>Edit</Button>
          <Button type='primary' danger>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table dataSource={users} columns={columns} loading={loading} rowKey='id' />
  );
};

export default UserTable;
