import React, { useState, useEffect, useRef } from 'react';
import { evaluateMathExpression, hasMathExpression, cleanFloat } from '../utils/mathParser';
import { useHistoryRevision } from '../hooks/useBudgetHistory';
import { Calculator } from 'lucide-react';

let mathSessionCounter = 0;

interface MathInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown'> {
  value: number;
  onChangeValue: (val: number, sessionKey?: string) => void;
  liveHistoryKey?: string;
  onDone?: () => void;
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
  liveHistoryKey,
  onDone,
  className = '',
  placeholder = '0',
  title = 'Accepts math formulas (e.g. (1+1-500+3)/6)',
  allowNegative = true,
  min,
  step,
  ...rest
}) => {
  const historyRevision = useHistoryRevision();
  const prevHistoryRevisionRef = useRef<number>(historyRevision);

  const [text, setText] = useState<string>(() => (value ?? 0).toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialValueRef = useRef<number>(value ?? 0);
  const sessionKeyRef = useRef<string | undefined>(
    liveHistoryKey ? `${liveHistoryKey}:${++mathSessionCounter}` : undefined
  );
  const dirtyInSessionRef = useRef<boolean>(false);

  // Sync with external value changes if not focused
  useEffect(() => {
    if (!isFocused) {
      setText((value ?? 0).toString());
    }
  }, [value, isFocused]);

  // Immediately sync text and reset session when an Undo/Redo occurs, even while focused
  useEffect(() => {
    if (historyRevision !== prevHistoryRevisionRef.current) {
      prevHistoryRevisionRef.current = historyRevision;
      const nextVal = value ?? 0;
      setText(nextVal.toString());
      initialValueRef.current = nextVal;
      dirtyInSessionRef.current = false;
      if (liveHistoryKey) {
        sessionKeyRef.current = `${liveHistoryKey}:${++mathSessionCounter}`;
      }
    }
  }, [historyRevision, value, liveHistoryKey]);

  // Compute live expression preview
  const isExpression = hasMathExpression(text);
  const liveEval = isExpression ? evaluateMathExpression(text) : null;
  const isIncompleteExpression = isFocused && isExpression && (!liveEval || !liveEval.success);

  const emitChange = (nextVal: number) => {
    dirtyInSessionRef.current = true;
    onChangeValue(nextVal, sessionKeyRef.current);
  };

  const commitValue = (rawStr: string) => {
    const trimmed = rawStr.trim();
    if (!trimmed) {
      setText('0');
      emitChange(0);
      return;
    }

    if (hasMathExpression(trimmed)) {
      const res = evaluateMathExpression(trimmed);
      if (res.success) {
        let finalVal = res.value;
        if (!allowNegative && finalVal < 0) finalVal = 0;
        setText(finalVal.toString());
        emitChange(finalVal);
      } else {
        // Incomplete or invalid formula on blur: revert back to pre-focus/previous valid value
        setText((value ?? 0).toString());
      }
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        let finalVal = cleanFloat(parsed);
        if (!allowNegative && finalVal < 0) finalVal = 0;
        setText(finalVal.toString());
        emitChange(finalVal);
      } else {
        setText((value ?? 0).toString());
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    initialValueRef.current = value ?? 0;
    dirtyInSessionRef.current = false;
    if (liveHistoryKey) {
      sessionKeyRef.current = `${liveHistoryKey}:${++mathSessionCounter}`;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(text);
    dirtyInSessionRef.current = false;
    onDone?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue(text);
      dirtyInSessionRef.current = false;
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const orig = initialValueRef.current;
      setText(orig.toString());
      if (dirtyInSessionRef.current) {
        onChangeValue(orig, sessionKeyRef.current);
        dirtyInSessionRef.current = false;
      }
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    const trimmed = val.trim();
    if (!trimmed) {
      emitChange(0);
      return;
    }

    if (hasMathExpression(trimmed)) {
      const res = evaluateMathExpression(trimmed);
      if (res.success) {
        let finalVal = res.value;
        if (!allowNegative && finalVal < 0) finalVal = 0;
        emitChange(cleanFloat(finalVal));
      }
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        let finalVal = parsed;
        if (!allowNegative && finalVal < 0) finalVal = 0;
        emitChange(cleanFloat(finalVal));
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        title={title}
        data-live-math-input={liveHistoryKey ? 'true' : undefined}
        data-math-incomplete={isIncompleteExpression ? 'true' : undefined}
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
