// routes.js
const express = require("express");
const admin = require("firebase-admin");
const crypto = require("crypto");
const unprotectedRouter = express.Router();
const protectedRouter = express.Router();

const db = admin.firestore();

unprotectedRouter.post("/login", async (req, res) => {
  const { email, password } = req.body.data;

  try {
    const userCredential = await admin
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Uncomment this line if you're using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });

    res.status(200).send({ status: "success" });
  } catch (error) {
    res.status(500).send({ error: error.message });
    console.error("Login error:", error);
  }
});

unprotectedRouter.post("/register", async (req, res) => {
  const { email, password, pincode, settings } = req.body.data;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Store user data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      auth: {
        pincode,
      },
      settings,
    });

    res.status(200).send({ status: "success" });
  } catch (error) {
    res.status(500).send({ error: error.message });
    console.error("Registration error:", error);
  }
});

protectedRouter.post("/logout", (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send({ error: error.message });
  }
});

// Get pin for a specific admin
protectedRouter.get("/get-pin", async (req, res) => {
  const userId = req.cookies.userId;
  console.log("Fetching pin for adminId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "User not found" });
    } else {
      res.status(200).send({ pin: doc.data().pincode });
    }
  } catch (error) {
    console.error("Error fetching pin:", error);
    res.status(500).send({ error: error.message });
  }
});

// Get employees for a specific admin
protectedRouter.get("/get-employees/:uid", async (req, res) => {
  const userId = req.params.uid;
  console.log("Fetching employees for adminId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Admin not found" });
    } else {
      const employeesData = doc.data().employees || {};
      const employees = Object.keys(employeesData).map((employeeId) => ({
        uid: employeeId,
        ...employeesData[employeeId],
      }));
      res.status(200).send({ employees });
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).send({ error: error.message });
  }
});

// Create employee for a specific admin
protectedRouter.post("/create-employee/:uid", async (req, res) => {
  const userId = req.params.uid;
  const { firstname, lastname } = req.body.employee;

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Admin not found" });
    } else {
      const employeeId = db.collection("users").doc().id;
      const employeeData = {
        firstName: firstname,
        lastName: lastname,
        startdate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        totalhours: 0,
      };

      console.log("Creating employee: ", employeeId, "for adminId: ", userId);

      await doc.ref.update({ [`employees.${employeeId}`]: employeeData });

      res.status(200).send({ success: true });
    }
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).send({ error: error.message });
  }
});

// Set time for employee
protectedRouter.post("/set-time/:uid", async (req, res) => {
  console.log("Setting time for employeeId:", req.body.employeeId);
  const employeeId = req.body.employeeId;
  const uid = req.params.uid;
  const currentTime = new Date(req.body.date); // Get date from frontend

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).send({ error: "User not found" });
      return;
    }

    const { roundTime, timeBetween } = userDoc.data().settings.clockin;

    // Round the current time to the nearest multiple of `roundTime` minutes
    currentTime.setMinutes(
      Math.round(currentTime.getMinutes() / roundTime) * roundTime
    );

    // Format the current time as 'mm-yyyy' for month and 'dd-mm-yyyy' for day
    const monthOptions = { year: "numeric", month: "2-digit" };
    const dayOption = { day: "2-digit", month: "2-digit", year: "numeric" };
    const monthId = currentTime
      .toLocaleDateString("en-GB", monthOptions)
      .replace(/\//g, "-");
    const dayId = currentTime
      .toLocaleDateString("en-GB", dayOption)
      .replace(/\//g, "-");

    // Fetch the document for the specific month
    const monthDoc = await userDoc.ref.collection("hours").doc(monthId).get();

    if (!monthDoc.exists) {
      // If there's no document for this month, create one with the current time as the start time for the specific employee
      await monthDoc.ref.set({
        [dayId]: { [employeeId]: { starttime: currentTime } },
      });
    } else {
      // If the document for this month exists, check if there's already a start time for the specific employee
      const dayData = monthDoc.data()[dayId];
      const employeeData = dayData ? dayData[employeeId] : null;
      if (!employeeData) {
        // If there's no data for the employee, set the current time as the start time
        await monthDoc.ref.update({
          [`${dayId}.${employeeId}.starttime`]: currentTime,
        });
      } else {
        // If there's already a start time, check if the current time is at least `timeBetween` minutes later
        const startTime = employeeData.starttime.toDate();
        const minutesElapsed =
          (currentTime.getTime() - startTime.getTime()) / 60000;

        if (minutesElapsed < timeBetween) {
          res.status(400).send({
            error: `Please wait at least ${timeBetween} minutes between clock-ins`,
          });
          return;
        }

        // If enough time has passed, set the current time as the end time
        await monthDoc.ref.update({
          [`${dayId}.${employeeId}.endtime`]: currentTime,
        });
      }
    }

    // Fetch the updated document
    const updatedMonthDoc = await userDoc.ref
      .collection("hours")
      .doc(monthId)
      .get();

    const updatedDayData = updatedMonthDoc.data()[dayId];
    const updatedEmployeeData = updatedDayData
      ? updatedDayData[employeeId]
      : null;

    res.status(200).send({
      success: true,
      starttime: updatedEmployeeData?.starttime?.toDate() || null,
      endtime: updatedEmployeeData?.endtime?.toDate() || null,
    });
  } catch (error) {
    console.error("Error setting time:", error);
    res.status(500).send({ error: error.message });
  }
});

