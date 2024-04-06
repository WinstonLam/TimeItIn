import React from "react";

type ClockSvgProps = {
  className: string;
  onClick?: () => void;
};

const ClockSvg: React.FC<ClockSvgProps> = ({ className, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="" strokeWidth="1.5" />
        <path d="M12 8V12L14.5 14.5" stroke="" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default ClockSvg;
