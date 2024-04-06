import React, { useState, useEffect } from "react";
import "../styles/component-styles/FormField.css";

interface FormFieldProps {
  value: string;
  label: string;
  id: string;
  required: boolean;
  formSubmitted?: boolean;
  onChange?: (value: any) => void;
}

const FormField: React.FC<FormFieldProps> = ({
  value,
  label,
  id,
  required,
  formSubmitted,
  onChange,
}) => {
  useEffect(() => { }, [value]);
  const [hasValue, setHasValue] = useState(false);

  const checkValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event.target.value);
    setHasValue(event.target.value !== "");
  };

  const showError = formSubmitted && required && !hasValue;

  return (
    <div className={`form-field${required ? "" : "-optional"}`}>
      <input
        value={value}
        type="text"
        id={id}
        onChange={checkValue}
        className={hasValue ? "has-value" : ""}
      />
      <label htmlFor={id}>{label}</label>
      {required && (
        <div className={`error${showError ? "-show" : ""}`}>
          This field is required
        </div>
      )}
    </div>
  );
};

export default FormField;
