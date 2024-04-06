import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./button";

import "../styles/component-styles/Modal.css";
interface ModalProps {
  title: string;
  desc?: string;
  dismiss?: boolean;
  action?: {
    title: string;
    link?: string;
    handle?: () => void;
  };
}
const Modal: React.FC<ModalProps> = ({ title, desc, dismiss, action }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      action?.handle && action.handle();
      action?.link && navigate(action.link);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal${isClosing ? "-closing" : ""}`}>
      <div className="modal-content">
        <dialog open={isOpen}>
          <div className="modal-header">
            {dismiss && <Button onClick={handleClose} text="X" type="button" />}
            <h2>{title}</h2>
          </div>
          <p>{desc}</p>
          {action?.title && (
            <div className="modal-actions">
              <Button onClick={handleClose} text={action.title} type="button" />
            </div>
          )}
        </dialog>
      </div>
    </div>
  );
};

export default Modal;
