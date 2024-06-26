import React, { useState, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import { useNavigate } from "react-router-dom";
import FormField from "../components/formfield";
import "../styles/EmployeeCreation.css";
import Button from "../components/button";
import { getEmployees } from "../api";
import { useCreateEmployee } from "../hooks/useCreateEmployee";
import { AxiosError } from "axios";
import Modal from "../components/modal";

interface EmployeeCreationProps {
  setAddUser: (value: boolean) => void;
}

interface Employee {
  uid: string;
  firstName: string;
  lastName: string;
}

const EmployeeCreation: React.FC<EmployeeCreationProps> = ({ setAddUser }) => {
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { setEmployees } = useContext(AdminContext);

  const { handleCreateEmployee } = useCreateEmployee();

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setFormSubmitted(true);

    if (!firstName || !lastName) return;
    try {
      // Try to create the employee
      await handleCreateEmployee({ firstname: firstName, lastname: lastName });

      // Fetch the employees again to update the list
      const res = await getEmployees();
      const employeesArray: Employee[] = Object.values(res);

      await setEmployees(employeesArray);

      // If the employee was created successfully, start the countdown
      setSuccess(true);
    } catch (error) {
      const errorObj = error as AxiosError;
      if (errorObj.response && errorObj.response.status === 403) {
      }
      // If the employee could not be created, display an error message
      if (errorObj.response && errorObj.message) {
        setErrorMessage(errorObj.message);
      } else {
        console.log(error);
        setErrorMessage("An unknown error occurred.");
      }
    }
  };

  const handleBack = () => {
    navigate("/employees");
    setAddUser(false);
  };

  return (
    <div className="employee-creation">
      <div className="employee-creation-modal">
        <h1>Employee Creation Form</h1>
        <div className={`error${errorMessage ? "-show" : ""}`}>
          {errorMessage}
        </div>
        {success && (
          <Modal
            title="Success"
            desc="Employee created successfully!"
            dismiss={() => setSuccess(false)}
            action={{
              title: "Back",
              onClick: () => {
                setSuccess(false);
              },
              style: { cancel: true },
            }}
            actionB={{
              title: "Employees",
              onClick: () => {
                setSuccess(false);
                setAddUser(false);
                navigate("/employees");
              },
            }}
            actionC={{
              title: "Home",
              onClick: () => {
                setSuccess(false);
                navigate("/");
              },
            }}
          />
        )}
        <form onSubmit={handleCreate}>
          <div className="employee-creation-form-fields">
            <div className="row">
              <FormField
                value={firstName}
                label="First Name:"
                id="firstName"
                required={true}
                formSubmitted={formSubmitted}
                onChange={(value) => setFirstName(value)}
                limit={20}
              />
              <FormField
                value={lastName}
                label="Last Name:"
                id="lastName"
                required={true}
                formSubmitted={formSubmitted}
                onChange={(value) => setLastName(value)}
                limit={20}
              />
            </div>
          </div>
          <div className="actions">
            <Button type="submit" text="Create" onClick={handleCreate} />
            <Button
              onClick={handleBack}
              text="Back"
              style={{ cancel: true }}
            />
          </div>
        </form>

      </div>
    </div>
  );
};

export default EmployeeCreation;
