import React from 'react';
import './Popup.css';

interface PopupProps {
    showPopUp: boolean;
    closePopUp: () => void;
    children: React.ReactNode;
}

function Popup({ showPopUp, closePopUp, children }: PopupProps) {
    const stopPropagation = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    if (!showPopUp) {
        return null;
    }

    return (
        <div className="popup-overlay" onClick={closePopUp}>
            <div
                className="popup-content"
                onClick={stopPropagation}
                onTouchStart={stopPropagation}
                onTouchMove={stopPropagation}
                onTouchEnd={stopPropagation}
                onPointerDown={stopPropagation}
                onPointerMove={stopPropagation}
                onPointerUp={stopPropagation}
                onWheel={stopPropagation}
            >
                <button className="close-button" onClick={closePopUp}>
                    &times; {/* HTML entity for 'times' (X) */}
                </button>
                <div className="popup-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Popup;
