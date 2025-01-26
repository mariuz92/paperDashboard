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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { auth } from "../../../config/firebaseConfig";
import { updateProfile, updatePassword } from "firebase/auth";
import { IUser } from "../../../types/interfaces/IUser";
import { updateUser } from "../../users/api/userApi";

export const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [localUser, setLocalUser] = useState<any>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  // 1. Get user data from Local Storage on mount
  useEffect(() => {
    const localData = localStorage.getItem("userInfo");
    if (localData) {
      setLocalUser(JSON.parse(localData));
    }
  }, []);

  // 2. Merge Firebase user and local user data
  useEffect(() => {
    // If there's no firebaseUser or localUser, skip
    // (Or handle them separately as you like)
    if (!firebaseUser && !localUser) return;

    // Create a combined user object
    // Prefer Firebase values if they exist; otherwise use Local Storage
    const combinedUser = {
      displayName: firebaseUser?.displayName || localUser?.displayName,
      email: firebaseUser?.email || localUser?.email,
      phoneNumber: firebaseUser?.phoneNumber || localUser?.phone,
      photoURL: firebaseUser?.photoURL || localUser?.photoURL,
    };

    // Populate form
    form.setFieldsValue(combinedUser);

    // If there's a photoURL, initialize the fileList
    if (combinedUser.photoURL) {
      setFileList([
        {
          uid: "-1",
          name: "profile.png",
          status: "done",
          url: combinedUser.photoURL,
        },
      ]);
    }
  }, [firebaseUser, localUser, form]);

  const handleUpload = ({ fileList }: any) => {
    setFileList(fileList);
    if (fileList.length > 0 && fileList[0].status === "done") {
      form.setFieldsValue({ photoURL: fileList[0].url });
      message.success(`${fileList[0].name} caricato con successo`);
    } else if (fileList.length > 0 && fileList[0].status === "error") {
      message.error(`${fileList[0].name} caricamento non riuscito.`);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      if (firebaseUser) {
        // 3. Update the Firebase user’s displayName and photo
        await updateProfile(firebaseUser, {
          displayName: values.displayName,
          photoURL: values.photoURL,
        });

        // Update password if provided
        if (values.password) {
          await updatePassword(firebaseUser, values.password);
        }

        // Update Firestore user data
        const firestoreUserUpdate: Partial<IUser> = {
          displayName: values.displayName,
          photoURL: values.photoURL,
          phoneNumber: values.phoneNumber,
        };
        // Assuming user.uid corresponds to Firestore document ID
        await updateUser(firebaseUser.uid, firestoreUserUpdate);

        message.success("Profilo aggiornato con successo.");
        setFirebaseUser(auth.currentUser); // Refresh user data
      }
    } catch (error) {
      message.error("Aggiornamento del profilo non riuscito.");
      console.error("Errore durante l'aggiornamento del profilo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify='center' style={{ marginTop: 50 }}>
      <Col span={12}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar
              size={100}
              src={firebaseUser?.photoURL || localUser?.photoURL}
            />
            <h2>{firebaseUser?.displayName || localUser?.displayName}</h2>
            <p>{firebaseUser?.email || localUser?.email}</p>
          </div>
          <Form form={form} layout='vertical' onFinish={handleUpdateProfile}>
            <Form.Item name='displayName' label='Name'>
              <Input placeholder='Inserisci il tuo nome' />
            </Form.Item>
            <Form.Item name='email' label='Email'>
              <Input disabled />
            </Form.Item>
            <Form.Item name='photoURL' label='Immagine profilo'>
              <Upload
                name='file'
                action='/upload.do'
                listType='picture'
                fileList={fileList}
                onChange={handleUpload}
              >
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
              </Upload>
            </Form.Item>
            <Form.Item name='phoneNumber' label='Telefono'>
              <Input placeholder='Enter your phone number' />
            </Form.Item>
            <Form.Item name='password' label='Nuova password'>
              <Input.Password placeholder='Inserisci nuova password' />
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit' loading={loading} block>
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};
