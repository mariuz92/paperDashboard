import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Input, Button, notification, Card, Typography } from "antd";
import { validateInvitation } from "../../auth/api/invitationApi"; // Import API for validation
import { LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import { registerWithInvitation, updateEmailVerified } from "../api/authApi";

const { Title } = Typography;

const JoinPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [otpValid, setOtpValid] = useState(false);

  // Extract URL parameters
  const email = searchParams.get("email") || "";
  const tenant = searchParams.get("tenant") || "";
  const otp = searchParams.get("otp") || "";

  useEffect(() => {
    if (email && tenant && otp) {
      form.setFieldsValue({ email, tenant, otp });
    }
  }, [email, tenant, otp, form]);

  // Handle OTP validation
  const handleOtpValidation = async () => {
    try {
      setLoading(true);
      const otpValue = form.getFieldValue("otp");

      if (!otpValue || otpValue.length !== 6) {
        notification.error({
          message: "Invalid OTP",
          description: "OTP must be 6 digits.",
        });
        setLoading(false);
        return;
      }

      const isValid = await validateInvitation(email, otpValue);

      if (isValid) {
        setOtpValid(true);
        notification.success({
          message: "OTP Verified",
          description: "You can now complete your registration.",
        });

        // Update email verification status
        await updateEmailVerified(email);
      } else {
        notification.error({
          message: "Invalid OTP",
          description: "Please enter a valid OTP code.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Verification Failed",
        description: "There was an error verifying your OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle registration submission
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const { password, confirmPassword } = values;

      if (password !== confirmPassword) {
        notification.error({
          message: "Password Mismatch",
          description: "Passwords do not match.",
        });
        setLoading(false);
        return;
      }

      await registerWithInvitation(email, password, tenant);
      notification.success({
        message: "Registration Successful",
        description: "Your account has been successfully created.",
      });
    } catch (error) {
      notification.error({
        message: "Registration Failed",
        description: "There was an error completing your registration.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <Card style={{ width: 400, padding: "20px" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Complete Your Registration
        </Title>
        <Form form={form} layout='vertical' onFinish={onFinish}>
          {!otpValid && (
            <>
              <Form.Item
                name='email'
                label='Email'
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "Valid email is required",
                  },
                ]}
              >
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Form.Item
                name='tenant'
                label='Tenant ID'
                rules={[{ required: true, message: "Tenant ID is required" }]}
              >
                <Input prefix={<SafetyOutlined />} disabled />
              </Form.Item>

              <Form.Item
                name='otp'
                label='OTP Code'
                rules={[
                  { required: true, message: "OTP is required" },
                  { len: 6, message: "OTP must be 6 digits" },
                ]}
              >
                <Input.OTP
                  length={6}
                  inputMode='numeric'
                  //   placeholder='Enter OTP'
                  style={{ textAlign: "center" }}
                />
              </Form.Item>

              <Button
                type='primary'
                onClick={handleOtpValidation}
                loading={loading}
                block
              >
                Verify OTP
              </Button>
            </>
          )}
          {otpValid && (
            <>
              <Form.Item
                name='password'
                label='Password'
                rules={[
                  { required: true, message: "Please enter a password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Enter your password'
                />
              </Form.Item>

              <Form.Item
                name='confirmPassword'
                label='Confirm Password'
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Confirm your password'
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  loading={loading}
                  block
                >
                  Register
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default JoinPage;
