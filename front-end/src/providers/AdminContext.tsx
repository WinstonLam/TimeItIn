import React, { createContext, useState, useEffect } from "react";
import { logoutUser, getEmployees, getHours } from "../api";

interface Employee {
  uid: string;
  firstName: string;
  lastName: string;
}
interface HoursData {
  starttime: string;
  endtime: string | null;
}

interface Hours {
  [date: string]: {
    [employeeId: string]: HoursData;
  };
}

interface AdminContextProps {
  uid: string;
  setUid: React.Dispatch<React.SetStateAction<string>>;
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loggedIn: boolean;
  setLoggedin: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
  login: (uid: string, token: string) => void;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  hours: Hours;
  setHours: React.Dispatch<React.SetStateAction<Hours>>;
  getEmployeeHours: (uid: string, date: Date) => HoursData | null;
}

const defaultState: AdminContextProps = {
  uid: "",
  setUid: () => {},
  token: "",
  setToken: () => {},
  loading: false,
  setLoading: () => {},
  loggedIn: false,
  setLoggedin: () => {},
  logout: () => {},
  login: () => {},
  employees: [],
  setEmployees: () => {},
  hours: {},
  setHours: () => {},
  getEmployeeHours: () => null,
};

export const AdminContext = createContext<AdminContextProps>(defaultState);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [uid, setUid] = useState<string>(localStorage.getItem("uid") || "");
  const [token, setToken] = useState<string>(
    localStorage.getItem("token") || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedIn, setLoggedin] = useState<boolean>(false);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const storedEmp = localStorage.getItem("employees");
    return storedEmp && storedEmp !== "undefined" ? JSON.parse(storedEmp) : [];
  });
  const [hours, setHours] = useState<Hours>(() => {
    const storedHours = localStorage.getItem("hours");

    return storedHours && storedHours !== "undefined"
      ? JSON.parse(storedHours)
      : [];
  });

  const getEmployeeHours = (uid: string, date: Date) => {
    let employeeHours = null;
    // transform date to string of dd-mm-yyyy
    const dateIdx = date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");
    if (hours && hours[dateIdx] && hours[dateIdx][uid]) {
      employeeHours = {
        starttime: hours[dateIdx][uid].starttime,
        endtime: hours[dateIdx][uid].endtime,
      };
    }

    return employeeHours;
  };

  const login = async (uid: string, token: string) => {
    setLoading(true);
    setUid(uid);
    setToken(token);
    localStorage.setItem("uid", uid);
    localStorage.setItem("token", token);

    try {
      const currentDate = new Date().toISOString();
      const resEmployees = await getEmployees(uid, token);
      const resHours = await getHours(uid, token, currentDate);

      const employeesArray: Employee[] = Object.values(resEmployees);

      localStorage.setItem("employees", JSON.stringify(employeesArray));
      localStorage.setItem("hours", JSON.stringify(resHours));
      setEmployees(employeesArray);
      setHours(resHours);
    } catch (error) {
      console.error("Error fetching employees:");
    }
    setLoading(false);
    setLoggedin(true);
  };

  const logout = () => {
    logoutUser(); // Assuming this function does not need to be awaited
    localStorage.removeItem("uid");
    localStorage.removeItem("token");
    localStorage.removeItem("employees");
    localStorage.removeItem("hours");
    setUid("");
    setToken("");
    setEmployees([]);
    setHours({});
    setLoggedin(false);
  };

  // Automatically log in if uid and token are found in localStorage
  useEffect(() => {
    if (uid && token) {
      login(uid, token);
    }
  }, [uid, token]);

  const contextValue = {
    uid,
    setUid,
    token,
    setToken,
    loading,
    setLoading,
    loggedIn,
    setLoggedin,
    logout,
    login,
    employees,
    setEmployees,
    hours,
    setHours,
    getEmployeeHours,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};
