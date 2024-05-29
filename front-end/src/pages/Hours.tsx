import React, { useState, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import DatePicker from "react-datepicker";
import SortSvg from "../icons/sort";
import "../styles/Hours.css";
import { setTime } from "../api"; // Import the setTime function

interface Employee {
  uid: string;
  firstName: string;
  lastName: string;
}

interface EmployeeHours {
  starttime?: string;
  endtime?: string;
}

const Hours: React.FC = () => {
  const { loading, employees, getEmployeeHours, uid, token } =
    useContext(AdminContext);
  const [visibleCols, setVisibleCols] = useState<number>(1);
  const [sorted, setSorted] = useState(false);
  const [hideEmptyEmployees, setHideEmptyEmployees] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedHours, setEditedHours] = useState<{
    [key: string]: { [date: string]: EmployeeHours };
  }>({});
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "ascending",
  });

  const employeeComparator = (a: Employee, b: Employee) => {
    const key = sortConfig.key as keyof Employee;
    if (sortConfig.direction === "ascending") {
      return a[key] < b[key] ? -1 : 1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  };

  const sortEmployees = (key: keyof Employee) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSorted(!sorted);
    setSortConfig({ key, direction });
  };

  const hasHours = (employee: Employee, dates: Date[]): boolean => {
    return dates.some((date) => getEmployeeHours(employee.uid, date));
  };

  const handleHideEmptyEmployeesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setHideEmptyEmployees(event.target.checked);
  };

  const handleColChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setVisibleCols(Number(event.target.value));
  };

  const generateDates = (
    selectedDate: Date | null,
    visibleCols: number
  ): Date[] => {
    const dates: Date[] = [];
    if (selectedDate) {
      if (visibleCols === 1) {
        dates.push(new Date(selectedDate));
      } else if (visibleCols === 7) {
        const dayOfWeek = selectedDate.getDay();
        const monday = new Date(selectedDate);
        monday.setDate(
          selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        );
        for (let i = 0; i < 7; i++) {
          const newDate = new Date(monday);
          newDate.setDate(monday.getDate() + i);
          dates.push(newDate);
        }
      } else if (visibleCols > 7) {
        const startOfMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
        for (let i = startOfMonth.getDate(); i <= endOfMonth.getDate(); i++) {
          const newDate = new Date(startOfMonth);
          newDate.setDate(i);
          dates.push(newDate);
        }
      }
    }
    return dates;
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedHours({});
  };
  const handleSubmitClick = async () => {
    // Submit the edited hours
    for (const employeeId in editedHours) {
      for (const date in editedHours[employeeId]) {
        const { starttime, endtime } = editedHours[employeeId][date];
        if (starttime || endtime) {
          const dateObj = new Date(date); // Ensure date is a Date object
          const startTimeObj = starttime
            ? new Date(`${date}T${starttime}:00`).toISOString()
            : null;
          const endTimeObj = endtime
            ? new Date(`${date}T${endtime}:00`).toISOString()
            : null;

          console.log(employeeId, startTimeObj, endTimeObj);
          try {
            await setTime(uid, token, employeeId, {
              date: dateObj.toISOString(),
              starttime: startTimeObj,
              endtime: endTimeObj,
            });
          } catch (err) {
            console.error("Error setting time:", err);
          }
        }
      }
    }
    setIsEditing(false);
    setEditedHours({});
  };

  const handleTimeChange = (
    employeeId: string,
    date: Date,
    field: string,
    value: string | null
  ) => {
    const timeValue = value || ""; // Convert null to an empty string
    setEditedHours((prevState) => {
      const dateString = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      return {
        ...prevState,
        [employeeId]: {
          ...prevState[employeeId],
          [dateString]: {
            ...prevState[employeeId]?.[dateString],
            [field]: timeValue,
          },
        },
      };
    });
  };

  const dates = generateDates(selectedDate, visibleCols);
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return (
    <div className="hours-container">
      <div className="hours-table-top-content">
        <div className="hours-container-header">
          <h1>Hours</h1>
          {!isEditing ? (
            <button onClick={handleEditClick}>Edit Hours</button>
          ) : (
            <>
              <button onClick={handleSubmitClick}>Submit</button>
              <button onClick={handleCancelClick}>Cancel</button>
            </>
          )}
        </div>
        <div className="col-selector">
          <div className="hide-empty">
            Hide employees with no hours
            <input
              type="checkbox"
              checked={hideEmptyEmployees}
              onChange={handleHideEmptyEmployeesChange}
            />
          </div>
          <div className="datepicker">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
            />
          </div>
          <div className="display">
            Display Columns
            <select onChange={handleColChange}>
              <option value={1}>Day</option>
              <option value={7}>Week</option>
              <option value={31}>Month</option>
            </select>
          </div>
        </div>
      </div>
      <div className="hours-table">
        {weeks.map((weekDates, weekIndex) => (
          <table key={weekIndex}>
            <thead>
              <tr>
                <th>
                  Employee
                  <SortSvg
                    className={`hours-table-sort ${sorted ? "clicked" : ""}`}
                    onClick={() => sortEmployees("firstName")}
                  />
                </th>
                {weekDates.map((date, index) => (
                  <th key={index}>{date.toLocaleDateString()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees
                .filter((employee) =>
                  hideEmptyEmployees ? hasHours(employee, weekDates) : true
                )
                .sort(employeeComparator)
                .map((employee, employeeIndex) => (
                  <tr key={employeeIndex}>
                    <td>{employee.firstName}</td>
                    {weekDates.map((date, colIndex) => {
                      const dateString = date.toISOString().split("T")[0];
                      const employeeHours = getEmployeeHours(
                        employee.uid,
                        date
                      );
                      const isEditable = isEditing;
                      const starttime =
                        editedHours[employee.uid]?.[dateString]?.starttime ||
                        employeeHours?.starttime ||
                        "";
                      const endtime =
                        editedHours[employee.uid]?.[dateString]?.endtime ||
                        employeeHours?.endtime ||
                        "";

                      return (
                        <td key={colIndex}>
                          <>
                            <input
                              type="time"
                              className="timepicker"
                              value={starttime}
                              onChange={(e) =>
                                handleTimeChange(
                                  employee.uid,
                                  date,
                                  "starttime",
                                  e.target.value
                                )
                              }
                              disabled={!isEditable}
                            />
                            <input
                              type="time"
                              className="timepicker"
                              value={endtime}
                              onChange={(e) =>
                                handleTimeChange(
                                  employee.uid,
                                  date,
                                  "endtime",
                                  e.target.value
                                )
                              }
                              disabled={!isEditable}
                            />
                          </>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
};

export default Hours;
