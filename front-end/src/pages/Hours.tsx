import React, { useState, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import DatePicker from "react-datepicker";
import SortSvg from "../icons/sort";
import "../styles/Hours.css";
import { setTime, editHours } from "../api"; // Import the setTime function

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

const Hours: React.FC = () => {
  const { loading, employees, getMonthIdx, getDayIdx, hours, uid, token } =
    useContext(AdminContext);
  const [visibleCols, setVisibleCols] = useState<number>(1);
  const [sorted, setSorted] = useState(false);
  const [hideEmptyEmployees, setHideEmptyEmployees] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isEditing, setIsEditing] = useState(false);

  const [editedHours, setEditedHours] = useState<Hours>(hours);
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "ascending",
  });

  console.log(hours);

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
    for (const date of dates) {
      const monthIdx = date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .split("/")
        .join("-");
      if (hours && hours[monthIdx] && hours[monthIdx][employee.uid]) {
        return true;
      }
    }
    return false;
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
    const hoursToUpdate: {
      [employeeId: string]: { starttime?: Date; endtime?: Date };
    } = {};
    const currentDate = selectedDate ? selectedDate : new Date();
    const datePart = currentDate.toISOString().split("T")[0];
    for (const employeeId in editedHours) {
      const { starttime, endtime } = editedHours[employeeId];
      if (starttime || endtime) {
        if (!hoursToUpdate[employeeId]) {
          hoursToUpdate[employeeId] = {};
        }
        hoursToUpdate[employeeId] = {
          starttime: starttime
            ? new Date(`${datePart}T${starttime}:00`)
            : undefined,
          endtime: endtime ? new Date(`${datePart}T${endtime}:00`) : undefined,
        };
      }
    }

    try {
      await editHours(uid, token, currentDate.toISOString(), hoursToUpdate);
      console.log("Successfully edited hours");
    } catch (err) {
      console.error("Error editing hours:", err);
    }

    setIsEditing(false);
    setEditedHours({});
  };
  const handleTimeChange = (
    date: string,
    employeeId: string,
    field: keyof HoursData,
    value: string | null
  ) => {
    setEditedHours((prevState) => ({
      ...prevState,
      [date]: {
        ...prevState[date],
        [employeeId]: {
          ...prevState[date]?.[employeeId],
          [field]: value || undefined,
        },
      },
    }));
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
                      const dayIdx = getDayIdx(date);
                      const monthIdx = getMonthIdx(date);

                      const isEditable = isEditing;
                      const starttime =
                        editedHours[monthIdx]?.[employee.uid]?.starttime ||
                        (hours as Hours)[monthIdx]?.[employee.uid]?.starttime ||
                        "";
                      const endtime =
                        editedHours[monthIdx]?.[employee.uid]?.endtime ||
                        (hours as Hours)[monthIdx]?.[employee.uid]?.endtime ||
                        "";

                      return (
                        <td key={colIndex}>
                          <>
                            <input
                              type="time"
                              className="timepicker"
                              value={starttime}
                              placeholder="12:00"
                              onChange={(e) =>
                                handleTimeChange(
                                  dayIdx,
                                  employee.uid,
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
                                  dayIdx,
                                  employee.uid,
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
