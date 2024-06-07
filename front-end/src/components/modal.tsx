import React, { useEffect, useRef } from "react";
import Button from "./button";
import FormField, { FormFieldProps } from "./formfield";
import "../styles/component-styles/Modal.css";

interface ActionProps {
  title: string;
  link?: string;
  onClick?: () => void;
  style?: { cancel: boolean };
}

interface ModalProps {
  title: string;
  desc?: string;
  dismiss?: () => void;
  action?: ActionProps;
  actionB?: ActionProps;
  actionC?: ActionProps;
  input?: FormFieldProps;
}

const Modal: React.FC<ModalProps> = ({
  title,
  desc,
  dismiss,
  action,
  actionB,
  actionC,
  input,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isClosing, setIsClosing] = React.useState(false);
  const modalBackgroundRef = useRef<HTMLDivElement>(null); // Reference to the modal background

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modalBackgroundRef.current === target) {
        // Only handle clicks directly on the modal background
        handleClose();
      }
    };

    // Add event listener to the modal background
    const modalBackground = modalBackgroundRef.current;
    if (modalBackground) {
      modalBackground.addEventListener("click", handleOutsideClick);
    }

    return () => {
      if (modalBackground) {
        modalBackground.removeEventListener("click", handleOutsideClick);
      }
    };
  }, [modalBackgroundRef, isOpen]); // Depend on isOpen to re-attach the listener if the modal re-opens

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      if (dismiss) {
        dismiss();
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalBackgroundRef}
      className={`modal${isClosing ? "-closing" : ""}`}
    >
      <div className="modal-content">
        <dialog open={isOpen}>
          <div className="modal-header">
            {dismiss && <div className="close" onClick={handleClose} />}
            <h2>{title}</h2>
          </div>
          <p>{desc}</p>
          {input && (
            <div className="modal-input">
              <FormField {...input} />
            </div>
          )}
          <div className="modal-actions">
            {action?.title && (
              <div className="modal-action">
                <Button
                  onClick={action.onClick}
                  text={action.title}
                  type="button"
                  style={action.style}
                />
              </div>
            )}
            {actionB?.title && (
              <div className="modal-action">
                <Button
                  onClick={actionB.onClick}
                  text={actionB.title}
                  type="button"
                  style={actionB.style}
                />
              </div>
            )}
            {actionC?.title && (
              <div className="modal-action">
                <Button
                  onClick={actionC.onClick}
                  text={actionC.title}
                  type="button"
                  style={actionC.style}
                />
              </div>
            )}
          </div>
        </dialog>
      </div>
    </div>
  );
};

export default Modal;
