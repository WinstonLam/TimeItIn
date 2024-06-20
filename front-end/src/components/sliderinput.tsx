import React from 'react';
import '../styles/component-styles/SliderInput.css';
interface SliderInputProps {
    value: boolean;
    setValue: (value: boolean) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({ value, setValue }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.checked);
    };

    return (
        <label className="switch">
            <input
                type="checkbox"
                checked={value}
                onChange={handleChange}
            />
            <span className="slider round"></span>
        </label>
    );
};

export default SliderInput;
