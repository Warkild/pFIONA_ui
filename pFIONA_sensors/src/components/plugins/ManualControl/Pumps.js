import React, {useState} from 'react';
import Alert from "../Alert";

function Pumps() {

    /**
     * VARIABLES
     */

        // Pump 1
    const [volumePump1, setVolumePump1] = useState(0);
    const [flowRatePump1, setFlowRatePump1] = useState(0);
    const [aspirateDispensePump1, setAspirateDispensePump1] = useState(true); // default true : dispense

    // Pump 2
    const [volumePump2, setVolumePump2] = useState(0);
    const [flowRatePump2, setFlowRatePump2] = useState(0);
    const [aspirateDispensePump2, setAspirateDispensePump2] = useState(false); // default false : aspirate

    /**
     * ALERT MESSAGE
     */

        // Alert box state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Alert box error message

    const [alertModalText, setAlertModalText] = useState("");

    // Alert box close
    const closeModal = () => {
        setIsModalOpen(false);
    };

    /**
     * RUN PUMPS
     */

    const runPump1 = () => {
        try {
            checkValuesPump1();
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const runPump2 = () => {
        try {
            checkValuesPump2();
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const runPumpBoth = () => {
        try {
            checkValuesPump1();
            checkValuesPump2();
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const checkValuesPump1 = () => {
        let volumePump1isInt = !isNaN(parseInt(volumePump1, 10));
        if (!volumePump1isInt) {
            throw new Error("Volume of pump 1 must be a number");
        }

        if (parseInt(volumePump1, 10) <= 0) {
            throw new Error("Volume of pump 1 must be positive");
        }

        console.log('rege')

        let flowRatePump1isInt = !isNaN(parseInt(flowRatePump1, 10));
        if (!flowRatePump1isInt) {
            throw new Error("Flow rate of pump 1 must be a number");
        }

        if (parseInt(flowRatePump1, 10) <= 0) {
            throw new Error("Flow rate of pump 1 must be positive");
        }
    }

    const checkValuesPump2 = () => {
        let volumePump2isInt = !isNaN(parseInt(volumePump2, 10));
        if (!volumePump2isInt) {
            throw new Error("Volume of pump 2 must be a number");
        }

        if (parseInt(volumePump2, 10) <= 0) {
            throw new Error("Volume of pump 2 must be positive");
        }

        let flowRatePump2isInt = !isNaN(parseInt(flowRatePump2, 10));
        if (!flowRatePump2isInt) {
            throw new Error("Flow rate of pump 2 must be a number");
        }

        if (parseInt(flowRatePump2, 10) <= 0) {
            throw new Error("Flow rate of pump 2 must be positive");
        }
    }


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
                        <input type="number"
                               className={"text-center w-full remove-arrow rounded-lg mb-2"}
                               value={volumePump1}
                               onChange={(e) => {
                                   setVolumePump1(e.target.value)
                               }}
                        ></input>
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input type="number"
                               className={"text-center w-full remove-arrow rounded-lg mb-2"}
                               value={flowRatePump1}
                               onChange={(e) => {
                                   setFlowRatePump1(e.target.value)
                               }}
                        ></input>
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="toogle-ad-pump-1"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input type="checkbox" id="toogle-ad-pump-1"
                                   className="relative w-[6.5rem] h-7 p-px bg-teal-500 border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-purple-600 checked:border-purple-600 focus:checked:border-purple-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-teal-200 before:inline-block before:size-6 before:bg-white checked:before:bg-white before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"
                                   onChange={(e) => {
                                       setAspirateDispensePump1(e.target.checked)
                                   }}
                                   checked={aspirateDispensePump1}
                            />
                            <label htmlFor="toogle-ad-pump-1"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>
                    </div>
                    <div className={"flex-col w-5/12"}>
                        <p className={"font-black mb-2"}>PUMP 2</p>
                        <p className={"font-montserrat text-sm mb-2"}>Volume (μL)</p>
                        <input type="number"
                               className={"text-center w-full remove-arrow rounded-lg mb-2"}
                               value={volumePump2}
                               onChange={(e) => {
                                   setVolumePump2(e.target.value)
                               }}
                        ></input>
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input type="number"
                               className={"text-center w-full remove-arrow rounded-lg mb-2"}
                               value={flowRatePump2}
                               onChange={(e) => {
                                   setFlowRatePump2(e.target.value)
                               }}
                        ></input>
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="toogle-ad-pump-2"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input type="checkbox" id="toogle-ad-pump-2"
                                   className="relative w-[6.5rem] h-7 p-px bg-teal-500 border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-purple-600 checked:border-purple-600 focus:checked:border-purple-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-teal-200 before:inline-block before:size-6 before:bg-white checked:before:bg-white before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"
                                   onChange={(e) => {
                                       setAspirateDispensePump2(e.target.checked)
                                   }}
                                   checked={aspirateDispensePump2}
                            />
                            <label htmlFor="toogle-ad-pump-2"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>
                    </div>
                </div>
                <div className={"flex flex-row justify-between mb-5"}>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}
                            onClick={runPump1}
                    >Run Pump 1
                    </button>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}
                            onClick={runPumpBoth}
                    >Run Both
                    </button>
                    <button className={"bg-blue-600 w-3/12 rounded-lg text-white font-poppins py-2"}
                            onClick={runPump2}
                    >Run Pump 2
                    </button>
                </div>
                <div className={"flex flex-row justify-between"}>
                    <button className={"bg-blue-600 w-5/12 rounded-lg text-white font-poppins py-2 text-sm"}>Slew Pump
                        1
                    </button>
                    <button className={"bg-blue-600 w-5/12 rounded-lg text-white font-poppins py-2 text-sm"}>Slew Pump
                        2
                    </button>
                </div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

export default Pumps;
