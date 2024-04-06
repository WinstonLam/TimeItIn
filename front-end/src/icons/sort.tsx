import React from "react";

type SortSvgProps = {
  className: string;
  onClick?: () => void;
};

const SortSvg: React.FC<SortSvgProps> = ({ className, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <svg viewBox="0 -0.5 25 25">
        <path
          d="M5.50023 8.725V6.061C5.48354 4.93965 6.37888 4.01699 7.50023 4H17.5002C18.6216 4.01699 19.5169 4.93965 19.5002 6.061V8.725C19.501 8.99684 19.3959 9.25831 19.2072 9.454L14.7932 13C14.6045 13.1957 14.4995 13.4572 14.5002 13.729V18.938C14.5024 19.3242 14.2891 19.6794 13.9472 19.859L11.9472 20.889C11.633 21.0462 11.2593 21.0269 10.9629 20.8383C10.6665 20.6496 10.4909 20.3192 10.5002 19.968V13.729C10.501 13.4572 10.3959 13.1957 10.2072 13L5.79323 9.453C5.60479 9.25755 5.49972 8.9965 5.50023 8.725Z"

        />
      </svg>
    </div>
  );
};

export default SortSvg;
