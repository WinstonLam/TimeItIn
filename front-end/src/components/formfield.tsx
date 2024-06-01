import React, { useState, useEffect } from "react";
import "../styles/component-styles/FormField.css";
import EyeSvg from "../icons/eye";

interface FormFieldProps {
  value: string;
  label: string;
  id: string;
  required: boolean;
  formSubmitted?: boolean;
  onChange?: (value: any) => void;
  sensitive?: boolean;
  limit?: number;
  strict?: string;
  disbabled?: boolean;
  span?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  value,
  label,
  id,
  required,
  formSubmitted,
  onChange,
  sensitive,
  limit,
  strict,
  disbabled,
  span,
}) => {
  const [hasValue, setHasValue] = useState(value !== "");
  const [showValue, setShowValue] = useState(sensitive === true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState(span || "");

  useEffect(() => {
    setHasValue(value !== "");
  }, [value]);

  useEffect(() => {
    if (formSubmitted) {
      if (!hasValue && required) {
        setError(true);
        setMessage("This field is required");
      }
    }
    if (span) {
      setError(true);
    }
  }, [formSubmitted, hasValue, required]);

  const checkValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event.target.value);
    setHasValue(event.target.value !== "");

    if (strict === "digit" && !/^\d*$/.test(event.target.value)) {
      setError(true);
      setMessage("Input must only contain digits");
    } else {
      setError(false);
      setMessage(span || "");
    }
  };

  const handleFocus = () => {
    setError(false);
    setMessage(span || "");
  };

  const toggleShowValue = () => {
    setShowValue(!showValue);
  };

  return (
    <div className={`form-field${required ? "" : "-optional"}`}>
      <input
        value={value}
        type={!showValue ? "text" : "password"}
        id={id}
        onChange={checkValue}
        onFocus={handleFocus}
        className={hasValue ? "has-value" : ""}
        maxLength={limit}
        disabled={disbabled}
      />

      <label htmlFor={id}>{label}</label>

      <div className={`form-error${error ? "-show" : ""}`}>{message}</div>

      {sensitive && (
        <EyeSvg
          onClick={toggleShowValue}
          className={`eye${showValue ? "-show" : "-hide"}`}
        />
      )}
    </div>
  );
};

export default FormField;
