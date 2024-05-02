import React, { useState } from 'react';
import Alert from "../Alert";

function ValvePort() {
    // Get value of current valve in sensor
    const [currentVal, setCurrentVal] = useState(5);

    // Value of selected port
    const [moveToPortValue, setMoveToPortValue] = useState(1);

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Set the value of selected port in moveToPortValue variable (use in onChange of the input)
    const handleMoveToPortChange = (e) => {
        setMoveToPortValue(e.target.value);
    };

    // Alert box close
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Activated when the user click to the button "Move"
    const handleMoveClick = (e) => {
        const value = moveToPortValue;
        if (value <= 0) {
            setIsModalOpen(true);
        } else {
            setMoveToPortValue(value);
            setIsModalOpen(false);
        }
    };

    // Activated when the user click to the button "Move to air port"
    const handleMoveAirPortClick = () => {
        console.log("Bouton move air port")
    }

    // Return HTML Code
    return (
        <div className={"w-1/6 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>VALVE</h2>
            </div>
            <div className={"bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col pb-5"}>
                    <p className={"font-montserrat text-sm pb-2"}>Current Port</p>
                    <input type="number" className={"text-center remove-arrow rounded-lg bg-gray-200"} value={currentVal} readOnly={true}></input>
                </div>
                <div className={"flex flex-col pb-5"}>
                    <p className={"font-montserrat text-sm pb-2"}>Move to port</p>
                    <input type="number" className={"text-center remove-arrow rounded-lg"} value={moveToPortValue} onChange={handleMoveToPortChange}></input>
                </div>
                <div className={"flex flex-col"}>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"} onClick={handleMoveClick}>Move</button>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-1"} onClick={handleMoveAirPortClick}>Move to air port</button>
                </div>
                <div className={"h-5"}></div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} />
        </div>

    );
}

export default ValvePort;
