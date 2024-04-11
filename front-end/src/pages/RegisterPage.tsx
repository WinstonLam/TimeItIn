import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api"; // Adjust the path if necessary
import FormField from "../components/formfield";
import Button from "../components/button";
import "../styles/LoginPage.css";

interface RegisterPageProps {
  setRegister: React.Dispatch<React.SetStateAction<boolean>>;
}

interface AxiosError {
  response?: {
    data?: {
      error: string;
    };
  };
}

interface Data {
  email: string;
  password: string;
  pincode: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setRegister }) => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(5);

  const [data, setData] = useState<Data>({
    email: "",
    password: "",
    pincode: "",
  });
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormSubmitted(true);

    if (!data.email || !data.password || !data.pincode) return;
    try {
      await registerUser(data);
      setSuccess(true);

      const timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
        setFormSubmitted(false);
        setRegister(false);
        setSuccess(false);
        setCountdown(5);
      }, 5000);
    } catch (err) {
      const errorObj = err as AxiosError;
      if (errorObj.response?.data?.error) {
        setErrorMessage(errorObj.response.data.error);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
    }
  };

  return (
    <>
      <h2>Register</h2>

      <div className={`error${errorMessage ? "-show" : ""}`}>
        {errorMessage}
      </div>
      {success ? (
        <div className="succes">
          <h2>Succesfully created new account</h2>
          Redirecting in {countdown} seconds...
          <div className="actions">
            <Button
              onClick={() => setRegister(false)}
              text="Login"
              style={{ cancel: true }}
            />
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleRegister}>
            <FormField
              value={data.email}
              label="Email"
              id="email"
              required={true}
              formSubmitted={formSubmitted}
              onChange={(value) => setData({ ...data, email: value })}
            />
            <FormField
              value={data.password}
              label="Password"
              id="password"
              required={true}
              formSubmitted={formSubmitted}
              onChange={(value) => setData({ ...data, password: value })}
              sensitive={true}
            />
            <FormField
              value={data.pincode}
              label="Pincode"
              id="pincode"
              required={true}
              formSubmitted={formSubmitted}
              onChange={(value) => setData({ ...data, pincode: value })}
              sensitive={true}
              limit={4}
              strict="digit"
            />

            <div className="actions">
              <Button type="submit" text="Create" onClick={handleRegister} />
              <Button
                onClick={() => setRegister(false)}
                text="Back"
                style={{ cancel: true }}
              />
            </div>
          </form>
        </>
      )}
    </>
  );
};

export default RegisterPage;
