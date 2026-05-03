import React from 'react';
import './Correlate.css';

interface CorrelateProps {
    value: number;
    setValue: (value: number) => void;
    max?: number;
    onClose?: () => void;
}

const DECIMALS = 1;

const Correlate: React.FC<CorrelateProps> = ({ value, setValue, max = 10, onClose = null }) => {
    return (
        <div className="correlate-slider-container">
            {onClose && (
                <button
                    className="correlate-slider-close"
                    type="button"
                    aria-label="Close correlation slider"
                    onClick={onClose}
                >
                    ×
                </button>
            )}
            <label htmlFor="correlate-slider" className="correlate-slider-label">
                Correlation Scale
            </label>
            <input
                id="correlate-slider"
                type="range"
                min={0}
                max={max}
                step={10 ** -DECIMALS}
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="correlate-slider-range"
            />
            <div className="correlate-slider-value">
                {value.toFixed(DECIMALS)}
            </div>
        </div>
    );
};

export default Correlate;
