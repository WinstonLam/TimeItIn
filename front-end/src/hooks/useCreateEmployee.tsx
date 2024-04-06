import { useContext, useState } from "react";
import { createEmployee } from "../api";
import { AdminContext } from "../providers/AdminContext";

interface Employee {
  firstname: string;
  lastname: string;
  // Add other properties as needed
}

export const useCreateEmployee = () => {
  const [loading, setLoading] = useState(true);
  const { uid, token } = useContext(AdminContext);
  const [response, setResponse] = useState<any>(null);

  const handleCreateEmployee = async (employeeData: Employee) => {
    if (!token) return;

    try {
      const res = await createEmployee(uid, token, employeeData);
      setResponse(res);
    } catch (error) {
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
