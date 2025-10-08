import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Typography, message, Card, Badge } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { getUsers, updateUser } from "../api/userApi";
import { watchAllRiderStatuses } from "../api/riderStatusApi";
import { IUser } from "../../../types/interfaces/IUser";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";
import RiderStatusCard from "../components/riderStatusCard";
import UserTable from "../components/userTable";
import UserForm from "../components/userForm";

const { Header, Content } = Layout;
const { Title } = Typography;

const RidersPage: React.FC = () => {
  const [riders, setRiders] = useState<IUser[]>([]);
  const [riderStatuses, setRiderStatuses] = useState<IRiderStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);

  useDocumentTitle(`Riders | ${CONFIG.appName}`);

  // Fetch riders on mount
  useEffect(() => {
    fetchRiders();
  }, []);

  // Watch rider statuses in real-time
  useEffect(() => {
    const unsubscribe = watchAllRiderStatuses(
      (statuses) => {
        setRiderStatuses(statuses);
        console.log(`[RidersPage] Received ${statuses.length} rider statuses`);
      },
      (error) => {
        message.error("Errore nel monitoraggio degli stati dei rider");
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const data = await getUsers("rider");
      setRiders(data);
    } catch (error) {
      message.error("Errore nel caricamento dei rider.");
      console.error("Error fetching riders:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = (user: IUser) => {
    setRiders([...riders, user]);
  };

  const handleUpdateUser = async (id: string, updates: Partial<IUser>) => {
    try {
      await updateUser(id, updates);
      setRiders(riders.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    } catch (error) {
      throw error;
    }
  };

  // Filter riders by status
  const busyRiders = riderStatuses.filter((s) => s.isBusy);
  const freeRiders = riderStatuses.filter((s) => !s.isBusy);

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Title level={2} style={{ margin: 0 }}>
          Gestione Riders
        </Title>
      </Header>

      <Content>
        {/* Summary Cards */}

        {/* Active Riders Section with Steps Component */}
        {busyRiders.length > 0 && (
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Riders Attivi - Stato Consegne ({busyRiders.length})
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            {busyRiders.map((status) => {
              const rider = riders.find((r) => r.id === status.riderId);
              if (!rider) return null;

              return (
                <div key={status.riderId}>
                  {/* Full width Steps component for each rider */}
                  <RiderStatusCard rider={rider} status={status} />
                </div>
              );
            })}
          </Card>
        )}

        {/* Riders Table - Simple, no tabs */}
        <Card title='Lista Riders'>
          <UserTable
            users={riders}
            setUsers={setRiders}
            loading={loading}
            setUserToEdit={setUserToEdit}
            userType='rider'
            riderStatuses={riderStatuses}
          />
        </Card>
      </Content>

      {/* User Form */}
      <UserForm
        addUser={addUser}
        updateUser={handleUpdateUser}
        userToEdit={userToEdit}
        setUserToEdit={setUserToEdit}
        userType='rider'
      />
    </Layout>
  );
};

export default RidersPage;
