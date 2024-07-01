import {
  Image,
  Text,
  View,
  Page,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import React, { useEffect } from "react";

const logo = require("../icons/logo.png") as string;

interface TotalsData {
  name: string;
  totalHours: number;
  workedDays: number;
  startDate: string;
  endDate: string;
}

interface TotalsPDFProps {
  pdfData: TotalsData[];
  setStatus: (status: boolean) => void;
}

const TotalsPDF: React.FC<TotalsPDFProps> = ({ pdfData, setStatus }) => {
  useEffect(() => {
    if (pdfData !== null) {
      setStatus(true);
    }
  }, [pdfData]);

  const styles = StyleSheet.create({
    page: {
      fontSize: 11,
      paddingTop: 20,
      paddingLeft: 40,
      paddingRight: 40,
      lineHeight: 1.5,
      flexDirection: "column",
    },

    spaceBetween: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#3E3E3E",
    },

    titleContainer: { flexDirection: "row", marginTop: 24 },

    logo: { width: 90 },

    reportTitle: { fontSize: 16, textAlign: "center" },

    addressTitle: { fontSize: 11, fontStyle: "bold" },

    invoice: { fontWeight: "bold", fontSize: 20 },

    invoiceNumber: { fontSize: 11, fontWeight: "bold" },

    address: { fontWeight: 400, fontSize: 10 },

    theader: {
      marginTop: 20,
      fontSize: 10,
      fontStyle: "bold",
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1,
      height: 20,
      backgroundColor: "#DEDEDE",
      borderColor: "whitesmoke",
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },

    theader2: { flex: 2, borderRightWidth: 0, borderBottomWidth: 1 },

    tbody: {
      fontSize: 9,
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1,
      borderColor: "whitesmoke",
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },

    total: {
      fontSize: 9,
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1.5,
      borderColor: "whitesmoke",
      borderBottomWidth: 1,
    },

    tbody2: { flex: 2, borderRightWidth: 1 },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const InvoiceTitle = () => (
    <View style={styles.titleContainer}>
      <View style={styles.spaceBetween}>
        <Image style={styles.logo} src={logo} />
        <Text style={styles.reportTitle}>Originals</Text>
      </View>
    </View>
  );

  const Address = () => (
    <View style={styles.titleContainer}>
      <View style={styles.spaceBetween}>
        <View>
          <Text style={styles.invoice}>Hours Overview </Text>
          <Text style={styles.invoiceNumber}>
            Created on: {formatDate(new Date())}
          </Text>
        </View>
      </View>
    </View>
  );

  const UserAddress = () => (
    <View style={styles.titleContainer}>
      <View style={styles.spaceBetween}>
        <View style={{ maxWidth: 200 }}>
          <Text style={styles.addressTitle}>Date Range: </Text>
          <Text style={styles.address}>
            {pdfData && pdfData.length > 0
              ? `${formatDate(new Date(pdfData[0].startDate))} - ${formatDate(
                new Date(pdfData[0].endDate)
              )}`
              : "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );

  const TableHead = () => (
    <View style={{ width: "100%", flexDirection: "row", marginTop: 10 }}>
      <View style={[styles.theader, styles.theader2]}>
        <Text>Employee Name</Text>
      </View>
      <View style={styles.theader}>
        <Text>Total Hours</Text>
      </View>
      <View style={styles.theader}>
        <Text>Worked Days</Text>
      </View>
      <View style={styles.theader}>
        <Text>Date Range</Text>
      </View>
    </View>
  );

  const TableBody = () =>
    pdfData && pdfData.length > 0 ? (
      pdfData.map((data) => (
        <View key={data.name} style={{ width: "100%", flexDirection: "row" }}>
          <View style={[styles.tbody, styles.tbody2]}>
            <Text>{data.name}</Text>
          </View>
          <View style={styles.tbody}>
            <Text>{data.totalHours.toFixed(2)}</Text>
          </View>
          <View style={styles.tbody}>
            <Text>{data.workedDays}</Text>
          </View>
          <View style={styles.tbody}>
            <Text>
              {formatDate(new Date(data.startDate))} -{" "}
              {formatDate(new Date(data.endDate))}
            </Text>
          </View>
        </View>
      ))
    ) : (
      <View style={{ width: "100%", flexDirection: "row" }}>
        <Text>No data available</Text>
      </View>
    );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceTitle />
        <Address />
        <UserAddress />
        <TableHead />
        <TableBody />
      </Page>
    </Document>
  );
};

export default TotalsPDF;
