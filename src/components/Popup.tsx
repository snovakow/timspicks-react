import React from 'react';
import './Popup.css'; // Optional: for styling

function Popup({ showPopUp, closePopUp, children }) {
    if (!showPopUp) {
        return null;
    }

    return (
        <div className="popup-overlay" onClick={closePopUp}>
            <div className="popup-content" onClick={e => e.stopPropagation()}> {/* Prevents closing when clicking inside content */}
                <button className="close-button" onClick={closePopUp}>
                    &times; {/* HTML entity for 'times' (X) */}
                </button>
                {children}
            </div>
        </div>
    );
}

export default Popup;
