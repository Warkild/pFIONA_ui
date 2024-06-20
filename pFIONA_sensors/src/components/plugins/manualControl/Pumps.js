import React, {useState} from 'react';
import Alert from "../universal/Alert";

function Pumps({inAction, setInAction, isDeployed, allowAnything}) {

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

    // Button logic
    const [runningPump1, setRunningPump1] = useState(false)
    const [runningPump2, setRunningPump2] = useState(false)
    const [runningPumpBoth, setRunningBoth] = useState(false)
    const [slewingPump1, setSlewingPump1] = useState(false)
    const [slewingPump2, setSlewingPump2] = useState(false)
    const [slewingPumpBoth, setSlewingPumpBoth] = useState(false)

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

            let volumeRequest;

            if (aspirateDispensePump1) {
                // True = Dispense // Positive volume
                volumeRequest = volumePump1
            } else {
                // False = Aspirate // Negative volume
                volumeRequest = -volumePump1
            }

            const url = `http://${sensor_ip}:5000/steppump/1/run_pump`;

            setInAction(true);
            setRunningPump1(true);

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    "flow_rate": parseInt(flowRatePump1),
                    "volume": parseInt(volumeRequest),
                    "wait_until_done": true
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    setInAction(false)
                    setRunningPump1(false)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setInAction(false)
                    setRunningPump1(false)
                    setAlertModalText(error.message);
                    setIsModalOpen(true);
                });
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const runPump2 = () => {
        try {
            checkValuesPump2();

            let volumeRequest;

            if (aspirateDispensePump2) {
                // True = Dispense // Positive volume
                volumeRequest = volumePump2
            } else {
                // False = Aspirate // Negative volume
                volumeRequest = -volumePump2
            }

            const url = `http://${sensor_ip}:5000/steppump/2/run_pump`;

            setInAction(true);
            setRunningPump2(true);

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    "flow_rate": parseInt(flowRatePump2),
                    "volume": parseInt(volumeRequest),
                    "wait_until_done": true
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    setInAction(false)
                    setRunningPump2(false)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setInAction(false)
                    setRunningPump2(false)
                });
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const runPumpBoth = () => {
        try {
            checkValuesPump1();
            checkValuesPump2();

            let volumeRequest1;

            if (aspirateDispensePump1) {
                // True = Dispense // Positive volume
                volumeRequest1 = volumePump1
            } else {
                // False = Aspirate // Negative volume
                volumeRequest1 = -volumePump1
            }

            let volumeRequest2

            if (aspirateDispensePump2) {
                // True = Dispense // Positive volume
                volumeRequest2 = volumePump2
            } else {
                // False = Aspirate // Negative volume
                volumeRequest2 = -volumePump2
            }

            const url = `http://${sensor_ip}:5000/steppump/1/run_both_pumps`;

            setInAction(true);
            setRunningBoth(true);

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    "flow_rate1": parseInt(flowRatePump1),
                    "flow_rate2": parseInt(flowRatePump2),
                    "volume1": parseInt(volumeRequest1),
                    "volume2": parseInt(volumeRequest2),
                    "wait_until_done": true
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    setInAction(false)
                    setRunningBoth(false)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setInAction(false)
                    setRunningBoth(false)
                });
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

    /**
     * SLEW PUMPS
     */

    const slewPump1 = () => {
        try {
            setInAction(true)
            setSlewingPump1(true)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const slewPump2 = () => {
        try {
            setInAction(true)
            setSlewingPump2(true)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const slewPumpBoth = () => {
        try {
            setInAction(true)
            setSlewingPumpBoth(true)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const endSlewPump1 = () => {
        try {
            setInAction(false)
            setSlewingPump1(false)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const endSlewPump2 = () => {
        try {
            setInAction(false)
            setSlewingPump2(false)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }
    }

    const endSlewPumpBoth = () => {
        try {
            setInAction(false)
            setSlewingPumpBoth(false)
            console.log("SUCCESS");
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
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
                        <input
                            type="number"
                            className={`text-center w-full remove-arrow rounded-lg mb-2 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-gray-200' : ''
                            }`}
                            value={volumePump1}
                            onChange={(e) => {
                                setVolumePump1(e.target.value);
                            }}
                            disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))}
                        />
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input
                            type="number"
                            className={`text-center w-full remove-arrow rounded-lg mb-2 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-gray-200' : ''
                            }`}
                            value={flowRatePump1}
                            onChange={(e) => {
                                setFlowRatePump1(e.target.value);
                            }}
                            disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))}
                        />
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="toogle-ad-pump-1"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input
                                type="checkbox"
                                id="toogle-ad-pump-1"
                                className={`relative w-[6.5rem] h-7 p-px border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-purple-600 checked:border-purple-600 focus:checked:border-purple-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-teal-200 before:inline-block before:size-6 before:bg-white checked:before:bg-white before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-teal-200' : 'bg-teal-500'}`}
                                onChange={(e) => {
                                    setAspirateDispensePump1(e.target.checked);
                                }}
                                checked={aspirateDispensePump1}
                            disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))}
                            />
                            <label htmlFor="toogle-ad-pump-1"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>
                    </div>
                    <div className={"flex-col w-5/12"}>
                        <p className={"font-black mb-2"}>PUMP 2</p>
                        <p className={"font-montserrat text-sm mb-2"}>Volume (μL)</p>
                        <input
                            type="number"
                            className={`text-center w-full remove-arrow rounded-lg mb-2 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-gray-200' : ''
                            }`}
                            value={volumePump2}
                            onChange={(e) => {
                                setVolumePump2(e.target.value);
                            }}
                            disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))}
                        />
                        <p className={"font-montserrat text-sm mb-2"}>Flow Rate (μL / s)</p>
                        <input
                            type="number"
                            className={`text-center w-full remove-arrow rounded-lg mb-2 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-gray-200' : ''
                            }`}
                            value={flowRatePump2}
                            onChange={(e) => {
                                if (!inAction && !isDeployed) {
                                    setFlowRatePump2(e.target.value);
                                }
                            }}
                            disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))}
                        />
                        <p className={"font-montserrat text-sm mb-2"}>Aspirate / Dispense</p>
                        <div className="flex items-center justify-around">
                            <label htmlFor="toogle-ad-pump-2"
                                   className="text-sm text-gray-500 me-3 dark:text-neutral-400">Aspirate</label>
                            <input
                                type="checkbox"
                                id="toogle-ad-pump-2"
                                className={`relative w-[6.5rem] h-7 p-px border-transparent text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-purple-600 checked:border-purple-600 focus:checked:border-purple-600 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-teal-200 before:inline-block before:size-6 before:bg-white checked:before:bg-white before:translate-x-0 checked:before:translate-x-[4.7rem] before:rounded-full before:shadow before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 ${
                              (inAction && !allowAnything) || 
                              (isDeployed) || 
                              (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                              ? 'bg-teal-200' : 'bg-teal-500'}`}
                                onChange={(e) => {
                                    setAspirateDispensePump2(e.target.checked);
                                }}
                                checked={aspirateDispensePump2}
                                disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))}
                            />
                            <label htmlFor="toogle-ad-pump-2"
                                   className="text-sm text-gray-500 ms-3 dark:text-neutral-400">Dispense</label>
                        </div>

                    </div>
                </div>
                <div className="flex flex-row justify-between mb-5">
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 ${
                            (inAction && !allowAnything) ||
                            isDeployed ||
                            (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                                ? runningPump1 ? 'bg-green-600 cursor-not-allowed text-white' : 'bg-gray-200 cursor-not-allowed text-gray-700'
                                : 'bg-blue-600 text-white'
                        }`}
                        onClick={runPump1}
                        disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))}
                    >
                        {runningPump1 ? "Running" : "Run Pump 1"}
                    </button>
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 ${
                            (inAction && !allowAnything) ||
                            isDeployed ||
                            (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth || runningPump2 || slewingPump2))
                                ? runningPumpBoth ? 'bg-green-600 cursor-not-allowed text-white' : 'bg-gray-200 cursor-not-allowed text-gray-700'
                                : 'bg-blue-600 text-white'
                        }`}
                        onClick={runPumpBoth}
                        disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth || runningPump2 || slewingPump2))}
                    >
                        {runningPumpBoth ? "Running" : "Run Both"}
                    </button>
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 ${
                            (inAction && !allowAnything) ||
                            isDeployed ||
                            (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                                ? runningPump2 ? 'bg-green-600 cursor-not-allowed text-white' : 'bg-gray-200 cursor-not-allowed text-gray-700'
                                : 'bg-blue-600 text-white'
                        }`}                        onClick={runPump2}
                        disabled={(inAction && !allowAnything) || isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))}
                    >
                        {runningPump2 ? "Running" : "Run Pump 2"}
                    </button>
                </div>
                <div className="flex flex-row justify-between">
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 text-sm ${slewingPump1 ? "bg-red-600 text-white" : 
                          ((isDeployed || (inAction && !allowAnything) || slewingPumpBoth) ? 
                          "bg-gray-200 cursor-not-allowed text-gray-700" : "bg-blue-600 text-white")}`}
                        onClick={slewingPump1 ? endSlewPump1 : !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                        ) ? slewPump1 : null}
                        disabled={!(slewingPump1 || !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPumpBoth || slewingPumpBoth))
                        ))}
                    >
                        {slewingPump1 ? "Stop" : "Slew Pump 1"}
                    </button>
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 text-sm ${slewingPumpBoth ? "bg-red-600 text-white" : 
                      ((isDeployed || (inAction && !allowAnything) || slewingPump1 || slewingPump2) ? 
                      "bg-gray-200 cursor-not-allowed text-gray-700" : "bg-blue-600 text-white")}`}
                        onClick={slewingPumpBoth ? endSlewPumpBoth : !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPump2 || slewingPump2))
                        ) ? slewPumpBoth : null}
                        disabled={!(slewingPumpBoth || !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump1 || slewingPump1 || runningPump2 || slewingPump2))
                        ))}
                    >
                        {slewingPumpBoth ? "Stop" : "Slew Both"}
                    </button>
                    <button
                        className={`w-3/12 rounded-lg font-poppins py-2 text-sm ${slewingPump2 ? "bg-red-600 text-white" : 
  ((isDeployed || (inAction && !allowAnything) || slewingPumpBoth) ? 
  "bg-gray-200 cursor-not-allowed text-gray-700" : "bg-blue-600 text-white")}`}
                        onClick={slewingPump2 ? endSlewPump2 : !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                        ) ? slewPump2 : null}
                        disabled={!(slewingPump2 || !((inAction && !allowAnything) ||
                            isDeployed || (allowAnything && (runningPump2 || slewingPump2 || runningPumpBoth || slewingPumpBoth))
                        ))}
                    >
                        {slewingPump2 ? "Stop" : "Slew Pump 2"}
                    </button>
                </div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

export default Pumps;
