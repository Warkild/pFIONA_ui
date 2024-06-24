import React from 'react';
import Modal from 'react-modal';

Modal.setAppElement('body');  // Assure une meilleure accessibilité

const Alert = ({ isOpen, onRequestClose, text="" }) => {
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
            <div>
                <h2 className={"text-2xl pb-5"}>Error</h2>
                <p className={"pb-5"}>{text}</p>
                <button onClick={onRequestClose} className={"bg-red-600 hover:bg-red-400 rounded-lg text-white font-poppins py-1 px-7 text-sm"}>Close</button>
            </div>
        </Modal>
    );
};

export default Alert;
