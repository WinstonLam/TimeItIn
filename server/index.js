// index.js
const { app } = require("./server"); // Importing only app from server.js
const { unprotectedRouter, protectedRouter } = require("./routes");
const { validateFirebaseIdToken } = require("./middleware");
const cookieParser = require("cookie-parser");

const port = 8080;

// Define unprotected routes
app.use("/", unprotectedRouter);

app.use(cookieParser());

// Use the validateFirebaseIdToken middleware for all other routes
protectedRouter.use(validateFirebaseIdToken);

// Define protected routes
app.use("/", protectedRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
