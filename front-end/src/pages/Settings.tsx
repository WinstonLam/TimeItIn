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
