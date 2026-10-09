import React, { useState, useEffect, useRef } from 'react';
import { evaluateMathExpression, hasMathExpression, cleanFloat } from '../utils/mathParser';
import { Calculator } from 'lucide-react';

interface MathInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown'> {
  value: number;
  onChangeValue: (val: number) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  allowNegative?: boolean;
  min?: number | string;
  step?: number | string;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChangeValue,
  className = '',
  placeholder = '0',
  title = 'Accepts math formulas (e.g. (1+1-500+3)/6)',
  allowNegative = true,
  min,
  step,
  ...rest
}) => {
  const [text, setText] = useState<string>(() => (value ?? 0).toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes if not focused
  useEffect(() => {
    if (!isFocused) {
      setText((value ?? 0).toString());
    }
  }, [value, isFocused]);

  // Compute live expression preview
  const isExpression = hasMathExpression(text);
  const liveEval = isExpression ? evaluateMathExpression(text) : null;

  const commitValue = (rawStr: string) => {
    const trimmed = rawStr.trim();
    if (!trimmed) {
      setText('0');
      onChangeValue(0);
      return;
    }

    if (hasMathExpression(trimmed)) {
      const res = evaluateMathExpression(trimmed);
      if (res.success) {
        let finalVal = res.value;
        if (!allowNegative && finalVal < 0) finalVal = 0;
        setText(finalVal.toString());
        onChangeValue(finalVal);
      } else {
        // Incomplete or invalid formula on blur: fall back to previous valid value
        setText((value ?? 0).toString());
      }
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        let finalVal = cleanFloat(parsed);
        if (!allowNegative && finalVal < 0) finalVal = 0;
        setText(finalVal.toString());
        onChangeValue(finalVal);
      } else {
        setText((value ?? 0).toString());
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue(text);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setText((value ?? 0).toString());
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // If it's a plain number without operators, update parent live
    if (!hasMathExpression(val)) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        let finalVal = parsed;
        if (!allowNegative && finalVal < 0) finalVal = 0;
        onChangeValue(cleanFloat(finalVal));
      }
    }
  };

  const isFullWidth = className.includes('w-full');

  return (
    <div className={`relative ${isFullWidth ? 'flex w-full' : 'inline-flex'} items-center`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        value={text}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        title={title}
        className={`${className} transition-all duration-150`}
        {...rest}
      />

      {/* Live PEMDAS evaluation preview popup while typing expressions */}
      {isFocused && isExpression && (
        <div
          onMouseDown={(e) => {
            // Prevent input blur before click handler
            e.preventDefault();
            if (liveEval && liveEval.success) {
              commitValue(text);
              inputRef.current?.blur();
            }
          }}
          className={`absolute right-0 top-full mt-1 z-50 px-2 py-1 rounded-md text-[11px] font-mono shadow-md border flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none transition-all duration-100 ${
            liveEval && liveEval.success
              ? 'bg-slate-900 text-emerald-300 border-slate-700 hover:bg-slate-800'
              : 'bg-amber-900/90 text-amber-200 border-amber-700'
          }`}
          title="Click or press Enter to apply calculated result"
        >
          <Calculator className="w-3 h-3 text-emerald-400 shrink-0" />
          {liveEval && liveEval.success ? (
            <span>
              = <strong className="text-white font-bold">{liveEval.value}</strong>
              <span className="text-[9px] text-slate-400 ml-1 font-sans">(Press Enter)</span>
            </span>
          ) : (
            <span className="text-[10px] text-amber-300 font-sans">
              {liveEval?.error || 'Typing math...'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
