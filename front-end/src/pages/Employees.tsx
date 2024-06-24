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

import { editEmployees, getEmployees, deleteEmployees } from "../api";

const Employees: React.FC = () => {
  const { employees, handleUnlock, locked, setEmployees, logout } =
    useContext(AdminContext);
  const [fetchedEmployees, setFetchedEmployees] = useState<Array<any>>([]);
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (Array.isArray(employees)) {
      setFetchedEmployees(employees);
      setEditedEmployees(employees.map((emp) => ({ ...emp })));
    }
  }, [employees]);

  const headerNames = ["First Name", "Last Name", "Start Date", ""];

  const [sortConfig, setSortConfig] = useState({
    key: 0,
    direction: "ascending",
  });

  const sortData = (index: number) => {
    let direction = "ascending";
    if (sortConfig.key === index && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    const keyMap = ["firstName", "lastName", "startdate"];
    const key = keyMap[index];

    const sortedEmployees = [...fetchedEmployees].sort((a, b) => {
      const aValue = String(a[key] || "");
      const bValue = String(b[key] || "");

      if (aValue < bValue) {
        return direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    setEditedEmployees(sortedEmployees);
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
      updatedEmployees[index][field] = value.toLocaleDateString("en-GB"); // Format as dd/mm/yyyy
    } else {
      updatedEmployees[index][field] = value;
    }
    setEditedEmployees(updatedEmployees);
  };

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

  const handleDelete = async () => {
    try {
      await deleteEmployees(Array.from(selectedIds));
      const resEmployees = await getEmployees();
      setEmployees(resEmployees);
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      setSubmitEmployeesStatus({
        status: true,
        message: "Employee(s) deleted successfully",
      });
    } catch (error) {
      const err = error as AxiosError;
      if (err.response && err.response.status === 403) {
        logout(true);
      } else {
        console.error("Error deleting hours:", error);
      }
    }
  };

  const handleCheckBox = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    const newSelectedIds = new Set(selectedIds);
    if (e.target.checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };


  const parseDate = (dateString: string) => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is zero-based in JavaScript Date
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
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
      {showDeleteModal && (
        <Modal
          title="Deleting Employee(s)"
          desc="Are you sure you want to delete the selected employee(s)?"
          dismiss={handleLocalModal}
          action={{
            title: "Delete",
            onClick: handleDelete,
          }}
          actionB={{
            title: "Cancel",
            onClick: () => {
              setShowDeleteModal(false);
            },
            style: { cancel: true },
          }}
        />
      )}

      <div className="employees-container">
        {addUser ? (
          <EmployeeCreation setAddUser={setAddUser} />
        ) : (
          <>
            <div className="employees-table-top-content">
              <div className="title">
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
                        text="Delete"
                        style={{ cancel: true }}
                        onClick={() => {
                          if (selectedIds.size === 0) {
                            setSubmitEmployeesStatus({
                              status: true,
                              message: "No employees selected",
                            });
                            return;
                          }
                          setShowDeleteModal(true);
                        }}
                      />
                      <Button
                        text="Cancel"
                        style={{ cancel: true }}
                        onClick={() => setEditing(false)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="actions">
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
              </div>
            </div>
            <div className="employees-table">
              <table>
                <thead>

                  <tr>
                    {headerNames.map((name, i) => (
                      <th
                        key={i}
                        className={
                          name === ""
                            ? `employees-table-delete${editing ? "-active" : ""}`
                            : ""
                        }
                      >
                        <div className={"employees-table-header"}>
                          {name}
                          {name !== "" && (
                            <SortSvg
                              className={`employees-table-sort ${i === clickedHeader ? "clicked" : ""
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
                            className={`employees-table-content-val${editing ? "-edit" : ""
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
                            className={`employees-table-content-val${editing ? "-edit" : ""
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
                            className={`employees-table-content-val${editing ? "-edit" : ""
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
                      <td
                        className={`employees-table-delete${editing ? "-active" : ""
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(editedEmployees[i].uid)}
                          onChange={(e) =>
                            handleCheckBox(e, editedEmployees[i].uid)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Employees;
