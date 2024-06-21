import React from 'react';
import '../styles/component-styles/ErrorMessage.css';
import ErrorSvg from '../icons/error';

interface UpdateMessageProps {
    message: string;
    show: boolean;
    success?: boolean;
}

const UpdateMessage: React.FC<UpdateMessageProps> = ({ message, show, success }) => {
    return (
        <div className={`error-container${show ? '-show' : ''}`}>
            <div className={`error-message${success ? "-success" : ""}`}>
                <div className="error-svg-container">
                    <ErrorSvg className="error-svg" />
                </div>
                {message}
            </div>
        </div>
    );
};

export default UpdateMessage;
