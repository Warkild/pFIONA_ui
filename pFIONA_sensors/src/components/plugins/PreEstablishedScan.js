import React, { useState } from 'react';
import Alert from "./Alert";

function PreEstablishedScan() {

    // Return HTML Code
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>PRE-ESTABLISHED SCAN</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"}>
                <p>This is pre-established scan control panel.</p>
            </div>
        </div>
    );
}

export default PreEstablishedScan;
