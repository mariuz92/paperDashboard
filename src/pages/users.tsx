import React, { useState, useEffect } from "react";
import { Layout, Row, DatePicker, Typography, message } from "antd";
import UserTable from "../components/users/userTable";
import UserForm from "../components/users/userForm";
import { getUsers, createUser } from "../api/userApi";
import { IUser } from "../api/userInterface/IUser";

const { Header, Content } = Layout;
const { Title } = Typography;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      message.error("Failed to fetch users.");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUserHandler = async (user: Omit<IUser, "id">) => {
    try {
      const newUserId = await createUser(user);
      setUsers([...users, { ...user, id: newUserId }]);
      message.success("User added successfully.");
    } catch (error) {
      message.error("Failed to add user.");
      console.error("Error adding user:", error);
    }
  };

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Row justify='space-between' align='middle'>
          <Title level={2} style={{ margin: 0 }}>
            Gestione Collaboratori
          </Title>
        </Row>
      </Header>

      <Content>
        <UserTable users={users} setUsers={setUsers} loading={loading} />
        <UserForm addUser={addUserHandler} />
      </Content>
    </Layout>
  );
};

export default UsersPage;
