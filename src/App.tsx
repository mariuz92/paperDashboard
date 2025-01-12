import { Refine, type AuthProvider, Authenticated } from "@refinedev/core";
import {
  useNotificationProvider,
  ErrorComponent,
  RefineThemes,
} from "@refinedev/antd";
import {
  GoogleOutlined,
  DashboardOutlined,
  FileOutlined,
  CalendarOutlined,
  AndroidOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import dataProvider from "@refinedev/simple-rest";
import routerProvider, {
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { ThemedLayoutV2 } from "./layout";
import { ThemedHeaderV2 } from "./layout/header";
import { ThemedTitleV2 } from "./layout/title";
import { AuthPage } from "./features/auth";
import "@refinedev/antd/dist/reset.css";

import { CalendarPage } from "./features/calendar/pages/calendar";
import { DashboardPage } from "./features/dashboard/pages/dashboard";
import { OrdersPage } from "./features/orders/pages/orders";
import { ProfilePage } from "./features/profile/pages/profile";
import RiderUpdatePage from "./features/orders/pages/rider";
import GuideOrderPage from "./features/orders/pages/guideOrder";

import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  signInWithGoogle,
} from "./features/auth/api/authApi";
import { auth } from "./config/firebaseConfig";
import { CONFIG } from "./config/configuration";
import UsersPage from "./features/users/pages/users";
import CustomOutlet from "./shared/components/customOutlet";

const API_URL = "https://api.fake-rest.refine.dev";

const App: React.FC = () => {
  const authProvider: AuthProvider = {
    check: async () => {
      const user = auth.currentUser || localStorage.getItem("email");
      if (user) {
        return { authenticated: true };
      }
      return {
        authenticated: false,
        error: {
          name: "Not authenticated",
          message: "User not logged in",
        },
        logout: true,
        redirectTo: "/login",
      };
    },
    onError: async (error) => {
      if (error.response?.status === 401) {
        return {
          logout: true,
        };
      }
      return { error };
    },
    login: async ({ providerName, email, password, tenantName }) => {
      try {
        if (providerName === "google") {
          await signInWithGoogle(tenantName);
          return {
            success: true,
            redirectTo: "/",
          };
        }

        await signInWithEmail(tenantName, email, password);
        return {
          success: true,
          redirectTo: "/",
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: "Login failed",
            name: (error as Error).message,
          },
        };
      }
    },
    register: async ({ email, password, role }) => {
      try {
        await signUpWithEmail(email, password, role);
        return {
          success: true,
          redirectTo: "/",
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: "Registration failed",
            name: (error as Error).message,
          },
        };
      }
    },
    logout: async () => {
      try {
        await signOutUser();
        return {
          success: true,
          redirectTo: "/login",
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: "Logout failed",
            name: (error as Error).message,
          },
        };
      }
    },
    getIdentity: async () => {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        return JSON.parse(userInfo);
      }
      return null;
    },
    getPermissions: async () => {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.role;
      }
      return null;
    },
  };

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerProvider}
            resources={[
              {
                name: "orders",
                list: "/",
                meta: {
                  label: "Ordini",
                  icon: <FileOutlined />,
                },
              },
              {
                name: "calendar",
                list: "/Calendario",
                meta: {
                  label: "Calendario Ordini",
                  icon: <CalendarOutlined />,
                },
              },
              {
                name: "dashboard",
                list: "/Dashboard",
                meta: {
                  label: "Dashboard",
                  icon: <DashboardOutlined />,
                },
              },
              {
                name: "users",
                list: "/Collaboratori",
                meta: {
                  label: "Collaboratori",
                  icon: <TeamOutlined />,
                },
              },
              // potential other resources...
            ]}
            notificationProvider={useNotificationProvider}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              {/* Public Auth Routes */}
              <Route
                path='/login'
                element={
                  <AuthPage
                    title={
                      <ThemedTitleV2
                        icon={<AndroidOutlined />}
                        text={CONFIG.appName}
                        collapsed={false}
                      />
                    }
                    type='login'
                    formProps={{ initialValues: {} }}
                    providers={[
                      {
                        name: "google",
                        label: "Sign in with Google",
                        icon: <GoogleOutlined style={{ fontSize: 24 }} />,
                      },
                    ]}
                  />
                }
              />
              <Route
                path='/register'
                element={
                  <AuthPage
                    title={
                      <ThemedTitleV2
                        icon={<AndroidOutlined />}
                        text={CONFIG.appName}
                        collapsed={false}
                      />
                    }
                    type='register'
                    providers={[
                      {
                        name: "google",
                        label: "Sign in with Google",
                        icon: <GoogleOutlined style={{ fontSize: 24 }} />,
                      },
                    ]}
                  />
                }
              />
              <Route
                path='/forgot-password'
                element={
                  <AuthPage
                    title={
                      <ThemedTitleV2
                        icon={<AndroidOutlined />}
                        text={CONFIG.appName}
                        collapsed={false}
                      />
                    }
                    type='forgotPassword'
                  />
                }
              />
              <Route
                path='/update-password'
                element={
                  <AuthPage
                    title={
                      <ThemedTitleV2
                        icon={<AndroidOutlined />}
                        text={CONFIG.appName}
                        collapsed={false}
                      />
                    }
                    type='updatePassword'
                  />
                }
              />

              {/* Main (Default) Protected Layout */}
              <Route
                element={
                  <Authenticated
                    fallback={<Navigate to='/login' />}
                    key='authenticated'
                  >
                    <ThemedLayoutV2
                      Header={ThemedHeaderV2}
                      Title={({ collapsed }) => (
                        <ThemedTitleV2
                          collapsed={collapsed}
                          icon={<AndroidOutlined />}
                          text={CONFIG.appName}
                        />
                      )}
                    >
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                <Route index element={<OrdersPage />} />
                <Route path='/Calendario' element={<CalendarPage />} />
                <Route path='/Dashboard' element={<DashboardPage />} />
                <Route path='/Profilo' element={<ProfilePage />} />
                <Route path='/Collaboratori' element={<UsersPage />} />
                {/* 404 inside default layout */}
                <Route path='*' element={<ErrorComponent />} />
              </Route>

              {/* Minimal Layout for Rider */}
              <Route
                path='/rider'
                element={
                  <Authenticated
                    fallback={<Navigate to='/login' />}
                    key='authenticated'
                  >
                    <CustomOutlet />
                  </Authenticated>
                }
              >
                <Route index element={<RiderUpdatePage />} />
                <Route path=':id' element={<RiderUpdatePage />} />
              </Route>

              {/* Minimal Layout for Guida */}
              <Route
                path='/OrdineGuida'
                element={
                  <Authenticated
                    fallback={<Navigate to='/login' />}
                    key='authenticated'
                  >
                    <CustomOutlet />
                  </Authenticated>
                }
              >
                <Route index element={<GuideOrderPage />} />
              </Route>
            </Routes>

            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
