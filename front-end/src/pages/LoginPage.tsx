import React, { useContext, useState } from "react";
import { loginUser } from "../api"; // Adjust the path if necessary
import Button from "../components/button";
import FormField from "../components/formfield";
import RegisterPage from "./RegisterPage";
import "../styles/LoginPage.css";
import { AdminContext } from "../providers/AdminContext";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [register, setRegister] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const { login } = useContext(AdminContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (!email || !password) return;

    try {
      const res = await loginUser(email, password);
      console.log(res);
      login(res.uid, res.token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="loginPage">
      <div className="login-modal">
        <div className="login-modal-content">
          {register ? (
            <RegisterPage setRegister={setRegister} />
          ) : (
            <>
              <h2>Login</h2>
              <div className={`error${error ? "-show" : ""}`}>{error}</div>

              <form onSubmit={handleLogin}>
                <FormField
                  value={email}
                  label="Email"
                  id="email"
                  required
                  formSubmitted={formSubmitted}
                  onChange={(value) => setEmail(value)}
                />
                <FormField
                  value={password}
                  label="Password"
                  id="password"
                  required
                  formSubmitted={formSubmitted}
                  onChange={(value) => setPassword(value)}
                  sensitive={true}
                />

                <div className="actions">
                  <Button type="submit" text="Login" onClick={() => {}} />
                  <Button
                    text="Register"
                    onClick={() => setRegister(true)}
                    style={{ cancel: true }}
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
