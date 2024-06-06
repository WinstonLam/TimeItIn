// routes.js
const express = require("express");
const admin = require("firebase-admin");
const unprotectedRouter = express.Router();
const protectedRouter = express.Router();

const db = admin.firestore();

unprotectedRouter.post("/login", async (req, res) => {
  console.log("Logging in user");
  const { token } = req.body;

  try {
    console.log(req.user);
    const userId = req.user.uid;
    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Uncomment this line if you're using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });

    res.status(200).send({ status: "success", userId: userId });
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
        email,
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
    console.log("Original Current Time:", currentTime);

    // Round the current time to the nearest multiple of `roundTime` minutes
    const minutes = currentTime.getMinutes();
    const roundedMinutes = Math.round(minutes / roundTime) * roundTime;
    currentTime.setMinutes(roundedMinutes);
    currentTime.setSeconds(0, 0); // Reset seconds and milliseconds

    console.log("Rounded Current Time:", currentTime);

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
        const startTime = employeeData.starttime.toDate
          ? employeeData.starttime.toDate()
          : new Date(employeeData.starttime);
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

protectedRouter.post("/edit-hours/:uid", async (req, res) => {
  console.log("Updating hours for user:", req.params.uid);
  const userId = req.params.uid;
  const date = new Date(req.body.date);
  const hours = req.body.hours;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
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
    for (day in hours) {
      updates[day] = {};
      for (const employeeId in hours[day]) {
        updates[day][employeeId] = {};
        const { starttime, endtime } = hours[day][employeeId];
        if (starttime) {
          updates[day][employeeId]["starttime"] =
            admin.firestore.Timestamp.fromDate(new Date(starttime));
        }
        if (endtime) {
          updates[day][employeeId]["endtime"] =
            admin.firestore.Timestamp.fromDate(new Date(endtime));
        }
      }
    }

    // If no document exists for this month, create one with the start and end times
    if (!monthDoc.exists) {
      await userDoc.ref.collection("hours").doc(monthId).set(updates);
    } else {
      // If the document for this month exists, update the start and end times
      await userDoc.ref.collection("hours").doc(monthId).update(updates);
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

protectedRouter.get("/get-settings/:uid", async (req, res) => {
  const userId = req.params.uid;
  console.log("Fetching settings for userId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "User not found" });
    } else {
      const userData = doc.data();
      res.status(200).send({
        email: userData.auth.email,
        clockin: userData.settings.clockin,
      });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send({ error: error.message });
  }
});

protectedRouter.post("/edit-settings/:uid", async (req, res) => {
  const userId = req.params.uid;
  const settings = req.body.settings;
  const { email, pincode, password } = settings.auth;
  const { roundTime, timeBetween } = settings.clockin;

  console.log("Updating settings for userId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "User not found" });
    } else {
      // update roundtime and timebetween casted to integers from string
      await doc.ref.update({
        "settings.clockin.roundTime": parseInt(roundTime),
        "settings.clockin.timeBetween": parseInt(timeBetween),
      });
      // check if email changed
      if (email !== doc.data().auth.email) {
        await admin.auth().updateUser(userId, { email });
        await doc.ref.update({ "auth.email": email });
      }

      if (pincode) {
        await doc.ref.update({ "auth.pincode": pincode });
      }

      if (password) {
        await admin.auth().updateUser(userId, { password });
      }

      res.status(200).send({ success: true });
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = {
  unprotectedRouter: unprotectedRouter,
  protectedRouter: protectedRouter,
};
