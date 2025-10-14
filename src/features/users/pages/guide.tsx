import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Typography, message, Card } from "antd";
import { SolutionOutlined } from "@ant-design/icons"; // ✅ Better icon for guides
import { getUsers, updateUser } from "../api/userApi";
import { IUser } from "../../../types/interfaces/IUser";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import UserTable from "../components/userTable";
import UserForm from "../components/userForm";

const { Header, Content } = Layout;
const { Title } = Typography;

const GuidesPage: React.FC = () => {
  const [guides, setGuides] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);

  useDocumentTitle(`Guide | ${CONFIG.appName}`);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const data = await getUsers("guide");
      setGuides(data);
    } catch (error) {
      message.error("Errore nel caricamento delle guide.");
      console.error("Error fetching guides:", error);
    } finally {
      setLoading(false);
    }
  };

  const addGuide = (user: IUser) => {
    setGuides([...guides, user]);
  };

  const handleUpdateUser = async (id: string, updates: Partial<IUser>) => {
    try {
      await updateUser(id, updates);
      setGuides(guides.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      message.success("Guida aggiornata con successo!");
    } catch (error) {
      console.error("Error updating guide:", error);
      throw error;
    }
  };

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Title level={2} style={{ margin: 0 }}>
          Gestione Guide
        </Title>
      </Header>

      {/* Summary Card */}

      {/* Guides Table */}

      <UserTable
        users={guides}
        setUsers={setGuides}
        loading={loading}
        setUserToEdit={setUserToEdit}
        userType='guide'
      />

      {/* User Form */}
      <UserForm
        addUser={addGuide}
        updateUser={handleUpdateUser}
        userToEdit={userToEdit}
        setUserToEdit={setUserToEdit}
        userType='guide'
      />
    </Layout>
  );
};

export default GuidesPage;
