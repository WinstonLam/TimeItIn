// server.js
const express = require("express");
const cors = require("cors");
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

app.use(cors());
app.use(express.json());

module.exports = { app, db, admin };
