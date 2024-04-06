import React from "react";
import "../styles/iconcard.css";

interface IconCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  className?: string;
}

const IconCard: React.FC<IconCardProps> = ({
  onClick,
  icon,
  title,
  className,
}) => {
  return (
    <div className={`${className ? className : "card"}`} onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
    </div>
  );
};

export default IconCard;
