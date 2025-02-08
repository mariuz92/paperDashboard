import React from "react";
import {
  type RegisterPageProps,
  type RegisterFormTypes,
  useRouterType,
  useLink,
  useActiveAuthProvider,
  useTranslate,
  useRouterContext,
  useRegister,
} from "@refinedev/core";
import { ThemedTitleV2 } from "@refinedev/antd";
import {
  layoutStyles,
  containerStyles,
  titleStyles,
  headStyles,
  bodyStyles,
} from "./styles";
import {
  Row,
  Col,
  Layout,
  Card,
  Typography,
  Form,
  Input,
  Button,
  type LayoutProps,
  type CardProps,
  type FormProps,
  Divider,
  theme,
} from "antd";
import { ExtendedRegisterFormTypes } from "../../../types/interfaces/extendedRegisterForm";
import { useDocumentTitle } from "@refinedev/react-router";
import { CONFIG } from "../../../config/configuration";

type RegisterProps = RegisterPageProps<LayoutProps, CardProps, FormProps>;
/**
 * **refine** has register page form which is served on `/register` route when the `authProvider` configuration is provided.
 *
 * @see {@link https://refine.dev/docs/ui-frameworks/antd/components/antd-auth-page/#register} for more details.
 */
export const RegisterPage: React.FC<RegisterProps> = ({
  providers,
  loginLink,
  wrapperProps,
  contentProps,
  renderContent,
  formProps,
  title,
  hideForm,
  mutationVariables,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<RegisterFormTypes>();
  const translate = useTranslate();
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();

  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  const authProvider = useActiveAuthProvider();
  const { mutate: register, isLoading } =
    useRegister<ExtendedRegisterFormTypes>({
      v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
    });
  useDocumentTitle(`Register | ${CONFIG.appName}`);

  const PageTitle =
    title === false ? null : (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
          fontSize: "20px",
        }}
      >
        {title ?? <ThemedTitleV2 collapsed={false} />}
      </div>
    );

  const CardTitle = (
    <Typography.Title
      level={3}
      style={{
        color: token.colorPrimaryTextHover,
        ...titleStyles,
      }}
    >
      {translate("pages.register.title", "Sign up for your account")}
    </Typography.Title>
  );

  const renderProviders = () => {
    if (providers && providers.length > 0) {
      return (
        <>
          {providers.map((provider) => {
            return (
              <Button
                key={provider.name}
                type="default"
                block
                icon={provider.icon}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  marginBottom: "8px",
                }}
                onClick={() =>
                  register({
                    ...mutationVariables,
                    providerName: provider.name,
                  })
                }
              >
                {provider.label}
              </Button>
            );
          })}
          {!hideForm && (
            <Divider>
              <Typography.Text
                style={{
                  color: token.colorTextLabel,
                }}
              >
                {translate(
                  "pages.register.divider",
                  translate("pages.login.divider", "or")
                )}
              </Typography.Text>
            </Divider>
          )}
        </>
      );
    }
    return null;
  };

  const CardContent = (
    <Card
      title={CardTitle}
      headStyle={headStyles}
      bodyStyle={bodyStyles}
      style={{
        ...containerStyles,
        backgroundColor: token.colorBgElevated,
      }}
      {...(contentProps ?? {})}
    >
      {/* {renderProviders()} */}
      {!hideForm && (
        <Form<ExtendedRegisterFormTypes>
          layout="vertical"
          form={form}
          onFinish={(values) => register({ ...mutationVariables, ...values })}
          requiredMark={false}
          {...formProps}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              {
                required: true,
                message: "Please enter your name",
              },
            ]}
          >
            <Input size="large" placeholder="Your Name and Surname" />
          </Form.Item>

          {/* Phone Number */}
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              {
                required: true,
                message: "Please enter your phone number",
              },
              {
                pattern: /^[0-9]+$/,
                message: "Please enter a valid phone number",
              },
            ]}
          >
            <Input size="large" placeholder="+1 234 567 890" type="number" />
          </Form.Item>

          <Form.Item
            name="companyName"
            label={translate("pages.register.company", "Company")}
            rules={[
              {
                required: true,
                message: translate(
                  "pages.register.errors.requiredCompany",
                  "Company name is required"
                ),
              },
              {
                type: "string",
                message: translate(
                  "pages.register.errors.validCompany",
                  "Invalid company name"
                ),
              },
            ]}
          >
            <Input
              size="large"
              placeholder={translate(
                "pages.register.fields.company",
                "Company"
              )}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={translate("pages.register.email", "Email")}
            rules={[
              {
                required: true,
                message: translate(
                  "pages.register.errors.requiredEmail",
                  "Email is required"
                ),
              },
              {
                type: "email",
                message: translate(
                  "pages.register.errors.validEmail",
                  "Invalid email address"
                ),
              },
            ]}
          >
            <Input
              size="large"
              placeholder={translate("pages.register.fields.email", "Email")}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={translate("pages.register.fields.password", "Password")}
            rules={[
              {
                required: true,
                message: translate(
                  "pages.register.errors.requiredPassword",
                  "Password is required"
                ),
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="●●●●●●●●" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={translate(
              "pages.register.fields.confirmPassword",
              "Confirm Password"
            )}
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: translate(
                  "pages.register.errors.requiredConfirmPassword",
                  "Please confirm your password"
                ),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      translate(
                        "pages.register.errors.passwordMismatch",
                        "Passwords do not match"
                      )
                    )
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="●●●●●●●●" size="large" />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            {loginLink ?? (
              <Typography.Text
                style={{
                  fontSize: 12,
                  marginLeft: "auto",
                }}
              >
                {translate(
                  "pages.register.buttons.haveAccount",
                  translate(
                    "pages.login.buttons.haveAccount",
                    "Have an account?"
                  )
                )}{" "}
                <ActiveLink
                  style={{
                    fontWeight: "bold",
                    color: token.colorPrimaryTextHover,
                  }}
                  to="/login"
                >
                  {translate(
                    "pages.register.signin",
                    translate("pages.login.signin", "Sign in")
                  )}
                </ActiveLink>
              </Typography.Text>
            )}
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
              block
            >
              {translate("pages.register.buttons.submit", "Sign up")}
            </Button>
          </Form.Item>
        </Form>
      )}
      {hideForm && loginLink !== false && (
        <div
          style={{
            marginTop: hideForm ? 16 : 8,
          }}
        >
          <Typography.Text
            style={{
              fontSize: 12,
            }}
          >
            {translate(
              "pages.register.buttons.haveAccount",
              translate("pages.login.buttons.haveAccount", "Have an account?")
            )}{" "}
            <ActiveLink
              style={{
                fontWeight: "bold",
                color: token.colorPrimaryTextHover,
              }}
              to="/login"
            >
              {translate(
                "pages.register.signin",
                translate("pages.login.signin", "Sign in")
              )}
            </ActiveLink>
          </Typography.Text>
        </div>
      )}
    </Card>
  );

  return (
    <Layout style={layoutStyles} {...(wrapperProps ?? {})}>
      <Row
        justify="center"
        align={hideForm ? "top" : "middle"}
        style={{
          padding: "16px 0",
          minHeight: "100dvh",
          paddingTop: hideForm ? "15dvh" : "16px",
        }}
      >
        <Col xs={22}>
          {renderContent ? (
            renderContent(CardContent, PageTitle)
          ) : (
            <>
              {PageTitle}
              {CardContent}
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
