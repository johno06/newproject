import React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { Button, Col, Form, Input, Layout, Row, Switch, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../../redux/alertSlice";

import signinbg from "../../assets/images/signin.png";

const { Title } = Typography;
const { Content } = Layout;

function onChange(checked) {
  console.log(`switch to ${checked}`);
}

function Login() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const onSubmit = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post("/api/utility/login", values);
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        const token = response.data.data;
        localStorage.setItem("token", token);
        
        // const decodedToken = jwt_decode(token);
        // setUser(decodedToken);
        // setIsLoggedIn(true);
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong", error);
    }
  };

  return (
    <div>
      <Layout className="layout-default layout-signin">
        <Content className="signin">
          <Row gutter={[24, 0]} justify="space-around" align="middle">
            <Col xs={{ span: 24, offset: 0 }} lg={{ span: 7, offset: 0 }} md={{ span: 12 }}>
              <Title className="mb-15">Welcome back!</Title>
              <Title className="font-regular text-muted" level={5}>
                Enter your email and password to sign in
              </Title>
              <Form onFinish={onSubmit} layout="vertical" className="row-col">
                <Form.Item
                  className="username"
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please input your email!",
                    },
                  ]}
                  noStyle
                >
                  <Input placeholder="Email" />
                </Form.Item>

                <Form.Item
                  className="username"
                  label="Password"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your password!",
                    },
                  ]}
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>

                <Form.Item className="align-center" valuePropName="checked">
                  <Switch defaultChecked onChange={onChange} />
                  Remember me
                </Form.Item>

                <Form.Item>
                  <Button type="danger" htmlType="submit" style={{ width: "100%" }}>
                    SIGN IN
                  </Button>
                </Form.Item>
                <p className="font-semibold text-muted">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-dark font-bold">
                    Sign Up
                  </Link>
                </p>
                <Form.Item>
                  <a className="font-semibold" href="/forgot">
                    Forgot password?
                  </a>
                </Form.Item>
              </Form>
            </Col>
            <Col
              className="sign-img "
              style={{
                padding: 12,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              xs={{ span: 24 }}
              lg={{ span: 8 }}
              md={{ span: 12 }}
            >
              <img className="" src={signinbg} alt="" />
            </Col>
          </Row>
        </Content>
      </Layout>
    </div>
  );
}

export default Login;
