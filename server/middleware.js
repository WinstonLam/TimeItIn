const { admin } = require("./server"); // import admin

// Middleware to validate Firebase token
async function validateFirebaseIdToken(req, res, next) {
  if (!req.cookies || !req.cookies.token) {
    console.error("No Firebase ID token was passed in the cookies.");
    res
      .status(403)
      .send("Unauthorized: No Firebase ID token was passed in the cookies.");
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
    res.status(403).send("Unauthorized: Invalid Firebase ID token");
    return;
  }
}

// Export the function
module.exports = { validateFirebaseIdToken };
