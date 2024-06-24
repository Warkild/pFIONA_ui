import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ValvePort from "../plugins/manualControl/ValvePort";
import Pumps from "../plugins/manualControl/Pumps";
import Spectrophotometer from "../plugins/manualControl/Spectrophotometer";
import AuxPump from "../plugins/manualControl/AuxPump";
import PreEstablishedScan from "../plugins/manualControl/PreEstablishedScan";
import Serial from "../plugins/manualControl/Serial";

function ManualControlApp() {

    // State for deployment status
    // Global var shared with every subcomponent
    const [isLoadingDeployed, setIsLoadingDeployed] = useState(true);
    const [isDeployed, setIsDeployed] = useState();

    // State for connection status
    const [connected, setConnected] = useState(false);

    // State for action status
    // Global var shared with every subcomponent
    const [inAction, setInAction] = useState(false);

    // State for allowing anything
    // Global var shared with every subcomponent
    // Global var shared with every subcomponent
    const [allowAnything, setAllowAnything] = useState(false);

    // State for preestablished scan
    const [preScanCount, setPreScanCount] = useState(0)

    // Function to check deployed status
    const checkDeployedStatus = () => {
        fetch(`/api/is_deployed?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    setIsLoadingDeployed(false);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setIsDeployed(data.data);
                setIsLoadingDeployed(false);
                console.log('Success:', data);
            })
            .catch(error => {
                setIsLoadingDeployed(false);
                console.error('Error:', error);
            });
    };

    // Check the status of deployment every 5 seconds
    useEffect(() => {
        checkDeployedStatus();
        const intervalId = setInterval(() => {
            checkDeployedStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    // Function to check connection status
    const checkStatus = () => {
        if(sessionStorage.getItem('accessToken') != null) {
            fetch(`http://${sensor_ip}:${sensor_port}/sensor/get_state`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                setConnected(true);
            })
            .catch(error => {
                console.error('Error:', error);
                setConnected(false);
            });
        }
    };

    // Check if the sensor is connected every 5 seconds
    useEffect(() => {
        checkStatus();
        const intervalId = setInterval(() => {
            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);


    // Use for pre-established scan and spectrophotometer
    // When pre-established scan is finished, increase value to launch useEffect function in Spectrophotometer comp
    const handleSpecFinish = () => {
        setPreScanCount(preScanCount+1)
    };

    return (
        <>
            {isLoadingDeployed ? (
                <>
                    Loading...
                </>
            ) : (
                <div className="flex flex-col">
                    {isDeployed &&
                        <div className="font-montserrat rounded-lg border border-red-700 bg-red-100 text-red-700 mb-5">
                            <div className="flex flex-row h-min py-2 px-3">
                                <img src="/static/img/ico/icons8-warning-red-512.svg" alt="Warning"
                                     className="w-6 h-6 mr-2"/>
                                <p>Deploy Mode is active. You must shut off it to use manual mode.</p>
                            </div>
                        </div>
                    }
                    {connected ? (
                        <>
                            <div className="flex flex-row justify-between pb-12">
                                <ValvePort inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}
                                           allowAnything={allowAnything}/>
                                <Pumps inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}
                                       allowAnything={allowAnything}/>
                            </div>
                            <div className="flex flex-row justify-between pb-12">
                                <Spectrophotometer inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}
                                                   allowAnything={allowAnything} preScanCount={preScanCount}/>
                                <AuxPump inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}
                                         allowAnything={allowAnything}/>
                            </div>
                            <div className="flex flex-row justify-between pb-12">
                                <PreEstablishedScan allowAnything={allowAnything} setInAction={setInAction}
                                                    inAction={inAction} handleSpecFinish={handleSpecFinish}/>
                            </div>
                            <div className="flex flex-row justify-between pb-12">
                                <Serial allowAnything={allowAnything} setInAction={setInAction}
                                        inAction={inAction} isDeployed={isDeployed}/>
                            </div>
                            <label className="mb-4 font-montserrat">
                                <input
                                    type="checkbox"
                                    checked={allowAnything}
                                    onChange={(e) => setAllowAnything(e.target.checked)}
                                    className="mr-2"
                                />
                                Allow Anything
                            </label>
                        </>
                    ) : (
                        <div className="font-montserrat rounded-lg border border-red-700 bg-red-100 text-red-700 mb-5">
                            <div className="flex flex-row h-min py-2 px-3">
                                <img src="/static/img/ico/icons8-warning-red-512.svg" alt="Warning"
                                     className="w-6 h-6 mr-2"/>
                                <p>Sensor is disconnected. You can't use the manual mode.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// Launch component if a div with id manual_control_app is present in templates pages
const manualControlDiv = document.getElementById("manual_control_app");
if (manualControlDiv) {
    const root = createRoot(manualControlDiv);
    root.render(<ManualControlApp/>);
}
