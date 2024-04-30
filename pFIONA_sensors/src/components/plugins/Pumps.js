import React, { useState } from 'react';
import Alert from "./Alert";

function Pumps() {

    // Return HTML Code
    return (
        <div className={"w-9/12"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>PUMPS</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"}>
                <div className={"flex flex-row justify-between mb-5"}>
                    <div className={"flex-col w-5/12"}>
                        <p className={"font-black mb-2"}>PUMP 1</p>
                        <p className={"font-montserrat text-sm mb-2"}>Volume (μL)</p>
                        <input type="number" className={"text-center w-full remove-arrow rounded-lg mb-2"}></input>
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input type="number" className={"text-center w-full remove-arrow rounded-lg mb-2"}></input>
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="hs-basic-with-description"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input type="checkbox" id="hs-basic-with-description"
                                   className="relative w-[6.5rem] h-7 p-px bg-gray-100 border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-blue-600 checked:border-blue-600 focus:checked:border-blue-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-600 before:inline-block before:size-6 before:bg-white checked:before:bg-blue-200 before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"/>
                            <label htmlFor="hs-basic-with-description"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>
                    </div>
                    <div className={"flex-col w-5/12"}>
                        <p className={"font-black mb-2"}>PUMP 2</p>
                        <p className={"font-montserrat text-sm mb-2"}>Volume (μL)</p>
                        <input type="number" className={"text-center w-full remove-arrow rounded-lg mb-2"}></input>
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input type="number" className={"text-center w-full remove-arrow rounded-lg mb-2"}></input>
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="hs-basic-with-description"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input type="checkbox" id="hs-basic-with-description"
                                   className="relative w-[6.5rem] h-7 p-px bg-gray-100 border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-blue-600 checked:border-blue-600 focus:checked:border-blue-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-600 before:inline-block before:size-6 before:bg-white checked:before:bg-blue-200 before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"/>
                            <label htmlFor="hs-basic-with-description"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>
                    </div>
                </div>
                <div className={"flex flex-row justify-between mb-5"}>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}>Run Pump 1</button>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}>Run Both</button>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}>Run Pump 2</button>
                </div>
                <div className={"flex flex-row justify-between"}>
                    <button className={"bg-blue-600 w-5/12 rounded-lg text-white font-poppins py-2 text-sm"}>Slew Pump 1</button>
                    <button className={"bg-blue-600 w-5/12 rounded-lg text-white font-poppins py-2 text-sm"}>Slew Pump 2</button>
                </div>
            </div>
        </div>
    );
}

export default Pumps;
