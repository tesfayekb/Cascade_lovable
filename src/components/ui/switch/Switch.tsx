import React from 'react';

interface SwitchProps {
  label?: string;
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className="flex items-center">
      {label && (
        <label htmlFor="switch" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          value ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        onClick={onChange}
      >
        <span
          className={`${
            value ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
    </div>
  );
};

export default Switch;
