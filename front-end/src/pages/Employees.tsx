import React, { useState, useEffect, useContext } from "react";
import "../styles/Employees.css";
import SortSvg from "../icons/sort";
import AddUserSvg from "../icons/add-user";
import EmployeeCreation from "./EmployeeCreation";
import Modal from "../components/modal";
import Button from "../components/button";
import DatePicker from "react-datepicker";

import { AxiosError } from "axios";
import { AdminContext } from "../providers/AdminContext";

import "react-datepicker/dist/react-datepicker.css";
import _, { set } from "lodash";

import { editEmployees, getEmployees } from "../api";

const Employees: React.FC = () => {
  const { employees, handleUnlock, locked, setEmployees, logout } =
    useContext(AdminContext);
  const [fetchedEmployees, setFetchedEmployees] = useState<Array<any>>([]);
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [clickedHeader, setClickedHeader] = useState<number | null>(null);
  const [rowLimit, setRowLimit] = useState(5);
  const [addUser, setAddUser] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedEmployees, setEditedEmployees] = useState<Array<any>>(
    _.cloneDeep(employees)
  );
  const [submitEmployeesStatus, setSubmitEmployeesStatus] = useState({
    status: false,
    message: "",
  });

  useEffect(() => {
    if (Array.isArray(employees)) {
      setFetchedEmployees(employees);
      setEditedEmployees(employees.map((emp) => ({ ...emp })));
    }
  }, [employees]);

  const headerNames = ["First Name", "Last Name", "Start Date", ""];
  console.log(employees, editedEmployees);

  const [sortConfig, setSortConfig] = useState({
    key: 0,
    direction: "ascending",
  });

  const sortData = (index: number) => {
    let direction = "ascending";
    if (sortConfig.key === index && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    const sortedEmployees = [...fetchedEmployees].sort((a, b) => {
      const aValue = String(Object.values(a)[index]);
      const bValue = String(Object.values(b)[index]);

      if (aValue < bValue) {
        return direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    setFetchedEmployees(sortedEmployees);
    setSortConfig({ key: index, direction });
    setClickedHeader(clickedHeader === index ? null : index);
  };

  const handleRowLimitChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowLimit(Number(event.target.value));
  };

  const handleChangeLocal = async (value: string) => {
    setFormSubmitted(false);
    setPincode(value);
    if (value.length === 4) {
      setFormSubmitted(true);
      const res = await handleUnlock(value, "local");
      if (res === "") {
        setShowLocalModal(false);
        setPincode("");
        setFormSubmitted(false);
        setEditing(true);
      } else {
        setError(res);
      }
    }
  };

  const handleLocalModal = () => {
    if (locked) {
      setShowLocalModal(!showLocalModal);
    }
  };

  const handleEditChange = (index: number, field: string, value: any) => {
    const updatedEmployees = [...editedEmployees];
    if (field === "startdate" && value instanceof Date) {
      updatedEmployees[index][field] = value.toISOString().split("T")[0];
    } else {
      updatedEmployees[index][field] = value;
    }
    setEditedEmployees(updatedEmployees);
  };

  //   try {
  //     await editHours(currentDate.toISOString(), editedHours);
  //     const resHours = await getHours(currentDate);
  //     setHours(resHours);
  //   } catch (error) {
  //     const err = error as AxiosError;
  //     if (err.response && err.response.status === 403) {
  //       logout(true);
  //     } else {
  //       setExporting(false);
  //       console.error("Error editing hours:", error);
  //     }
  //   }

  //   setIsEditing(false);
  //   setExporting(false);
  //   setSubmitHoursStatus({ status: true, message: "Hours Updated" });
  // };

  const checkAllFields = () => {
    return editedEmployees.every(
      (emp) =>
        emp.firstName.length > 0 &&
        emp.lastName.length > 0 &&
        emp.startdate.length > 0
    );
  };

  const handleSubmit = async () => {
    // Here you would typically send the edited data to the server
    console.log("Edited employees: ", editedEmployees);
    setFetchedEmployees(editedEmployees);
    setEditing(false);

    if (_.isEqual(editedEmployees, employees)) {
      // use lodash to do a deep comparison
      setSubmitEmployeesStatus({
        status: true,
        message: "No changes detected",
      });
      return;
    }
    if (!checkAllFields()) {
      setSubmitEmployeesStatus({
        status: true,
        message: "Not all fields are filled in correctly",
      });
      return;
    }

    try {
      await editEmployees(editedEmployees);
      const resEmployees = await getEmployees();
      setEmployees(resEmployees);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response && err.response.status === 403) {
        logout(true);
      } else {
        console.error("Error editing hours:", error);
      }
    }

    setSubmitEmployeesStatus({
      status: true,
      message: "Changes submitted",
    });
  };

  const parseDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <>
      {submitEmployeesStatus.status && (
        <Modal
          title={submitEmployeesStatus.message}
          dismiss={() =>
            setSubmitEmployeesStatus({ status: false, message: "" })
          }
          action={{
            title: "Keep Editing",
            onClick: () => {
              setEditing(true);
              setSubmitEmployeesStatus({ status: false, message: "" });
            },
          }}
          actionB={{
            title: "Cancel",
            onClick: () => {
              setSubmitEmployeesStatus({ status: false, message: "" });
            },
            style: { cancel: true },
          }}
        />
      )}
      {showLocalModal && (
        <Modal
          title="Pincode Required"
          desc="Please enter your pincode to access this feature"
          dismiss={handleLocalModal}
          input={{
            value: pincode,
            label: "Pincode",
            id: "pincode",
            required: true,
            sensitive: true,
            formSubmitted: formSubmitted,
            limit: 4,
            onChange: handleChangeLocal,
            strict: "digit",
            span: error,
          }}
        />
      )}
      <div className="employees-container">
        {addUser ? (
          <EmployeeCreation setAddUser={setAddUser} />
        ) : (
          <div className="employees-table">
            <table>
              <thead>
                <tr className="employees-table-top-content">
                  <th className="title">
                    <h1>Employees</h1>

                    <div className="employees-table-edit">
                      {!editing ? (
                        <Button
                          text="Edit"
                          onClick={() => {
                            if (locked) {
                              handleLocalModal();
                            } else {
                              setEditing(true);
                            }
                          }}
                        />
                      ) : (
                        <>
                          <Button text="Submit" onClick={handleSubmit} />
                          <Button
                            text="Cancel"
                            style={{ cancel: true }}
                            onClick={() => setEditing(false)}
                          />
                        </>
                      )}
                    </div>
                  </th>

                  <th className="actions">
                    {editing ? (
                      <div
                        className="add-user"
                        onClick={() => {
                          setAddUser(true);
                        }}
                      >
                        <AddUserSvg className="icon" />
                        Add Employee
                      </div>
                    ) : (
                      <div className="add-user"></div>
                    )}

                    <div className="row-selector">
                      <select onChange={handleRowLimitChange}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                      </select>
                      Display
                    </div>
                  </th>
                </tr>
                <tr>
                  {headerNames.map((name, i) => (
                    <th key={i}>
                      <div className="employees-table-header">
                        {name}
                        {name !== "" && (
                          <SortSvg
                            className={`employees-table-sort ${
                              i === clickedHeader ? "clicked" : ""
                            }`}
                            onClick={() => sortData(i)}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetchedEmployees.slice(0, rowLimit).map((employee, i) => (
                  <tr key={i}>
                    <td>
                      <div className="employees-table-content">
                        <div
                          className={`employees-table-content-val${
                            editing ? "-edit" : ""
                          }`}
                        >
                          <input
                            value={editedEmployees[i].firstName}
                            disabled={!editing}
                            maxLength={25}
                            onChange={(e) =>
                              handleEditChange(i, "firstName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="employees-table-content">
                        <div
                          className={`employees-table-content-val${
                            editing ? "-edit" : ""
                          }`}
                        >
                          <input
                            value={editedEmployees[i].lastName}
                            disabled={!editing}
                            maxLength={25}
                            onChange={(e) =>
                              handleEditChange(i, "lastName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="employees-table-content">
                        <div
                          className={`employees-table-content-val${
                            editing ? "-edit" : ""
                          }`}
                        >
                          <DatePicker
                            selected={parseDate(editedEmployees[i].startdate)}
                            disabled={!editing}
                            onChange={(date) =>
                              handleEditChange(i, "startdate", date)
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td className="employees-table-td-actions"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Employees;
