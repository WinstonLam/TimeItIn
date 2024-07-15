import { useState, useEffect, useContext, FC } from "react";
import "../styles/HourRegistration.css";
import { AdminContext } from "../providers/AdminContext";
import { setTime, getHours } from "../api";
import { AxiosError } from "axios";

import AutocompleteInput from "../components/autocomplete";
import ClockSvg from "../icons/clock";
import loadingIcon from "../icons/loading.gif";

import Modal from "../components/modal";
import UpdateMessage from "../components/updatemessage";

interface NetworkError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

interface UpdateMessage {
  message: string;
  success: boolean;
}

const HourRegistration: FC = () => {
  const [selectedUid, setSelectedUid] = useState<string | "">("");
  const [selectedName, setSelectedName] = useState<string | "">("");
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage>({
    message: "",
    success: false,
  });
  const [startTime, setStartTime] = useState<string | "">("");
  const [endTime, setEndTime] = useState<string | "">("");
  const [loading, setLoading] = useState<boolean>(false);

  const { employees, getEmployeeHours, setHours, transformDate, logout } =
    useContext(AdminContext);

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
    setUpdateMessage({ message: "", success: false });
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
    } catch (error) {
      const err = error as AxiosError;

      if (err.response && err.response.status === 403) {
        logout(true);
      } else {
        console.error("Error fetching settings", error);
      }
      console.error("Error fetching employee hours:", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (!selectedUid) {
      setUpdateMessage({
        message: "Please select an employee",
        success: false,
      });
      setLoading(false);
      return;
    }
    if (startTime && endTime) {
      setUpdateMessage({
        message: "Time has already been set",
        success: false,
      });
      setLoading(false);
      return;
    }

    try {
      const currentDate = new Date();

      const res = await setTime(selectedUid, currentDate);
      const resHours = await getHours(currentDate);

      setHours(resHours);

      setStartTime(getTime(res.starttime));
      setEndTime(getTime(res.endtime));
      setUpdateMessage({ message: "Time set successfully", success: true });
    } catch (err) {
      const networkError = err as NetworkError;

      if (networkError.response?.status === 400) {
        setUpdateMessage({
          message: networkError.response.data.error,
          success: false,
        });
      }
      if (networkError.response?.status === 403) {
        logout(true);
      }
      console.error(networkError.response?.data.error);
    }
    setLoading(false);
  };

  return names.length > 0 ? (
    <div className="hour-registration">
      <div className="hour-registration-modal">
        <ClockSvg className="clock-svg" onClick={handleSubmit} />

        <div className="error">
          {loading && (
            <img className="loadingIcon" src={loadingIcon} alt="Loading..." />
          )}
          <UpdateMessage
            message={updateMessage.message}
            show={updateMessage.message ? true : false}
            success={updateMessage.success}
          />
        </div>

        <AutocompleteInput
          suggestions={names}
          onSelect={handleChange}
          title="Select Name:"
        />
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
