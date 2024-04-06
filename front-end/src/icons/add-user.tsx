import React from "react";

type AddUserProps = {
  className: string;
  onClick?: () => void;
};

const AddUserSvg: React.FC<AddUserProps> = ({ className, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <svg
        viewBox="0 0 24 24"
        id="add-user-left-6"
        data-name="Line Color"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path id="secondary" d="M7,5H3M5,7V3"></path>
        <path
          id="primary"
          d="M11,3.41A5.11,5.11,0,0,1,13,3a5,5,0,1,1-4.59,7"
        ></path>
        <path
          id="primary-2"
          data-name="primary"
          d="M12,13h2a7,7,0,0,1,7,7v0a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1v0A7,7,0,0,1,12,13Z"
        ></path>
      </svg>
    </div>
  );
};

export default AddUserSvg;
