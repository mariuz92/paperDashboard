import { Refine, type AuthProvider, Authenticated } from "@refinedev/core";
import {
  useNotificationProvider,
  ErrorComponent,
  AuthPage,
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
import { ThemedLayoutV2 } from "./components/layout";
import { ThemedHeaderV2 } from "./components/layout/header";
import { ThemedTitleV2 } from "./components/layout/title";
import "@refinedev/antd/dist/reset.css";

import { CalendarPage } from "./pages/calendar";
import { DashboardPage } from "../src/pages/dashboard";
import { OrdersPage } from "../src/pages/orders";
import { ProfilePage } from "../src/pages/profile";
import RiderUpdatePage from "./pages/rider";

import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  signInWithGoogle,
} from "../src/api/authApi";
import { auth } from "./utils/firebaseConfig";
import { CONFIG } from "./configuration";
import UsersPage from "./pages/users";

const API_URL = "https://api.fake-rest.refine.dev";

const App: React.FC = () => {
  /**
   * Define an AuthProvider that:
   * 1) Checks localStorage.getItem("email") to determine if user is 'authenticated'.
   * 2) Provides login/logout/etc.
   */
  const authProvider: AuthProvider = {
    check: async () => {
      // If no email in localStorage, user not authenticated -> redirect to /login
      return localStorage.getItem("email")
        ? { authenticated: true }
        : {
            authenticated: false,
            error: {
              name: "Not authenticated",
              message: "User not logged in",
            },
            logout: true,
            redirectTo: "/login",
          };
    },
    login: async ({ providerName, email, password }) => {
      if (providerName === "google") {
        try {
          await signInWithGoogle();
          localStorage.setItem("email", email);
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
      }

      try {
        const user = await signInWithEmail(email, password);
        if (user.email) {
          localStorage.setItem("email", user.email);
        }
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
        const user = await signUpWithEmail(email, password, role);
        if (user.email) {
          localStorage.setItem("email", user.email);
        }
        return {
          success: true,
          redirectTo: "/",
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: "Register failed",
            name: (error as Error).message,
          },
        };
      }
    },
    updatePassword: async (params) => {
      // Implement password update logic if needed
      return {
        success: true,
      };
    },
    forgotPassword: async (params) => {
      // Implement forgot password logic if needed
      return {
        success: true,
      };
    },
    logout: async () => {
      try {
        await signOutUser();
        localStorage.removeItem("email");
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
    onError: async (error) => {
      if (error.response?.status === 401) {
        return {
          logout: true,
        };
      }
      return { error };
    },
    getPermissions: async (params) => params?.permissions,
    getIdentity: async () => {
      const user = auth.currentUser;
      if (user) {
        return {
          id: user.uid,
          name: user.displayName || user.email,
          avatar:
            user.photoURL ||
            "https://unsplash.com/photos/IWLOvomUmWU/download?force=true&w=640",
          email: user.email || "",
        };
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
              {/* PUBLIC AUTH ROUTES */}
              <Route
                path='/login'
                element={
                  <AuthPage
                    type='login'
                    formProps={{
                      initialValues: {},
                    }}
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
                element={<AuthPage type='forgotPassword' />}
              />
              <Route
                path='/update-password'
                element={<AuthPage type='updatePassword' />}
              />

              {/* PROTECTED ROUTES */}
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
                {/* Main routes */}
                <Route index element={<OrdersPage />} />
                <Route path='/Calendario' element={<CalendarPage />} />
                <Route path='/Dashboard' element={<DashboardPage />} />
                <Route path='/Profilo' element={<ProfilePage />} />
                <Route path='/Collaboratori' element={<UsersPage />} />

                {/* Rider sub-route (also protected) */}
                <Route path='/rider'>
                  <Route index element={<RiderUpdatePage />} />
                  <Route path=':id' element={<RiderUpdatePage />} />
                </Route>

                {/* Catch-all 404 (protected) */}
                <Route path='*' element={<ErrorComponent />} />
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
