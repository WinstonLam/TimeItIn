// server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();

// Firebase setup (.json file is downloaded from Firebase console)
const serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://winstonlam.github.io",
];

app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(express.json());
app.use(cookieParser());

module.exports = { app, db, admin };