protectedRouter.get("/edit-hours/:uid", async (req, res) => {
  console.log("Updating hours for employeeId:", req.body.employeeId);
  const date = new Date(req.body.date);
  const hours = req.body.hours;

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).send({ error: "User not found" });
      return;
    }

    // Format the current date as 'mm-yyyy' for month and 'dd-mm-yyyy' for day
    const monthOptions = { year: "numeric", month: "2-digit" };
    const dayOption = { day: "2-digit", month: "2-digit", year: "numeric" };
    const monthId = date
      .toLocaleDateString("en-GB", monthOptions)
      .replace(/\//g, "-");
    const dayId = date
      .toLocaleDateString("en-GB", dayOption)
      .replace(/\//g, "-");

    // Fetch the document for the specific month
    const monthDoc = await userDoc.ref.collection("hours").doc(monthId).get();

    // Populate the updates with the given object
    const updates = {};

    for (const employeeId in hours) {
      const { starttime, endtime } = hours[employeeId];
      updates[`${dayId}.${employeeId}.starttime`] = starttime;
      updates[`${dayId}.${employeeId}.endtime`] = endtime;
    }

    // If no document exists for this month, create one with the start and end times
    if (!monthDoc.exists) {
      await monthDoc.ref.set(updates);
    } else {
      // If the document for this month exists, update the start and end times
      await monthDoc.ref.update(updates);
    }

    // Fetch the updated document
    const updatedMonthDoc = await monthDoc.ref.get();
    const updatedDayData = updatedMonthDoc.data()[dayId] || {};

    res.status(200).send({ hours: updatedDayData });
  } catch (error) {
    console.error("Error updating hours:", error);
    res.status(500).send({ error: error.message });
  }
});
// Get hours for admin
protectedRouter.get("/get-hours/:uid", async (req, res) => {
  const userId = req.params.uid;
  const date = new Date(req.query.date);

  console.log("Fetching hours for adminId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Admin not found" });
    } else {
      const employeeIds = Object.keys(doc.data().employees || {});
      if (!employeeIds) {
        console.log("No employees found for this admin");
        res.status(200).send({ hours: [] });
      } else {
        // Format the date as 'mm-yyyy'
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const dateId = `${month}-${year}`;

        const hoursDoc = await doc.ref.collection("hours").doc(dateId).get();
        if (!hoursDoc.exists) {
          console.log("No hours document for this date");
          res.status(200).send({ hours: [] });
        } else {
          let hoursData = hoursDoc.data();

          // Convert Firestore Timestamps to ISO strings
          for (const dateKey in hoursData) {
            for (const employeeId in hoursData[dateKey]) {
              const data = hoursData[dateKey][employeeId];
              if (data.starttime) {
                data.starttime = new Date(
                  data.starttime._seconds * 1000
                ).toISOString();
              }
              if (data.endtime) {
                data.endtime = new Date(
                  data.endtime._seconds * 1000
                ).toISOString();
              }
            }
          }
          console.log("Hours data:", hoursData);
          res.status(200).send({ hoursData });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching hours:", error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = {
  unprotectedRouter: unprotectedRouter,
  protectedRouter: protectedRouter,
};
