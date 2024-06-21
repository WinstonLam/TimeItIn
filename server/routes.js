// routes.js
const express = require("express");
const admin = require("firebase-admin");
const unprotectedRouter = express.Router();
const protectedRouter = express.Router();

const db = admin.firestore();

// Check validation of token
unprotectedRouter.get("/auth-status", async (req, res) => {
  try {
    const idToken = req.cookies.token;
    if (!idToken) {
      return res.status(200).send({ isAuthenticated: false });
    }

    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    if (decodedIdToken) {
      return res.status(200).send({ isAuthenticated: true });
    } else {
      return res.status(200).send({ isAuthenticated: false });
    }
  } catch (error) {
    return res.status(200).send({ isAuthenticated: false });
  }
});

// Login user
unprotectedRouter.post("/login", async (req, res) => {
  console.log("Logging in user");
  const { token, expirationTime } = req.body;

  // Calculate the max age for the cookie
  const now = new Date();
  const maxAge = expirationTime - now.getTime();

  try {
    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: maxAge,
      // maxAge: 1000 * 5, // 5 seconds for testing
      // maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.status(200).send({ loggedIn: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
    console.error("Login error:", error);
  }
});

// Register user
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

// Refresh token
protectedRouter.post("/refresh-token", async (req, res) => {
  console.log("Refreshing token");
  const { token, expirationTime } = req.body;

  try {
    // Verify the new token
    const decodedIdToken = await admin.auth().verifyIdToken(token);

    // Calculate the remaining time for the session
    const now = new Date().getTime();
    const remainingTime = expirationTime - now;

    // If the session has expired, return an error
    if (remainingTime <= 0) {
      res.status(401).send({ error: "Session has expired" });
      return;
    }

    // Determine the max age for the cookie based on the remaining time
    const maxAge = remainingTime;

    // Set the new token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: maxAge, // Use the remaining time for maxAge
      sameSite: "None",
    });

    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
    console.error("Token refresh error:", error);
  }
});

// Logout user
protectedRouter.post("/logout", (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send({ error: error.message });
  }
});

// Get pin for a specific user
protectedRouter.get("/check-pin", async (req, res) => {
  const userId = req.user.uid;
  const pincode = req.query.pincode;
  console.log("Checking pin for adminId:", userId);

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "User not found" });
    } else {
      const pin = doc.data().auth.pincode;
      if (pin === pincode) {
        res.status(200).send({ success: true });
      } else {
        res.status(200).send({ success: false });
      }
    }
  } catch (error) {
    console.error("Error fetching pin:", error);
    res.status(500).send({ error: error.message });
  }
});

// Get employees for a specific user
protectedRouter.get("/get-employees", async (req, res) => {
  const userId = req.user.uid;
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

// Create employee for a specific user
protectedRouter.post("/create-employee", async (req, res) => {
  const userId = req.user.uid;
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
        // totalhours: 0, not implemented yet
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

// Edit employee for a specific user
protectedRouter.post("/edit-employees", async (req, res) => {
  const userId = req.user.uid;
  const { employees } = req.body;

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Admin not found" });
    } else {
      const employeeData = {};
      employees.forEach((employee) => {
        const { uid, firstName, lastName, startdate } = employee; // Using camelCase keys
        employeeData[uid] = {
          firstName, // firstName: firstName
          lastName, // lastName: lastName
          startdate, // startdate: startdate
        };
      });

      await doc.ref.update({ employees: employeeData });

      res.status(200).send({ success: true });
    }
  } catch (error) {
    console.error("Error editing employees:", error);
    res.status(500).send({ error: error.message });
  }
});

// Delete employees for a specific user
protectedRouter.post("/delete-employees", async (req, res) => {
  const userId = req.user.uid;
  const employeeIds = req.body.employeeIds; // Array of employeeIds to delete

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Admin not found" });
    } else {
      const employeesData = doc.data().employees || {};
      employeeIds.forEach((employeeId) => {
        delete employeesData[employeeId];
      });

      await doc.ref.update({ employees: employeesData });

      res.status(200).send({ success: true });
    }
  } catch (error) {
    console.error("Error deleting employees:", error);
    res.status(500).send({ error: error.message });
  }
});

// Set time for employee
protectedRouter.post("/set-time", async (req, res) => {
  const employeeId = req.body.employeeId;
  const uid = req.user.uid;

  console.log(`Setting time for employee: ${employeeId} for user: ${uid}`);

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

// Edit hours for user
protectedRouter.post("/edit-hours", async (req, res) => {
  console.log("Updating hours for user:", req.user.uid);
  const userId = req.user.uid;
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
      // If the document for this month exists, replace the document with the new updates
      await userDoc.ref.collection("hours").doc(monthId).set(updates);
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

// Get hours for user
protectedRouter.get("/get-hours", async (req, res) => {
  const userId = req.user.uid;
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
          res.status(200).send({ hoursData });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching hours:", error);
    res.status(500).send({ error: error.message });
  }
});

// Get settings for user
protectedRouter.get("/get-settings", async (req, res) => {
  const userId = req.user.uid;
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

// Edit settings for user
protectedRouter.post("/edit-settings", async (req, res) => {
  const userId = req.user.uid;
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
