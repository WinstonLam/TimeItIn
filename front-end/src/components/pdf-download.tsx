import React, { useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import IndividualPDF from "./individual-pdf";
import TotalsPDF from "./totals-pdf";

export interface TransformedAllEmployeeData {
  type: string;
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
  type: string;
  name: string;
  totalHours: number;
  workedDays: number;
  startDate: string;
  endDate: string;
}

export type ExportData = TransformedAllEmployeeData | TotalsData[] | null;
type ExportType = TransformedEmployeeData | TotalsData[];

interface PDFDownloadProps {
  exportData: ExportData;
  exportType: string;
}

const PDFDownload: React.FC<PDFDownloadProps> = ({
  exportData,
  exportType,
}) => {


  const generatePDF = async (pdfData: ExportType, type: string) => {
    let url = "";
    if (type === "individuals") {
      const blob = await pdf(<IndividualPDF pdfData={pdfData as TransformedEmployeeData} setStatus={() => { }} />).toBlob();
      url = URL.createObjectURL(blob);

    }
    else if (type === "totals") {
      const blob = await pdf(<TotalsPDF pdfData={pdfData as TotalsData[]} setStatus={() => { }} />).toBlob();
      url = URL.createObjectURL(blob);
    }

    // Create a link element
    const link = document.createElement("a");
    link.href = url;

    if (type === "individuals") {
      const hoursData = pdfData as TransformedEmployeeData;
      link.download = `${hoursData.name}_overview.pdf`;
    }
    else if (type === "totals") {
      link.download = `Hoursoverview.pdf`;
    }


    // Append to the document and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  useEffect(() => {
    if (exportData && exportType === "individuals") {
      const data = (exportData as TransformedAllEmployeeData).data;
      setAndCreate(data);
    }
  }, [exportData, exportType]);

  const setAndCreate = async (data: {
    [uid: string]: TransformedEmployeeData;
  }) => {
    for (const uid of Object.keys(data)) {
      const employee = data[uid];
      const name = employee.name;
      const dates = employee.dates;
      const newPdfData = { type: "individuals", name, dates };

      await new Promise<void>((resolve) => {
        generatePDF(newPdfData, "individuals")

        resolve();
      });
    }
    console.log("done");
  };


  return (
    <></>
  );
};

export default PDFDownload;
