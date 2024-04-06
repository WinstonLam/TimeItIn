import React, { FC, useContext } from "react";
import { AdminContext } from "../providers/AdminContext";
import "../styles/Header.css";
import GearSvg from "../icons/settings-gear";

interface HeaderProps {
  setSideNav: (sideNav: boolean) => void;
}

const Header: FC<HeaderProps> = ({ setSideNav }) => {
  const { loggedIn } = useContext(AdminContext);
  return (
    <div>
      <div className="header">
        <div className="header-content">
          <div className="header-item">
            <h1>TimeItIn</h1>
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
