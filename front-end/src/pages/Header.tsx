import React, { FC, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import "../styles/Header.css";
import GearSvg from "../icons/settings-gear";
import { useNavigate } from "react-router-dom";
const logo = require("../icons/main-logo.png") as string;



interface HeaderProps {
  setSideNav: (sideNav: boolean) => void;
}

const Header: FC<HeaderProps> = ({ setSideNav }) => {
  const navigate = useNavigate();
  const { loggedIn, projectName } = useContext(AdminContext);
  return (
    <div>
      <div className="header">
        <div className="header-content">
          <div className="header-logo" onClick={() => navigate("/")}>
            <h2>TimeItIn</h2>
            <img src={logo} alt="logo" className="logo-icon" />
            <h2>{projectName}</h2>

          </div>
          {loggedIn ? <GearSvg
            className="header-gear-icon"
            onClick={() => setSideNav(true)}
          /> : null}

        </div>
      </div>
    </div>
  );
};

export default Header;
