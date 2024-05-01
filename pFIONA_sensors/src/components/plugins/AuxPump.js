import React, { useState } from 'react';
import Alert from "./Alert";

function AuxPump() {

    // Return HTML Code
    return (
        <div className={"w-2/12"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>AUX PUMP</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"}>
                <p>This is aux pump.</p>
            </div>
        </div>
    );
}

export default AuxPump;
