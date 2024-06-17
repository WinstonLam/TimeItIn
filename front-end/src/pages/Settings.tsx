import React, { FC, useEffect, useContext, useState } from "react";
import { AdminContext } from "../providers/AdminContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/modal";

import "../styles/Settings.css";
import IconCard from "../components/iconcard";
import ClockSvg from "../icons/clock";
import UserSvg from "../icons/user";
import GearSvg from "../icons/settings-gear";
import CalendarSvg from "../icons/calendar";
import SignOutSvg from "../icons/signout";
import LockedSvg from "../icons/locked";
import UnlockedSvg from "../icons/unlocked";
import ThemeSvg from "../icons/theme";

import { themes, ThemeNames, ThemeProps } from "../styles/themes";

interface SettingsProps {
  active: boolean;
  setActive: (active: boolean) => void;
}

const Settings: FC<SettingsProps> = ({ active, setActive }) => {
  const navigate = useNavigate();
  const { logout, locked, handleUnlock, handleLock } = useContext(AdminContext);
  const [showGlobalModal, setShowGlobalModal] = useState<boolean>(false);
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const closeOnContentClick = (event: MouseEvent) => {
      if (event.target === document.querySelector(".settings-active")) {
        setActive(false);
      }
    };

    document.addEventListener("click", closeOnContentClick);

    return () => {
      document.removeEventListener("click", closeOnContentClick);
    };
  });

  useEffect(() => {
    // Load theme from localStorage on component mount
    const savedTheme = localStorage.getItem("selectedTheme") as ThemeNames;
    if (savedTheme && themes[savedTheme]) {
      applyTheme(savedTheme);
    }
  }, []);

  const handleSignOut = () => {
    setActive(false);
    logout();
    navigate("/");
  };

  const handleNav = (destination: string) => {
    setActive(false);
    navigate(`/${destination}`);
  };

  const handleModal = () => {
    setShowGlobalModal(!showGlobalModal);
  };

  const handleLocalModal = (dest: string) => {
    if (!locked) {
      handleNav(dest);
    } else {
      setDestination(dest);
      setShowLocalModal(!showLocalModal);
    }
  };

  const handleChangeGlobal = async (value: string) => {
    setFormSubmitted(false);
    setPincode(value);
    if (value.length === 4) {
      setFormSubmitted(true);
      const res = await handleUnlock(value, "global");
      if (res === "") {
        setShowGlobalModal(false);
        setPincode("");
        setFormSubmitted(false);
      } else {
        setError(res);
      }
    }
  };

  const handleChangeLocal = async (value: string) => {
    setFormSubmitted(false);
    setPincode(value);
    if (value.length === 4) {
      setFormSubmitted(true);
      const res = await handleUnlock(value, "local");
      if (res === "") {
        setShowLocalModal(false);
        handleNav(destination);
        setPincode("");
        setDestination("");
        setFormSubmitted(false);
      } else {
        setError(res);
      }
    }
  };

  const applyTheme = (themeName: ThemeNames) => {
    const theme = themes[themeName];
    Object.keys(theme).forEach((key) => {
      document.documentElement.style.setProperty(
        `--${key}-color`,
        theme[key as keyof ThemeProps]
      );
    });
  };

  const changeTheme = (themeName: ThemeNames) => {
    applyTheme(themeName);
    localStorage.setItem("selectedTheme", themeName); // Save the selected theme to localStorage
  };

  return (
    <>
      {showGlobalModal && (
        <Modal
          title="Unlock Settings"
          desc="Please enter your pincode to unlock settings"
          dismiss={handleModal}
          input={{
            value: pincode,
            label: "Pincode",
            id: "pincode",
            required: true,
            sensitive: true,
            formSubmitted: formSubmitted,
            limit: 4,
            onChange: handleChangeGlobal,
            strict: "digit",
            span: error,
          }}
        />
      )}
      {showLocalModal && (
        <Modal
          title="Pincode Required"
          desc="Please enter your pincode to access this feature"
          dismiss={() => setShowLocalModal(!showLocalModal)}
          input={{
            value: pincode,
            label: "Pincode",
            id: "pincode",
            required: true,
            sensitive: true,
            formSubmitted: formSubmitted,
            limit: 4,
            onChange: handleChangeLocal,
            strict: "digit",
            span: error,
          }}
        />
      )}
      <div className={`settings${active ? "-active" : ""}`} />
      <div className={`settings-content${active ? "-active" : ""}`}>
        <div className="settings-content-header">
          <div className="close" onClick={() => setActive(false)} />
          <div className="settings-content-header-title">
            <h1>Settings</h1>
          </div>

          <div className="header-actions">
            <div className="settings-themes">
              <ThemeSvg className="settings-theme-icon" />
              <select
                onChange={(e) => changeTheme(e.target.value as ThemeNames)}
              >
                {Object.keys(themes).map((themeName) => (
                  <option key={themeName} value={themeName}>
                    {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                  </option>
                ))}
              </select>
              <p>Theme</p>
            </div>
            <div className="settings-lock">
              {locked ? (
                <div className="settings-lock-icon" onClick={handleModal}>
                  <LockedSvg className="settings-lock-icon" />
                  <p>Unlock</p>
                </div>
              ) : (
                <div className="settings-lock-icon" onClick={handleLock}>
                  <UnlockedSvg className="settings-lock-icon" />
                  <p>Lock</p>
                </div>
              )}
            </div>
            <div className="settings-signout" onClick={() => handleSignOut()}>
              <SignOutSvg className="settings-signout-icon" />
              <p>Signout</p>
            </div>
          </div>
        </div>
        <div className="settings-box-tiles">
          <div className="settings-box1">
            <IconCard
              onClick={() => handleNav("")}
              icon={<ClockSvg className="icon" />}
              title="Clock In/Out"
            />
            <IconCard
              onClick={() => handleNav("employees")}
              icon={<UserSvg className="icon" />}
              title="Employees"
            />
          </div>
          <div className="settings-box1">
            <IconCard
              onClick={() => handleNav("hours")}
              icon={<CalendarSvg className="icon" />}
              title="Hours"
            />
            <IconCard
              onClick={() => handleLocalModal("advanced-settings")}
              icon={<GearSvg className="icon" />}
              title="Advanced"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
