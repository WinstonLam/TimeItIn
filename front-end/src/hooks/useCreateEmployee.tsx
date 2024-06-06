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
  const [response, setResponse] = useState<any>(null);

  const handleCreateEmployee = async (employeeData: Employee) => {


    try {
      const res = await createEmployee(employeeData);
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
