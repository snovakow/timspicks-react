import React, { useEffect } from 'react';
import './Popup.css';

interface PopupProps {
    showPopUp: boolean;
    closePopUp: () => void;
    children: React.ReactNode;
}

function Popup({ showPopUp, closePopUp, children }: PopupProps) {
    useEffect(() => {
        const contentEl = document.querySelector<HTMLElement>('.content');
        if (showPopUp) {
            if (contentEl) contentEl.style.overflow = 'hidden';
        } else {
            if (contentEl) contentEl.style.overflow = '';
        }
        return () => {
            if (contentEl) contentEl.style.overflow = '';
        };
    }, [showPopUp]);

    if (!showPopUp) {
        return null;
    }

    return (
        <div className="popup-overlay" onClick={closePopUp}>
            <div className="popup-content" onClick={e => e.stopPropagation()}> {/* Prevents closing when clicking inside content */}
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
