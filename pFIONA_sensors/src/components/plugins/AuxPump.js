import React, { useState } from 'react';
import Alert from "./Alert";

function AuxPump() {
    const [auxPumpStatus, setAuxPumpStatus] = useState(false);

    const turnOnAuxPump = () => {
        setAuxPumpStatus(true);
    };

    const turnOffAuxPump = () => {
        setAuxPumpStatus(false);
    };

    // Return HTML Code
    return (
        <div className={"w-2/12 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>AUX PUMP</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <p className={"text-sm mb-2"}>Current status :</p>
                    <div className={"flex flex-row items-center mb-5"}>
                        <div className={`w-5 h-5 rounded-full ${auxPumpStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <p className={"ml-3"}>{auxPumpStatus ? 'ON' : 'OFF'}</p>
                    </div>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"} onClick={turnOnAuxPump}>Turn ON</button>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"} onClick={turnOffAuxPump}>Turn OFF</button>
                </div>
            </div>
        </div>
    );
}

export default AuxPump;
