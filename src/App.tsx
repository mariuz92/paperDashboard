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
} from "@ant-design/icons";

import dataProvider from "@refinedev/simple-rest";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { ThemedHeaderV2 } from "./components/layout/header";
import { ThemedLayoutV2 } from "./components/layout";
import { ThemedTitleV2 } from "./components/layout/title";
import "@refinedev/antd/dist/reset.css";

import { CalendarPage } from "./pages/calendar";
import { DashboardPage } from "../src/pages/dashboard";
import { OrdersPage } from "../src/pages/orders";
import { UserPage } from "../src/pages/profile";

import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  onAuthStateChangedListener,
  signInWithGoogle,
} from "../src/api/authApi";
import { auth } from "./utils/firebaseConfig";
import { CONFIG } from "./configuration";
const API_URL = "https://api.fake-rest.refine.dev";

const App: React.FC = () => {
  const authProvider: AuthProvider = {
    login: async ({ providerName, email, password }) => {
      if (providerName === "google") {
        try {
          await signInWithGoogle();
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
    register: async ({ email, password }) => {
      try {
        const user = await signUpWithEmail(email, password);
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
      // Implement update password logic here
      return {
        success: true,
      };
    },
    forgotPassword: async (params) => {
      // Implement forgot password logic here
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
    check: async () =>
      localStorage.getItem("email")
        ? {
            authenticated: true,
          }
        : {
            authenticated: false,
            error: {
              message: "Check failed",
              name: "Not authenticated",
            },
            logout: true,
            redirectTo: "/login",
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
              // {
              //   name: "posts",
              //   list: "/posts",
              //   show: "/posts/show/:id",
              //   edit: "/posts/edit/:id",
              // },
            ]}
            notificationProvider={useNotificationProvider}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key='authenticated-routes'
                    fallback={<CatchAllNavigate to='/login' />}
                  >
                    <ThemedLayoutV2
                      Header={() => <ThemedHeaderV2 />}
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

                <Route path='/Calendario'>
                  <Route index element={<CalendarPage />} />
                </Route>
                <Route path='/Profilo'>
                  <Route index element={<UserPage />} />
                </Route>
                <Route path='/Dashboard'>
                  <Route index element={<DashboardPage />} />
                </Route>

                {/* <Route
                  element={
                    <Authenticated key='auth-pages' fallback={<Outlet />}>
                      <NavigateToResource resource='posts' />
                    </Authenticated>
                  }
                /> */}
              </Route>
              <Route
                path='/login'
                element={
                  <AuthPage
                    type='login'
                    formProps={{
                      initialValues: {
                        // ...authCredentials,
                      },
                    }}
                    providers={[
                      {
                        name: "google",
                        label: "Sign in with Google",
                        icon: (
                          <GoogleOutlined
                            style={{
                              fontSize: 24,
                              lineHeight: 0,
                            }}
                          />
                        ),
                      },
                      // {
                      //   name: "github",
                      //   label: "Sign in with GitHub",
                      //   icon: (
                      //     <GithubOutlined
                      //       style={{
                      //         fontSize: 24,
                      //         lineHeight: 0,
                      //       }}
                      //     />
                      //   ),
                      // },
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
                        icon: (
                          <GoogleOutlined
                            style={{
                              fontSize: 24,
                              lineHeight: 0,
                            }}
                          />
                        ),
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

              <Route
                element={
                  <ThemedLayoutV2
                    Header={() => <ThemedHeaderV2 />}
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
                }
              >
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
