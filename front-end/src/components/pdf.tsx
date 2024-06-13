import {
  Image,
  Text,
  View,
  Page,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import React, { useContext } from "react";
import { AdminContext } from "../providers/AdminContext";

const logo = require("../icons/logo.png") as string;

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

interface OverviewPDFProps {
  pdfData: TransformedEmployeeData;
}

const OverviewPDF: React.FC<OverviewPDFProps> = ({ pdfData }) => {
  const { transformDate } = useContext(AdminContext);
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

  const getTime = (date: string | null) => {
    if (!date) return "";

    // Check if the date string is in ISO format or needs to be adjusted
    let newDate;
    if (!isNaN(Date.parse(date))) {
      newDate = new Date(date);
    } else {
      // If date is not in a valid format, log the issue
      return "";
    }

    const time = transformDate(newDate, { time: true });

    return time;
  };

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
          <Text style={styles.addressTitle}>Overview of: </Text>
          <Text style={styles.address}>{pdfData.name}</Text>
        </View>
      </View>
    </View>
  );

  const TableHead = () => (
    <View style={{ width: "100%", flexDirection: "row", marginTop: 10 }}>
      <View style={[styles.theader, styles.theader2]}>
        <Text>Dates</Text>
      </View>
      <View style={styles.theader}>
        <Text>Start Time</Text>
      </View>
      <View style={styles.theader}>
        <Text>End Time</Text>
      </View>
      <View style={styles.theader}>
        <Text>Worked Hours</Text>
      </View>
    </View>
  );

  const TableBody = () =>
    Object.keys(pdfData.dates).map((date) => (
      <View key={date} style={{ width: "100%", flexDirection: "row" }}>
        <View style={[styles.tbody, styles.tbody2]}>
          <Text>{date}</Text>
        </View>
        <View style={styles.tbody}>
          <Text>{getTime(pdfData.dates[date].starttime) || "N/A"} </Text>
        </View>
        <View style={styles.tbody}>
          <Text>{getTime(pdfData.dates[date].endtime) || "N/A"}</Text>
        </View>
        <View style={styles.tbody}>
          <Text>{pdfData.dates[date].hours?.toFixed(2) || "N/A"}</Text>
        </View>
      </View>
    ));

  const TableTotal = () => {
    const totalDays = Object.keys(pdfData.dates).length;
    const totalHours = Object.values(pdfData.dates).reduce((sum, date) => {
      return sum + (date.hours || 0);
    }, 0);

    return (
      <View style={{ width: "100%", flexDirection: "row" }}>
        <View style={styles.total}>
          <Text>Total Days</Text>
        </View>
        <View style={styles.total}>
          <Text>{totalDays}</Text>
        </View>
        <View style={styles.tbody}>
          <Text>Total Hours</Text>
        </View>
        <View style={styles.tbody}>
          <Text>{totalHours.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceTitle />
        <Address />
        <UserAddress />
        <TableHead />
        <TableBody />
        <TableTotal />
      </Page>
    </Document>
  );
};

export default OverviewPDF;
