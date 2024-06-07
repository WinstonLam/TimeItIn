import React, { useState, useEffect, useContext } from "react";
import "../styles/Employees.css";
import SortSvg from "../icons/sort";
import AddUserSvg from "../icons/add-user";
import EmployeeCreation from "./EmployeeCreation";
import { AdminContext } from "../providers/AdminContext";
import Modal from "../components/modal";

const Employees: React.FC = () => {
  const { employees, handleUnlock, locked } = useContext(AdminContext);
  const [fetchedEmployees, setFetchedEmployees] = useState<Array<any>>([]);
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [clickedHeader, setClickedHeader] = useState<number | null>(null);
  const [rowLimit, setRowLimit] = useState(5);
  const [addUser, setAddUser] = useState(false);

  useEffect(() => {
    if (Array.isArray(employees)) {
      setFetchedEmployees(employees);
    }
  }, [employees]);

  const headerNames = ["First Name", "Last Name", "Total Hours", "Start Date"];

  const [sortConfig, setSortConfig] = useState({
    key: 0,
    direction: "ascending",
  });

  const sortData = (index: number) => {
    let direction = "ascending";
    if (sortConfig.key === index && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    const sortedEmployees = [...employees].sort((a, b) => {
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
        setAddUser(true);
        setPincode("");
        setFormSubmitted(false);
      } else {
        setError(res);
      }
    }
  };

  const handleLocalModal = () => {
    if (locked) {
      setShowLocalModal(!showLocalModal);
    } else {
      setAddUser(true);
    }
  };

  return (
    <>
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
                  </th>
                  <th />

                  <th className="actions">
                    <div className="add-user">
                      <AddUserSvg className="icon" onClick={handleLocalModal} />
                      Add Employee
                    </div>
                    <div className="row-selector">
                      <select onChange={handleRowLimitChange}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                      </select>
                      Display Rows
                    </div>
                  </th>
                </tr>
                <tr>
                  {headerNames.map((name, i) => (
                    <th key={i}>
                      <div className="employees-table-header">
                        {name}
                        <SortSvg
                          className={`employees-table-sort ${
                            i === clickedHeader ? "clicked" : ""
                          }`}
                          onClick={() => sortData(i)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetchedEmployees.slice(0, rowLimit).map((employee, i) => {
                  const employeeValues = Object.values(employee);
                  return (
                    <tr key={i}>
                      {employeeValues.slice(1).map((value, j) => (
                        <td key={j}>
                          <div className="employees-table-content">
                            <div className="employees-table-content-val">
                              {String(value)}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Employees;
