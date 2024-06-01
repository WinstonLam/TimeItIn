import { useState, useEffect, useContext, FC, useRef } from "react";
import "../styles/HourRegistration.css";
import { AdminContext } from "../providers/AdminContext";

import { setTime, getHours } from "../api";

import AutocompleteInput from "../components/autocomplete";
import ClockSvg from "../icons/clock";

import Modal from "../components/modal";
import ErrorMessage from "../components/errormessage";

interface NetworkError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

const HourRegistration: FC = () => {
  const [selectedUid, setSelectedUid] = useState<string | "">("");
  const [selectedName, setSelectedName] = useState<string | "">("");
  const [errMessage, setErrMessage] = useState<string | "">("");
  const [startTime, setStartTime] = useState<string | "">("");
  const [endTime, setEndTime] = useState<string | "">("");

  const {
    token,
    uid,
    loading,
    employees,
    getEmployeeHours,
    setHours,
    transformDate,
  } = useContext(AdminContext);

  useEffect(() => {
    if (selectedName !== "") {
      const employee = employees.find(
        (employee) =>
          `${employee.firstName} ${employee.lastName}` === selectedName
      );

      setSelectedUid(employee?.uid || "");
    }
  }, [selectedName, employees]);

  const names =
    employees && employees.length > 0
      ? employees.map(
          (employee) =>
            [employee.uid, `${employee.firstName} ${employee.lastName}`] as [
              string,
              string
            ]
        )
      : [];

  const getTime = (date: string | null) => {
    if (!date) return "";
    const newDate = new Date(date);
    return transformDate(newDate, { time: true });
  };

  const handleChange = async (employeeId: string, name: string) => {
    setErrMessage("");
    setSelectedName(name);
    setSelectedUid(employeeId);

    try {
      const employeeHours = await getEmployeeHours(employeeId, new Date());

      if (employeeHours) {
        setStartTime(getTime(employeeHours.starttime));
        setEndTime(getTime(employeeHours.endtime));
      } else {
        setStartTime("");
        setEndTime("");
      }
    } catch (err) {
      console.error("Error fetching employee hours:", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUid) {
      setErrMessage("Please select an employee");
      return;
    }

    try {
      const currentDate = new Date();
      const res = await setTime(uid, token, selectedUid, currentDate);
      const resHours = await getHours(uid, token, currentDate);
      setHours(resHours);

      setStartTime(getTime(res.starttime));
      setEndTime(getTime(res.endtime));
    } catch (err) {
      const networkError = err as NetworkError;
      // if error code is 400 it means the employee is already clocked in
      if (networkError.response?.status === 400) {
        setErrMessage(networkError.response.data.error);
      }
      console.error(networkError.response?.data.error);
    }
  };

  return loading ? (
    <div>Loading...</div> // Provide a loading state here
  ) : names.length > 0 ? (
    <div className="hour-registration">
      <div className="hour-registration-modal">
        <ClockSvg className="clock-svg" onClick={handleSubmit} />

        <ErrorMessage message={errMessage} show={errMessage ? true : false} />

        <AutocompleteInput suggestions={names} onSelect={handleChange} />
        <div className="times">
          <div className="start-time">
            <p>Start Time</p>
            <div className="time">{startTime}</div>
          </div>
          <div className="end-time">
            <p>End Time</p>
            <div className="time">{endTime}</div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Modal
      title="No Employees Found"
      action={{
        title: "Create Employee",
        link: "/employees",
      }}
    />
  );
};

export default HourRegistration;
