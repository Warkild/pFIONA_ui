import React from 'react';
import Modal from 'react-modal';

Modal.setAppElement('body');  // Assure une meilleure accessibilité

const Alert = ({ isOpen, onRequestClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Invalid Input"
            style={{
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.75)'
                },
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid #ccc',
                    background: '#fff',
                    overflow: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    borderRadius: '10px',
                    outline: 'none',
                    padding: '20px'
                }
            }}
        >
            <h2>Error</h2>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default Alert;
