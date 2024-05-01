import React, { useState } from 'react';
import Alert from "./Alert";

function Spectrophotometer() {

    // Return HTML Code
    return (
        <div className={"w-9/12"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"}>
                <p>This is spec.</p>
            </div>
        </div>
    );
}

export default Spectrophotometer;
