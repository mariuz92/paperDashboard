import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Typography, message, Card, Badge, Tabs } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
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
  const [admins, setAdmins] = useState<IUser[]>([]);
  const [riderStatuses, setRiderStatuses] = useState<IRiderStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>("riders");

  useDocumentTitle(`Gestione Utenti | ${CONFIG.appName}`);

  // Fetch riders on mount
  useEffect(() => {
    fetchRiders();
    fetchAdmins();
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

  const fetchAdmins = async () => {
    setAdminLoading(true);
    try {
      const data = await getUsers("admin");
      setAdmins(data);
    } catch (error) {
      message.error("Errore nel caricamento degli admin.");
      console.error("Error fetching admins:", error);
    } finally {
      setAdminLoading(false);
    }
  };

  const addUser = (user: IUser) => {
    // ✅ Check if user has admin role (users can have multiple roles)
    if (user.role.includes("admin")) {
      setAdmins([...admins, user]);
    }
    // ✅ Check if user has rider role
    if (user.role.includes("rider")) {
      setRiders([...riders, user]);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<IUser>) => {
    try {
      await updateUser(id, updates);
      
      // Find the user in either list
      const existingUser = riders.find(r => r.id === id) || admins.find(a => a.id === id);
      if (!existingUser) return;
      
      const updatedUser = { ...existingUser, ...updates } as IUser;
      
      // ✅ Handle multiple roles - user can be in both lists
      const hasAdminRole = updatedUser.role.includes("admin");
      const hasRiderRole = updatedUser.role.includes("rider");
      
      if (hasAdminRole) {
        // Add or update in admins list
        const adminExists = admins.some(a => a.id === id);
        if (adminExists) {
          setAdmins(admins.map((a) => (a.id === id ? updatedUser : a)));
        } else {
          setAdmins([...admins, updatedUser]);
        }
      } else {
        // Remove from admins if no longer has admin role
        setAdmins(admins.filter(a => a.id !== id));
      }
      
      if (hasRiderRole) {
        // Add or update in riders list
        const riderExists = riders.some(r => r.id === id);
        if (riderExists) {
          setRiders(riders.map((r) => (r.id === id ? updatedUser : r)));
        } else {
          setRiders([...riders, updatedUser]);
        }
      } else {
        // Remove from riders if no longer has rider role
        setRiders(riders.filter(r => r.id !== id));
      }
      
      message.success("Utente aggiornato con successo");
    } catch (error) {
      message.error("Errore nell'aggiornamento dell'utente");
      throw error;
    }
  };

  // ✅ Show cards ONLY for active/in-progress statuses (exclude completed and cancelled)
  const activeRiders = riderStatuses.filter((s) => {
    // Show cards for these active statuses only
    const activeStatuses = [
      "Presa in Carico",    
      "In Consegna",
      "In Ritiro",
    ];
    
    return activeStatuses.includes(s.lastStatus);
  });

  const tabItems = [
    {
      key: "riders",
      label: (
        <span>
          <TeamOutlined /> Riders ({riders.length})
        </span>
      ),
      children: (
        <>
          {/* Active Riders Section - Only shown for riders with active/in-progress orders */}
          {activeRiders.length > 0 && (
            <Card
              title={
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  Riders Attivi - Stato Consegne ({activeRiders.length})
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              {activeRiders.map((status) => {
                const rider = riders.find((r) => r.id === status.riderId);
                if (!rider) return null;

                return (
                  <div key={status.riderId}>
                    {/* Full width card component for each rider */}
                    <RiderStatusCard rider={rider} status={status} />
                  </div>
                );
              })}
            </Card>
          )}

          {/* Riders Table */}
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
        </>
      ),
    },
    {
      key: "admins",
      label: (
        <span>
          <UserOutlined /> Amministratori ({admins.length})
        </span>
      ),
      children: (
        <Card title='Lista Amministratori'>
          <UserTable
            users={admins}
            setUsers={setAdmins}
            loading={adminLoading}
            setUserToEdit={setUserToEdit}
            userType='admin'
            riderStatuses={[]} // Admins don't have rider statuses
          />
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "20px", background: "#fff" }}>
      <Header style={{ background: "#fff", padding: 0, marginBottom: "20px" }}>
        <Title level={2} style={{ margin: 0 }}>
          Gestione Utenti
        </Title>
      </Header>

      <Content>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Content>

      {/* User Form */}
      <UserForm
        addUser={addUser}
        updateUser={handleUpdateUser}
        userToEdit={userToEdit}
        setUserToEdit={setUserToEdit}
        userType={activeTab as "rider" | "admin"}
      />
    </Layout>
  );
};

export default RidersPage;