import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Avatar,
  Row,
  Col,
  Card,
  Upload,
  Spin,
  Tag,
  Space,
  Alert,
  Modal,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CrownOutlined,
  EditOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { auth } from "../../../config/firebaseConfig";
import {
  updateProfile,
  updatePassword,
  onAuthStateChanged,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { IUser, Role } from "../../../types/interfaces/IUser";
import { getProfile, updateUserProfile } from "../api/profile_api";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

const getRoleColor = (role: Role): string => {
  switch (role) {
    case "admin":
      return "gold";
    case "rider":
      return "blue";
    case "guide":
      return "green";
    default:
      return "default";
  }
};

const getRoleLabel = (role: Role): string => {
  switch (role) {
    case "admin":
      return "Amministratore";
    case "rider":
      return "Rider";
    case "guide":
      return "Guida";
    default:
      return "";
  }
};

export const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  useDocumentTitle(`Profilo | ${CONFIG.appName}`);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setInitialLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!firebaseUser?.uid) return;

      setInitialLoading(true);
      try {
        const profile = await getProfile(firebaseUser.uid);
        setUserProfile(profile);

        form.setFieldsValue({
          displayName: profile.displayName || firebaseUser.displayName,
          email: profile.email || firebaseUser.email,
          phoneNumber: profile.phoneNumber || firebaseUser.phoneNumber,
        });

        if (profile.photoURL || firebaseUser.photoURL) {
          setFileList([
            {
              uid: "-1",
              name: "profile.png",
              status: "done",
              url: profile.photoURL || firebaseUser.photoURL,
            },
          ]);
        }

        localStorage.setItem("userInfo", JSON.stringify(profile));
      } catch (error) {
        console.error("Error fetching profile:", error);
        message.error("Errore nel recuperare il profilo.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [firebaseUser, form]);

  const handleUpload = ({ fileList }: any) => {
    setFileList(fileList);
    if (fileList.length > 0 && fileList[0].status === "done") {
      form.setFieldsValue({ photoURL: fileList[0].url });
      message.success("Immagine caricata con successo");
    } else if (fileList.length > 0 && fileList[0].status === "error") {
      message.error("Caricamento immagine non riuscito");
    }
  };

  const handleUpdateProfile = async (values: any) => {
    if (!firebaseUser) {
      message.error("Utente non autenticato");
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<IUser> = {
        displayName: values.displayName,
        phoneNumber: values.phoneNumber || null,
      };

      if (fileList.length > 0 && fileList[0].url) {
        updateData.photoURL = fileList[0].url;
      }

      await updateUserProfile(firebaseUser.uid, updateData);

      await updateProfile(firebaseUser, {
        displayName: values.displayName,
        photoURL: fileList.length > 0 ? fileList[0].url : undefined,
      });

      const updatedProfile = { ...userProfile, ...updateData } as IUser;
      setUserProfile(updatedProfile);
      localStorage.setItem("userInfo", JSON.stringify(updatedProfile));

      message.success("Profilo aggiornato con successo");
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Errore durante l'aggiornamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values: any) => {
    if (!firebaseUser || !firebaseUser.email) {
      message.error("Utente non autenticato");
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, values.newPassword);

      message.success("Password aggiornata con successo");
      passwordForm.resetFields();
      setPasswordModalVisible(false);
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        message.error("Password attuale non corretta");
      } else if (error.code === "auth/weak-password") {
        message.error("La nuova password è troppo debole");
      } else {
        message.error("Errore durante l'aggiornamento della password");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Row justify='center' align='middle' style={{ minHeight: "400px" }}>
        <Spin size='large' />
      </Row>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <Row justify='center' style={{ marginTop: 50 }}>
        <Col span={12}>
          <Alert
            message='Errore'
            description='Impossibile caricare il profilo utente'
            type='error'
            showIcon
          />
        </Col>
      </Row>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={100}
                src={userProfile.photoURL || firebaseUser.photoURL}
                icon={<UserOutlined />}
                style={{ marginBottom: 16 }}
              />
              <h2 style={{ margin: "8px 0 4px" }}>
                {userProfile.displayName || firebaseUser.displayName}
              </h2>
              <p style={{ color: "#666", margin: "0 0 12px" }}>
                {userProfile.email || firebaseUser.email}
              </p>
              <Space
                wrap
                style={{ marginBottom: 12, justifyContent: "center" }}
              >
                {userProfile.role &&
                  userProfile.role.length > 0 &&
                  userProfile.role.map((role) => (
                    <Tag
                      key={role}
                      color={getRoleColor(role)}
                      icon={role === "admin" ? <CrownOutlined /> : undefined}
                    >
                      {getRoleLabel(role)}
                    </Tag>
                  ))}
              </Space>
              <div style={{ marginBottom: 16 }}>
                {firebaseUser.emailVerified ? (
                  <Tag color='green'>Email Verificata</Tag>
                ) : (
                  <Tag color='orange'>Email Non Verificata</Tag>
                )}
                {userProfile.disabled && (
                  <Tag color='red'>Account Disabilitato</Tag>
                )}
              </div>
            </div>
          </Card>

          <Card title='Informazioni Account' size='small'>
            <div style={{ fontSize: "13px" }}>
              <Row style={{ marginBottom: 12 }}>
                <Col span={10} style={{ color: "#999" }}>
                  Account creato:
                </Col>
                <Col span={14}>
                  {userProfile.createdAt instanceof Timestamp
                    ? userProfile.createdAt.toDate().toLocaleDateString("it-IT")
                    : "N/A"}
                </Col>
              </Row>
              <Row style={{ marginBottom: 12 }}>
                <Col span={10} style={{ color: "#999" }}>
                  Ultimo accesso:
                </Col>
                <Col span={14}>
                  {userProfile.lastLoginAt instanceof Timestamp
                    ? userProfile.lastLoginAt
                        .toDate()
                        .toLocaleDateString("it-IT")
                    : "N/A"}
                </Col>
              </Row>
          
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title='Modifica Profilo' extra={<EditOutlined />}>
            <Form form={form} layout='vertical' onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name='displayName'
                    label='Nome'
                    rules={[
                      { required: true, message: "Inserisci il tuo nome" },
                      {
                        min: 2,
                        message: "Il nome deve avere almeno 2 caratteri",
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder='Inserisci il tuo nome'
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name='email' label='Email'>
                    <Input
                      prefix={<MailOutlined />}
                      disabled
                      style={{ color: "#000" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name='phoneNumber' label='Numero di Telefono'>
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder='Inserisci il tuo numero di telefono'
                />
              </Form.Item>

              <Form.Item label='Immagine Profilo'>
                <Upload
                  name='file'
                  action='/upload.do'
                  listType='picture'
                  fileList={fileList}
                  onChange={handleUpload}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    Carica Immagine Profilo
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type='primary'
                    htmlType='submit'
                    loading={loading}
                    size='large'
                  >
                    Aggiorna Profilo
                  </Button>
                  <Button
                    icon={<KeyOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                    size='large'
                  >
                    Cambia Password
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        title='Cambia Password'
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout='vertical'
          onFinish={handleUpdatePassword}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name='currentPassword'
            label='Password Attuale'
            rules={[
              { required: true, message: "Inserisci la password attuale" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Inserisci la password attuale'
            />
          </Form.Item>

          <Form.Item
            name='newPassword'
            label='Nuova Password'
            rules={[
              { required: true, message: "Inserisci la nuova password" },
              { min: 6, message: "La password deve avere almeno 6 caratteri" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Inserisci la nuova password'
            />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            label='Conferma Nuova Password'
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Conferma la nuova password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Le password non corrispondono")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Conferma la nuova password'
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
              >
                Annulla
              </Button>
              <Button
                type='primary'
                htmlType='submit'
                loading={passwordLoading}
                danger
              >
                Cambia Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
