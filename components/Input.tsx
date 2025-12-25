import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, name, type = 'text', helperText, icon, ...props }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {/* FIX: Cast icon element to specify it accepts a className prop */}
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-gray-400' })}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          className={`w-full py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white/[0.05] transition-all duration-300 ${icon ? 'pl-11' : 'px-4'}`}
          {...props}
        />
      </div>
      {helperText && <p className="mt-2 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  helperText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, name, helperText, icon, children, ...props }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {/* FIX: Cast icon element to specify it accepts a className prop */}
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-gray-400' })}
          </div>
        )}
        <select
          id={name}
          name={name}
          className={`w-full py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white/[0.05] transition-all duration-300 appearance-none ${icon ? 'pl-11' : 'px-4'}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      {helperText && <p className="mt-2 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, name, helperText, ...props }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white/[0.05] transition-all duration-300"
        rows={4}
        {...props}
      />
      {helperText && <p className="mt-2 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};