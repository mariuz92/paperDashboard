import {
  AndroidOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileOutlined,
  GoogleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  ErrorComponent,
  RefineThemes,
  useNotificationProvider,
} from "@refinedev/antd";
import {
  AccessControlProvider,
  Authenticated,
  CanParams,
  CanResponse,
  Refine,
  type AuthProvider,
} from "@refinedev/core";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import "@refinedev/antd/dist/reset.css";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AuthPage } from "./features/auth";
import { ThemedLayoutV2 } from "./layout";
import { ThemedHeaderV2 } from "./layout/header";
import { ThemedTitleV2 } from "./layout/title";

import JoinPage from "./features/auth/components/join";
import { CalendarPage } from "./features/calendar/pages/calendar";
import { DashboardPage } from "./features/dashboard/pages/dashboard";
import GuideOrderPage from "./features/orders/pages/guideOrder";
import { OrdersPage } from "./features/orders/pages/orders";
import RiderUpdatePage from "./features/orders/pages/rider";
import { ProfilePage } from "./features/profile/pages/profile";

import logo from "../src/images/youngtour.jpg";
import { CONFIG } from "./config/configuration";
import { auth } from "./config/firebaseConfig";
import {
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "./features/auth/api/authApi";
import UsersPage from "./features/users/pages/users";
import CustomOutlet from "./shared/components/customOutlet";
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
    login: async ({ providerName, email, password, companyName }) => {
      try {
        if (providerName === "google") {
          await signInWithGoogle(companyName);
          return {
            success: true,
            redirectTo: "/",
          };
        }

        await signInWithEmail(companyName, email, password);
        const storedUser = await localStorage.getItem("userInfo");

        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user!.role == "guide") {
            return {
              success: true,
              redirectTo: "/OrdineGuida",
            };
          }
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
    register: async ({ email, password, companyName, name, phoneNumber }) => {
      try {
        await signUpWithEmail(email, password, companyName, name, phoneNumber);
        const storedUser = await localStorage.getItem("userInfo");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user!.role == "guide") {
            return {
              success: true,
              redirectTo: "/OrdineGuida",
            };
          }
        }
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
      const email = localStorage.getItem("email");
      if (email) {
        return JSON.parse(email);
      }
      return null;
    },
    getPermissions: async () => {
      const role = localStorage.getItem("role");
      if (role) {
        const user = JSON.parse(role);
        return user.role;
      }
      return null;
    },
  };

  const accessControlProvider: AccessControlProvider = {
    can: async ({
      resource,
      action,
      params,
    }: CanParams): Promise<CanResponse> => {
      const user = auth.currentUser || localStorage.getItem("email");

      // Define public pages that don't require authentication
      const publicResources = ["OrdineGuida", "rider", "join"];

      if (!user) {
        if (resource && publicResources.includes(resource)) {
          return { can: true };
        } else {
          return {
            can: false,
            reason: "Unauthorized",
          };
        }
      }

      // If the user is authenticated, allow access to all resources
      return { can: true };
    },
    options: {
      buttons: {
        enableAccessControl: true,
        hideIfUnauthorized: false, // Set to true if you want to hide buttons instead of disabling them
      },
    },
  };

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            authProvider={authProvider}
            routerProvider={routerProvider}
            // i18nProvider={i18nProvider}
            accessControlProvider={accessControlProvider}
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
              title: {
                text: CONFIG.appName,
                icon: logo,
              },
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
                        image={logo}
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
                        image={logo}
                        text={CONFIG.appName}
                        collapsed={true}
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
                        image={logo}
                        text={CONFIG.appName}
                        collapsed={true}
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
                        image={logo}
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
                          image={logo}
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
              <Route path='/rider' element={<CustomOutlet />}>
                <Route index element={<RiderUpdatePage />} />
                <Route path=':id' element={<RiderUpdatePage />} />
              </Route>

              {/* Minimal Layout for Guida */}
              <Route path='/OrdineGuida' element={<CustomOutlet />}>
                <Route index element={<GuideOrderPage />} />
              </Route>

              <Route path='/join' element={<CustomOutlet />}>
                <Route index element={<JoinPage />} />
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
