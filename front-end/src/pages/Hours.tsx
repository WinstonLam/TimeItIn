import React, { useState, useContext, useRef, useEffect } from "react";
import { AdminContext } from "../providers/AdminContext";
import DatePicker from "react-datepicker";
import SortSvg from "../icons/sort";
import "../styles/Hours.css";
import { getHours, editHours } from "../api";
import Button from "../components/button";
import AutocompleteInput from "../components/autocomplete";
import { AxiosError } from "axios";
import Modal from "../components/modal";

import { PDFDownloadLink } from "@react-pdf/renderer";
import OverviewPDF from "../components/pdf";

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

interface TransformedEmployeeData {
  name: string;
  dates: {
    [date: string]: {
      starttime: string | null;
      endtime: string | null;
      hours: number | null;
    };
  };
}

const Hours: React.FC = () => {
  const {
    setHours,
    employees,
    transformDate,
    hours,
    logout,
    handleUnlock,
    locked,
  } = useContext(AdminContext);
  const [visibleCols, setVisibleCols] = useState<number>(1);
  const [sorted, setSorted] = useState(false);
  const [hideEmptyEmployees, setHideEmptyEmployees] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [editedHours, setEditedHours] = useState<Hours>(hours);
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [exportData, setExportData] = useState<TransformedEmployeeData | null>(
    null
  );
  const [exportQueue, setExportQueue] = useState<TransformedEmployeeData[]>([]);
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "ascending",
  });
  const pdfLink = useRef<HTMLDivElement | null>(null); // Create a ref
  const exportInProgress = useRef<boolean>(false); // Ref to track export in progress


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
  ) => {
    setHideEmptyEmployees(!hideEmptyEmployees);
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

  const handleNameChange = (employeeId: string, name: string) => {
    if (employeeId === "all") {
      setSelectedEmployeeId("");
    } else setSelectedEmployeeId(employeeId);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSubmitClick = async () => {
    // Submit the edited hours

    const currentDate = selectedDate ? selectedDate : new Date();

    try {
      await editHours(currentDate.toISOString(), editedHours);
      const resHours = await getHours(currentDate);
      setHours(resHours);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response && err.response.status === 403) {
        logout();
      } else {
        console.error("Error editing hours:", error);
      }
    }

    setIsEditing(false);
  };

  const handleTimeChange = (
    date: string,
    employeeId: string,
    field: keyof HoursData,
    value: string | null
  ) => {
    if (!value) return;

    let p = date.split("-");
    let day = parseInt(p[0], 10);
    let month = parseInt(p[1], 10) - 1; // Month is 0-based in JavaScript Date
    let year = parseInt(p[2], 10);

    const datePart = new Date(year, month, day).toISOString().split("T")[0];
    const time = new Date(`${datePart}T${value}:00`);

    setEditedHours((prevState) => ({
      ...prevState,
      [date]: {
        ...prevState[date],
        [employeeId]: {
          ...prevState[date]?.[employeeId],
          [field]: time || undefined,
        },
      },
    }));
  };

  const handleChangeLocal = async (value: string) => {
    setFormSubmitted(false);
    setPincode(value);
    if (value.length === 4) {
      setFormSubmitted(true);
      const res = await handleUnlock(value, "local");
      if (res === "") {
        setShowLocalModal(false);
        setIsEditing(true);
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
      setIsEditing(true);
    }
  };

  const handleExport = () => {
    const visibleEmployees = employees
      .filter((employee) =>
        hideEmptyEmployees ? hasHours(employee, dates) : true
      )
      .filter((employee) =>
        selectedEmployeeId ? employee.uid === selectedEmployeeId : true
      );

    const transformedData: TransformedEmployeeData[] = visibleEmployees
      .map((employee) => {
        const employeeData: TransformedEmployeeData = {
          name: `${employee.firstName} ${employee.lastName}`,
          dates: {},
        };

        dates.forEach((date) => {
          const dayIdx = transformDate(date, {
            day: true,
            month: true,
            year: true,
          });

          if (hours[dayIdx] && hours[dayIdx][employee.uid]) {
            const starttime = hours[dayIdx][employee.uid].starttime;
            const endtime = hours[dayIdx][employee.uid].endtime;

            const hoursWorked =
              endtime && starttime
                ? (new Date(endtime).getTime() -
                  new Date(starttime).getTime()) /
                (1000 * 60 * 60)
                : null;

            employeeData.dates[dayIdx] = {
              starttime,
              endtime,
              hours: hoursWorked,
            };
          }
        });

        return employeeData;
      })
      .filter((employeeData) => Object.keys(employeeData.dates).length > 0);

    setExportQueue(transformedData);
  };

  useEffect(() => {
    if (!exportInProgress.current && exportQueue.length > 0) {
      exportInProgress.current = true;
      const nextExportData = exportQueue[0];
      setExportData(nextExportData);
      setExportQueue((queue) => queue.slice(1));
    }
  }, [exportQueue, exportInProgress]);

  useEffect(() => {
    if (exportData) {
      pdfLink.current?.click();
      exportInProgress.current = false; // Allow the next export to proceed
    }
  }, [exportData]);

  const getTime = (date: string | null) => {
    if (!date) return "";
    const newDate = new Date(date);
    return transformDate(newDate, { time: true });
  };

  const dates = generateDates(selectedDate, visibleCols);
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

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
      <div
        className={`hours-container ${visibleCols === 1
          ? "one-col"
          : visibleCols === 7
            ? "seven-cols"
            : visibleCols === 31
              ? "thirty-one-cols"
              : ""
          }`}
      >
        <div className="hours-table-top-content">
          <div className="hours-container-header">
            <h1>Hours</h1>
            <div className="hours-cointainer-header-actions">
              {!isEditing ? (
                <Button text="Edit Hours" onClick={handleLocalModal} />
              ) : (
                <>
                  <Button
                    text="Submit"
                    onClick={handleSubmitClick}
                    type="submit"
                  />
                  <Button
                    text="Cancel"
                    onClick={handleCancelClick}
                    type="reset"
                    style={{ cancel: true }}
                  />
                  <Button text="Export" onClick={handleExport} />
                  <PDFDownloadLink
                    document={
                      exportData ? <OverviewPDF pdfData={exportData} /> : <></>
                    }
                    fileName={`Hoursoverview-${exportData?.name}.pdf`}
                  >
                    {() => <div ref={pdfLink} style={{ display: "none" }} />}
                  </PDFDownloadLink>
                </>
              )}
            </div>
          </div>
          <div className="col-selector">
            <div className="hide-empty">
              <Button
                text="Hide No Hours"
                onClick={handleHideEmptyEmployeesChange}
              />
            </div>
            <div className="namepicker">
              <AutocompleteInput
                suggestions={[["all", "All Employees"], ...names]}
                onSelect={handleNameChange}
              />
            </div>
            <div className="datepicker">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
              />
            </div>
            <div className="display">
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
                  .filter((employee) =>
                    selectedEmployeeId
                      ? employee.uid === selectedEmployeeId
                      : true
                  )
                  .sort(employeeComparator)
                  .map((employee, employeeIndex) => (
                    <tr key={employeeIndex}>
                      <td>
                        <div className="row-name">{employee.firstName}</div>
                      </td>
                      {weekDates.map((date, colIndex) => {
                        const dayIdx = transformDate(date, {
                          day: true,
                          month: true,
                          year: true,
                        });

                        const isEditable = isEditing;
                        const starttime =
                          getTime(
                            editedHours[dayIdx]?.[employee.uid]?.starttime
                          ) || "";
                        const endtime =
                          getTime(
                            editedHours[dayIdx]?.[employee.uid]?.endtime
                          ) || "";

                        return (
                          <td key={colIndex}>
                            <>
                              <input
                                type="time"
                                className={`timepicker${isEditable ? `-enabled` : ""
                                  }`}
                                value={starttime}
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
                                className={`timepicker${isEditable ? `-enabled` : ""
                                  }`}
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
    </>
  );
};

export default Hours;
