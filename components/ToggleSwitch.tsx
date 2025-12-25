import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => {
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer">
      <span className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-12 h-6 bg-white/10 rounded-full border border-white/5 transition-all duration-300 peer-checked:bg-cyan-500/80 peer-checked:border-cyan-400/50 after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-300 peer-checked:after:translate-x-6 peer-checked:after:bg-white shadow-inner"></div>
      </span>
    </label>
  );
};

export default ToggleSwitch;