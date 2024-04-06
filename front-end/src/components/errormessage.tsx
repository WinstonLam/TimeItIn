import React from 'react';
import '../styles/component-styles/ErrorMessage.css';
import ErrorSvg from '../icons/error';

interface ErrorMessageProps {
    message: string;
    show: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, show }) => {
    return (
        <div className={`error-container${show ? '-show' : ''}`}>
            <div className="error-message">
                <div className="error-svg-container">
                    <ErrorSvg className="error-svg" />
                </div>
                {message}
            </div>
        </div>
    );
};

export default ErrorMessage;
