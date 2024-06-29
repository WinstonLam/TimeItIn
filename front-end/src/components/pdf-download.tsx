import React, { useEffect, useRef, useState } from "react";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import IndividualPDF from "./individual-pdf";
import TotalsPDF from "./totals-pdf";
import useStateCallback from "../hooks/useStateCallback";

export interface TransformedEmployeeData {
  type: string;
  name: string;
  dates: {
    [date: string]: {
      starttime: string | null;
      endtime: string | null;
      hours: number | null;
    };
  };
}

export interface TransformedAllEmployeeData {
  type: string;
  data: {
    [uid: string]: TransformedEmployeeData;
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
type ExportType = TransformedEmployeeData | TotalsData;

interface PDFDownloadProps {
  exportData: ExportData;
  exportType: string;
}

const PDFDownload: React.FC<PDFDownloadProps> = ({
  exportData,
  exportType,
}) => {
  const pdfLink = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<boolean>(false);
  const [pdfData, setPdfData] = useState<ExportType>(); // Use the custom hook

  useEffect(() => {
    if (exportData && exportType === "individuals") {
      const data = (exportData as TransformedAllEmployeeData).data;
      setAndPrint(data);
    }
  }, [exportData, exportType]);

  const setAndPrint = async (data: {
    [uid: string]: TransformedEmployeeData;
  }) => {
    for (const uid of Object.keys(data)) {
      const employee = data[uid];
      const name = employee.name;
      const dates = employee.dates;

      await new Promise<void>((resolve) => {
        setPdfData({
          type: "individuals",
          name,
          dates,
        });
        resolve();
      });
    }
    console.log("done");
  };

  useEffect(() => {
    if (status === true) {
      pdfLink.current?.click();
      setStatus(false);
    }
  }, [status]);

  return pdfData && exportType === "individuals" ? (
    <PDFDownloadLink
      document={
        <IndividualPDF
          pdfData={pdfData as TransformedEmployeeData}
          setStatus={setStatus}
        />
      }
      fileName={`Hoursoverview`}
    >
      <div ref={pdfLink} style={{ display: "none" }} />
    </PDFDownloadLink>
  ) : (
    <PDFDownloadLink
      document={
        <TotalsPDF pdfData={exportData as TotalsData[]} setStatus={setStatus} />
      }
      fileName={`Hoursoverview-`}
    />
  );
};

export default PDFDownload;
