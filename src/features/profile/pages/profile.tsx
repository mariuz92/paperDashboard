import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { auth } from "../../../config/firebaseConfig";
import {
  updateProfile,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";
import { IUser } from "../../../types/interfaces/IUser";
import { updateUser } from "../../users/api/userApi";
import { getProfile, updateUserProfile } from "../api/profile_api";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

export const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  useDocumentTitle(`Profilo | ${CONFIG.appName}`);

  // Listener per rilevare i cambiamenti dello stato di autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Carica i dati utente salvati in locale (se presenti)
  useEffect(() => {
    const localData = localStorage.getItem("userInfo");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);

        setUserProfile(parsed);
      } catch (error) {
        console.error("Errore nel parsing dei dati utente locali:", error);
      }
    }
  }, []);

  // Recupera il profilo dell'utente da Firestore quando firebaseUser è impostato
  useEffect(() => {
    const fetchProfile = async () => {
      if (firebaseUser?.uid) {
        try {
          const profile = await getProfile(firebaseUser.uid);

          setUserProfile(profile);
          form.setFieldsValue({
            displayName: firebaseUser.displayName || profile.displayName,
            email: firebaseUser.email || profile.email,
            phoneNumber: firebaseUser.phoneNumber || profile.phoneNumber,
            photoURL: firebaseUser.photoURL || profile.photoURL,
          });
          if (firebaseUser.photoURL || profile.photoURL) {
            setFileList([
              {
                uid: "-1",
                name: "profile.png",
                status: "done",
                url: firebaseUser.photoURL || profile.photoURL,
              },
            ]);
          }
        } catch (error) {
          message.error("Errore nel recuperare il profilo.");
          console.error(error);
        }
      }
    };
    fetchProfile();
  }, [firebaseUser, form]);

  // Gestione del caricamento dell'immagine di profilo
  const handleUpload = useCallback(
    ({ fileList }: any) => {
      setFileList(fileList);
      if (fileList.length > 0 && fileList[0].status === "done") {
        form.setFieldsValue({ photoURL: fileList[0].url });
        message.success(`${fileList[0].name} caricato con successo`);
      } else if (fileList.length > 0 && fileList[0].status === "error") {
        message.error(`${fileList[0].name} caricamento non riuscito.`);
      }
    },
    [form]
  );

  const handleUpdateProfile = useCallback(
    async (values: any) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const updateData: Partial<IUser> = {
            displayName: values.displayName,
            photoURL: values.photoURL,
            phoneNumber: values.phoneNumber,
          };
          await updateUserProfile(firebaseUser.uid, updateData);
          message.success("Profilo aggiornato con successo.");
          // Aggiorna lo stato locale e il localStorage (opzionale)
          setUserProfile({ ...userProfile, ...updateData } as IUser);
          localStorage.setItem(
            "userInfo",
            JSON.stringify({ ...(userProfile || {}), ...updateData })
          );
        }
      } catch (error) {
        message.error("Aggiornamento del profilo non riuscito.");
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, userProfile]
  );

  return (
    <Row justify="center" style={{ marginTop: 50 }}>
      <Col span={12}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar
              size={100}
              src={firebaseUser?.photoURL || userProfile?.photoURL}
            />
            <h2>{firebaseUser?.displayName || userProfile?.displayName}</h2>
            <p>{firebaseUser?.email || userProfile?.email}</p>
          </div>
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
            <Form.Item name="displayName" label="Nome">
              <Input placeholder="Inserisci il tuo nome" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>
            <Form.Item name="photoURL" label="Immagine profilo">
              <Upload
                name="file"
                action="/upload.do"
                listType="picture"
                fileList={fileList}
                onChange={handleUpload}
              >
                <Button icon={<UploadOutlined />}>Clicca per caricare</Button>
              </Upload>
            </Form.Item>
            <Form.Item name="phoneNumber" label="Telefono">
              <Input
                type="number"
                placeholder="Inserisci il tuo numero di telefono"
              />
            </Form.Item>
            <Form.Item name="password" label="Nuova password">
              <Input.Password placeholder="Inserisci nuova password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Aggiorna profilo
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};
