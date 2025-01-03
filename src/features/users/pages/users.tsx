import React, { useState, useEffect } from "react";
import { Layout, Row, Typography, message } from "antd";
import UserTable from "../components/userTable";
import UserForm from "../components/userForm";
import { getUsers, createUser, updateUser } from "../api/userApi";
import { IUser } from "../../../types/interfaces/IUser";

const { Header, Content } = Layout;
const { Title } = Typography;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);

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

  const updateUserHandler = async (id: string, user: Partial<IUser>) => {
    try {
      await updateUser(id, user);
      setUsers(users.map((u) => (u.id === id ? { ...u, ...user } : u)));
      message.success("User updated successfully.");
    } catch (error) {
      message.error("Failed to update user.");
      console.error("Error updating user:", error);
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
        <UserTable
          users={users}
          setUsers={setUsers}
          loading={loading}
          setUserToEdit={setUserToEdit}
        />
        <UserForm
          addUser={addUserHandler}
          updateUser={updateUserHandler}
          userToEdit={userToEdit}
          setUserToEdit={setUserToEdit}
        />
      </Content>
    </Layout>
  );
};

export default UsersPage;
