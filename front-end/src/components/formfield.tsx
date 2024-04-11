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
}) => {
  const [hasValue, setHasValue] = useState(false);
  const [showValue, setShowValue] = useState(sensitive === true);
  const [error, setError] = useState("");
  useEffect(() => {}, [value]);
  useEffect(() => {
    if (formSubmitted) {
      if (!hasValue && required) {
        setError("This field is required");
      }
    }
  }, [formSubmitted, hasValue, required]);

  const checkValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event.target.value);
    setHasValue(event.target.value !== "");

    if (strict === "digit" && !/^\d*$/.test(event.target.value)) {
      setError("Input must only contain digits");
    } else {
      setError("");
    }
  };

  const clearError = () => {
    setError("");
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
        className={hasValue ? "has-value" : ""}
        maxLength={limit}
      />

      <label htmlFor={id}>{label}</label>

      <div className={`form-error${error ? "-show" : ""}`}>{error}</div>

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
