import React, { useState } from 'react';
import Alert from "../universal/Alert";

function PreEstablishedScan() {

    const launchBlankScan = () => {
        console.log('launchBlankScan');
    }

    const launchSampleScan = () => {
        console.log('launchSampleScan');
    }

    const launchStandardScan = () => {
        console.log('launchStandardScan');
    }

    // Return HTML Code
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>PRE-ESTABLISHED SCAN</h2>
            </div>
            <div className={"flex flex-row font-montserrat bg-white shadow-lg rounded-2xl py-5 space-x-8 px-8 justify-between"}>
                <button onClick={launchBlankScan} className={"bg-blue-600 rounded-lg text-white font-poppins py-2 w-full"}>Launch Blank Scan
                </button>
                <button onClick={launchSampleScan} className={"bg-blue-600 rounded-lg text-white font-poppins py-2 w-full"}>Launch Sample Scan
                </button>
                <button onClick={launchStandardScan} className={"bg-blue-600 rounded-lg text-white font-poppins py-2 w-full"}>Launch Standard Scan
                </button>
            </div>
        </div>
    );
}

export default PreEstablishedScan;
