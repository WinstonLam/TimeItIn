const { admin } = require("./server"); // import admin

// Middleware to validate Firebase token
async function validateFirebaseIdToken(req, res, next) {
  console.log("Check if request is authorized with Firebase ID token");

  if (!req.cookies || !req.cookies.token) {
    console.error("No Firebase ID token was passed in the cookies.");
    res.status(403).send("Unauthorized");
    return;
  }
  const idToken = req.cookies.token;

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log("ID Token correctly decoded");
    // console.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;

    next();
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error);
    if (error.code === "auth/id-token-expired") {
      res.status(401).send("Token expired");
    } else {
      res.status(403).send("Unauthorized");
    }
    return;
  }
}

// Export the function
module.exports = { validateFirebaseIdToken };
