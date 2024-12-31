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
import { auth } from "../utils/firebaseConfig";
import { updateProfile, updatePassword } from "firebase/auth";

export const UserPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      console.log("User is logged in");
      form.setFieldsValue({
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
      });
      if (user.photoURL) {
        setFileList([
          {
            uid: "-1",
            name: "profile.png",
            status: "done",
            url: user.photoURL,
          },
        ]);
      }
    } else {
      console.log("No user is logged in.");
    }
  }, [user, form]);

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      if (user) {
        await updateProfile(user, {
          displayName: values.displayName,
          photoURL: values.photoURL,
          phoneNumber: values.phoneNumber,
        });
        if (values.password) {
          await updatePassword(user, values.password);
        }
        message.success("Profile updated successfully.");
        setUser(auth.currentUser); // Refresh user data
      }
    } catch (error) {
      message.error("Failed to update profile.");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = ({ fileList }: any) => {
    setFileList(fileList);
    if (fileList.length > 0 && fileList[0].status === "done") {
      form.setFieldsValue({ photoURL: fileList[0].url });
      message.success(`${fileList[0].name} file uploaded successfully`);
    } else if (fileList.length > 0 && fileList[0].status === "error") {
      message.error(`${fileList[0].name} file upload failed.`);
    }
  };

  return (
    <Row justify='center' style={{ marginTop: 50 }}>
      <Col span={12}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar size={100} src={user?.photoURL} />
            <h2>{user?.displayName || user?.email}</h2>
            <p>{user?.email}</p>
          </div>
          <Form form={form} layout='vertical' onFinish={handleUpdateProfile}>
            <Form.Item name='displayName' label='Name'>
              <Input placeholder='Enter your name' />
            </Form.Item>
            <Form.Item name='email' label='Email'>
              <Input disabled />
            </Form.Item>
            <Form.Item name='photoURL' label='Profile Image URL'>
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
            <Form.Item name='phoneNumber' label='Phone Number'>
              <Input placeholder='Enter your phone number' />
            </Form.Item>
            <Form.Item name='password' label='New Password'>
              <Input.Password placeholder='Enter new password' />
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
