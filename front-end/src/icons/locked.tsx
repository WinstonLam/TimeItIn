import React from "react";

type LockedSvgProps = {
  className: string;
  onClick?: () => void;
};

const LockedSvg: React.FC<LockedSvgProps> = ({ className, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <svg viewBox="0 0 24 24" >
        <rect height="10" rx="2" ry="2" width="16" x="4" y="11"></rect>
        <path d="M16.5,11V8h0c0-2.8-.5-5-4.5-5S7.5,5.2,7.5,8h0v3"></path>
      </svg>
    </div>
  );
};

export default LockedSvg;

