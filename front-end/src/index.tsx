import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "react-datepicker/dist/react-datepicker.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Root element not found");
}
