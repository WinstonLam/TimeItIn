import { useContext } from "react";
import { pdf } from "@react-pdf/renderer";
import IndividualPDF from "../components/individual-pdf";
import TotalsPDF from "../components/totals-pdf";
import { AdminContext } from "../providers/AdminContext";
import JSZip from "jszip";
// Remove import of file-saver since we're not using it
// import { saveAs } from "file-saver";

interface Employee {
  uid: string;
  firstName: string;
  lastName: string;
}

export interface TransformedAllEmployeeData {
  data: {
    [uid: string]: TransformedEmployeeData;
  };
}

export interface TransformedEmployeeData {
  name: string;
  dates: {
    [date: string]: {
      starttime: string | null;
      endtime: string | null;
      hours: number | null;
    };
  };
}

export interface TotalsData {
  name: string;
  totalHours: number;
  workedDays: number;
  startDate: string;
  endDate: string;
}

interface ExportHoursProps {
  data: Employee[];
  dates: Date[];
  type: string;
  setExportMessage: React.Dispatch<React.SetStateAction<string>>;
}

export type ExportData = TransformedAllEmployeeData | TotalsData[] | null;

// Note the change here: ExportType is now an array type
type ExportType = TransformedEmployeeData[] | TotalsData[];

export const useExportHours = () => {
  const { hours, transformDate } = useContext(AdminContext);

  const exportHours = async ({
    data,
    dates,
    type,
    setExportMessage,
  }: ExportHoursProps) => {
    if (data === null) {
      return;
    }

    if (type === "totals") {
      const totalsData = await exportTotals(data, dates, setExportMessage);
      if (!totalsData) {
        return;
      }
      await generatePDF(totalsData, "totals");
    } else if (type === "individuals") {
      const singlesData = await exportIndividuals(
        data,
        dates,
        setExportMessage
      );
      if (!singlesData) {
        return;
      }

      // Collect all TransformedEmployeeData into an array
      const pdfDataArray: TransformedEmployeeData[] = Object.values(
        singlesData.data
      );

      await generatePDF(pdfDataArray, "individuals");
    }
    console.log("done");
  };

  const generatePDF = async (
    pdfDataArray: TransformedEmployeeData[] | TotalsData[],
    type: string
  ) => {
    if (type === "individuals") {
      const zip = new JSZip();

      // pdfDataArray is now an array, so we can iterate over it
      for (const pdfData of pdfDataArray as TransformedEmployeeData[]) {
        const blob = await pdf(
          <IndividualPDF pdfData={pdfData} setStatus={() => {}} />
        ).toBlob();

        const filename = `${pdfData.name}_overview.pdf`;

        // Add the PDF blob to the zip file
        zip.file(filename, blob);
      }

      // Generate the zip file as a Blob
      const content = await zip.generateAsync({ type: "blob" });

      // Create a Blob URL for the zip file
      const url = URL.createObjectURL(content);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = "Individuals_overview.zip";

      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up and remove the link
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (type === "totals") {
      const blob = await pdf(
        <TotalsPDF
          pdfData={pdfDataArray as TotalsData[]}
          setStatus={() => {}}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hoursoverview.pdf`;

      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up and remove the link
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const exportTotals = async (
    visibleEmployees: Employee[],
    dates: Date[],
    setExportMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const totalsData = transformTotalsData(visibleEmployees, dates);

    if (totalsData.length === 0) {
      setExportMessage("No data to export");
      return;
    }

    return totalsData;
  };

  const exportIndividuals = async (
    visibleEmployees: Employee[],
    dates: Date[],
    setExportMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const transformedData = transformAllEmployeeData(visibleEmployees, dates);

    if (transformedData && Object.keys(transformedData.data).length === 0) {
      setExportMessage("No data to export");
      return;
    }

    return transformedData;
  };

  const transformAllEmployeeData = (
    visibleEmployees: Employee[],
    dates: Date[]
  ): TransformedAllEmployeeData => {
    const transformedData: { [uid: string]: TransformedEmployeeData } = {};

    visibleEmployees.forEach((employee) => {
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

          const starttimeDate = starttime && new Date(starttime);
          const endtimeDate = endtime && new Date(endtime);
          const hoursWorked =
            endtimeDate && starttimeDate
              ? (endtimeDate.getTime() - starttimeDate.getTime()) /
                (1000 * 60 * 60)
              : null;

          employeeData.dates[dayIdx] = {
            starttime,
            endtime,
            hours: hoursWorked,
          };
        }
      });

      if (Object.keys(employeeData.dates).length > 0) {
        transformedData[employee.uid] = employeeData;
      }
    });

    return {
      data: transformedData,
    };
  };

  const transformTotalsData = (
    visibleEmployees: Employee[],
    dates: Date[]
  ): TotalsData[] => {
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    return visibleEmployees.map((employee) => {
      let totalHours = 0;
      let workedDays = 0;

      dates.forEach((date) => {
        const dayIdx = transformDate(date, {
          day: true,
          month: true,
          year: true,
        });

        if (hours[dayIdx] && hours[dayIdx][employee.uid]) {
          const starttime = hours[dayIdx][employee.uid].starttime;
          const endtime = hours[dayIdx][employee.uid].endtime;

          const starttimeDate = starttime && new Date(starttime);
          const endtimeDate = endtime && new Date(endtime);
          const hoursWorked =
            endtimeDate && starttimeDate
              ? (endtimeDate.getTime() - starttimeDate.getTime()) /
                (1000 * 60 * 60)
              : 0;

          if (hoursWorked > 0) {
            totalHours += hoursWorked;
            workedDays += 1;
          }
        }
      });

      return {
        name: `${employee.firstName} ${employee.lastName}`,
        totalHours,
        workedDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    });
  };

  return {
    exportHours,
  };
};
