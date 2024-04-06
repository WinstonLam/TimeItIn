import React, { FC, useEffect, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import { useNavigate } from "react-router-dom";

import "../styles/Settings.css";
import IconCard from "../components/iconcard";
import ClockSvg from "../icons/clock";
import UserSvg from "../icons/user";
import GearSvg from "../icons/settings-gear";
import CalendarSvg from "../icons/calendar";
import SignOutSvg from "../icons/signout";

interface SettingsProps {
  active: boolean;
  setActive: (active: boolean) => void;
}

const Settings: FC<SettingsProps> = ({ active, setActive }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AdminContext);
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

  return (
    <>
      <div className={`settings${active ? "-active" : ""}`} />
      <div className={`settings-content${active ? "-active" : ""}`}>
        <div className="settings-content-header">
          <div className="close" onClick={() => setActive(false)} />
          <div className="settings-content-header-title">
            <h1>Settings</h1>
          </div>
          <div className="settings-signout" onClick={() => handleSignOut()}>
            <SignOutSvg className="settings-signout-icon" />
            <p>Signout</p>
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
              onClick={() => handleNav("employees")}
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
