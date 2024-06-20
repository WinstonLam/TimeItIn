import { useContext, useState } from "react";
import { createEmployee } from "../api";
import { AdminContext } from "../providers/AdminContext";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

interface Employee {
  firstname: string;
  lastname: string;
  // Add other properties as needed
}

export const useCreateEmployee = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);

  const handleCreateEmployee = async (employeeData: Employee) => {
    try {
      const res = await createEmployee(employeeData);
      setResponse(res);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response && err.response.status === 403) {
        logout(true);
        navigate("/");
      } else {
        console.error("Error fetching settings", error);
      }
      console.error(error);
      // handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  return {
    response,
    handleCreateEmployee,
    loading,
  };
};
