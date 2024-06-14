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
import loadingIcon from "../icons/loading.gif";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OverviewPDF from "../components/pdf";
import _ from 'lodash';

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
  const navigate = useNavigate();
  const [visibleCols, setVisibleCols] = useState<number>(1);
  const [sorted, setSorted] = useState(false);
  const [hideEmptyEmployees, setHideEmptyEmployees] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [editedHours, setEditedHours] = useState<Hours>(hours);
  const [submitHoursStatus, setSubmitHoursStatus] = useState({
    status: false,
    message: "",
  });
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportData, setExportData] = useState<TransformedEmployeeData | null>(
    null
  );


  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "ascending",
  });
  const pdfLink = useRef<HTMLDivElement | null>(null); // Create a ref

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

  const handleHideEmptyEmployeesChange = () => {
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
    setExportMessage("");
    setIsEditing(false);
    setEditedHours(hours);
    resetIncompleteHours();
  };

  const handleSubmitClick = async () => {

    console.log(editedHours === hours)

    if (_.isEqual(editedHours, hours)) { // use lodash to do a deep comparison

      setSubmitHoursStatus({ status: true, message: "No changes detected" });
      return;
    }

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
    setSubmitHoursStatus({ status: true, message: "Hours Updated" });
  };

  const handleTimeChange = (
    date: string,
    employeeId: string,
    field: keyof HoursData,
    value: string | null
  ) => {
    if (!value) return;
    setExportMessage("");

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

  // this function will reset partially edited hours, it will scan editedHours and if for example a input field
  // only is filled in like 12:-- instead of also specifiying the minutes, it will reset the field to the original value
  const resetIncompleteHours = () => {
    let newEditedHours = { ...editedHours };

    for (const date in editedHours) {
      for (const employeeId in editedHours[date]) {
        if (editedHours[date][employeeId].starttime) {
          let p = date.split("-");
          let day = parseInt(p[0], 10);
          let month = parseInt(p[1], 10) - 1; // Month is 0-based in JavaScript Date
          let year = parseInt(p[2], 10);

          const datePart = new Date(year, month, day).toISOString().split("T")[0];
          const time = new Date(`${datePart}T${editedHours[date][employeeId].starttime}:00`);

          if (time.getMinutes() === 0) {
            newEditedHours[date][employeeId].starttime = "";
          }
        }
        if (editedHours[date][employeeId].endtime) {
          let p = date.split("-");
          let day = parseInt(p[0], 10);
          let month = parseInt(p[1], 10) - 1; // Month is 0-based in JavaScript Date
          let year = parseInt(p[2], 10);

          const datePart = new Date(year, month, day).toISOString().split("T")[0];
          const time = new Date(`${datePart}T${editedHours[date][employeeId].endtime}:00`);

          if (time.getMinutes() === 0) {
            newEditedHours[date][employeeId].endtime = null;
          }
        }
      }
    }

    setEditedHours(newEditedHours);
  }


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

  const handleExport = async () => {
    await new Promise<void>((resolve) => {
      setExportMessage("");
      setExporting(true);
      resolve();
    });



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


    if (transformedData.length === 0) {
      setExporting(false);
      setExportMessage("No data to export");
      return;
    }
    for (const employeeData of transformedData) {
      await new Promise<void>((resolve) => {
        setExportData(employeeData);
        resolve();
      });

    }
    setExporting(false);
    setExportMessage("Exported successfully");
    setExportData(null);
  };

  useEffect(() => {
    if (exportData) {
      pdfLink.current?.click();
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
      {submitHoursStatus.status && (
        <Modal
          title={submitHoursStatus.message}

          dismiss={() => setSubmitHoursStatus({ status: false, message: "" })}
          action={{
            title: "Back",
            onClick: () => {
              setSubmitHoursStatus({ status: false, message: "" })
            },
            style: { cancel: true },
          }}
          actionB={{
            title: "Home",
            onClick: () => {
              setSubmitHoursStatus({ status: false, message: "" })
              navigate("/");
            },
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
                  {exporting && <img className="loadingIcon" src={loadingIcon} alt="Loading..." />}
                  {exportMessage && <p>{exportMessage}</p>}

                  <PDFDownloadLink
                    document={
                      exportData ? <OverviewPDF pdfData={exportData} /> : <></>
                    }
                    fileName={`Hoursoverview-${exportData?.name}.pdf`}
                  >
                    {<div ref={pdfLink} style={{ display: "none" }} />}
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
