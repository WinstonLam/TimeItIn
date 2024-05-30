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
  getEmployeeHours: (
    employeeId: string,
    date: Date
  ) => Promise<HoursData | null>;
  transformDate: (
    date: Date,
    options: { day?: boolean; month?: boolean; year?: boolean; time?: boolean }
  ) => string;
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
  getEmployeeHours: async () => null,
  transformDate: () => "",
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

  const transformDate = (
    date: Date,
    options: { day?: boolean; month?: boolean; year?: boolean; time?: boolean }
  ): string => {
    const { day, month, year, time } = options;

    // Ensure time cannot be true if any of the date arguments are true
    if (time && (day || month || year)) {
      throw new Error(
        "The 'time' option cannot be true if any of 'day', 'month', or 'year' are true."
      );
    }

    if (time) {
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      return date.toLocaleTimeString("en-GB", timeOptions); // en-GB ensures 24-hour format
    } else {
      let dateString = "";
      if (day) {
        dateString += date.getDate().toString().padStart(2, "0");
      }
      if (month) {
        if (dateString) dateString += "-";
        dateString += (date.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is zero-based
      }
      if (year) {
        if (dateString) dateString += "-";
        dateString += date.getFullYear();
      }
      return dateString;
    }
  };

  const getEmployeeHours = async (employeeId: string, date: Date) => {
    let employeeHours = null;
    // transform date to string of dd-mm-yyyy
    const dateIdx = transformDate(date, { day: true, month: true, year: true });

    if (hours && hours[dateIdx] && hours[dateIdx][employeeId]) {
      employeeHours = {
        starttime: hours[dateIdx][employeeId].starttime,
        endtime: hours[dateIdx][employeeId].endtime,
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
    transformDate,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};
