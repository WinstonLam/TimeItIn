import React, { useContext, useEffect } from "react";

import { AdminProvider } from "./providers/AdminContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AdminContext } from "./providers/AdminContext";
import { initializeAppTokenRefresh } from "./api";
import loadingIcon from "./icons/loading.gif";

import "./styles/App.css";

// pages
import HourRegistration from "./pages/HourRegistration";
import Header from "./pages/Header";
import Settings from "./pages/Settings";
import LoginPage from "./pages/LoginPage";
import Employees from "./pages/Employees";
import Hours from "./pages/Hours";
import AdvancedSettings from "./pages/AdvancedSettings";

const logo = require("./icons/main-logo.png") as string;

function App() {
  useEffect(() => {
    initializeAppTokenRefresh();
  }, []);

  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}

function AppContent() {
  const [settings, setSettings] = React.useState<boolean>(false);
  const { loading, loggedIn } = useContext(AdminContext);

  useEffect(() => {
    if (!loggedIn) {
      setSettings(false);
    }
  }, [loggedIn]);
  return (
    <Router basename="/TimeItIn">
      <div className="App">
        <Settings active={settings} setActive={setSettings} />
        <Header setSideNav={setSettings} />

        <div className="content">
          {loading ? (
            <div className="loading">
              <img src={logo} alt="logo" className="logo-icon" />
              <img className="loadingIcon" src={loadingIcon} alt="Loading..." />
            </div>
          ) : loggedIn ? (
            <Routes>
              <Route path="/" element={<HourRegistration />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/hours" element={<Hours />} />
              <Route path="/advanced-settings" element={<AdvancedSettings />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="*" element={<Navigate to="/" />} />

              <Route path="/" element={<LoginPage />} />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
