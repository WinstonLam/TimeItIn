import React from "react";

type UserSvgProps = {
  className: string;
  onClick?: () => void;
};

const UserSvg: React.FC<UserSvgProps> = ({ className, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" />
        <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" />
      </svg>
    </div>
  );
};

export default UserSvg;
