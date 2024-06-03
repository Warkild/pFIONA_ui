import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import ValvePort from "../plugins/manualControl/ValvePort";
import Pumps from "../plugins/manualControl/Pumps";
import Spectrophotometer from "../plugins/manualControl/Spectrophotometer";
import AuxPump from "../plugins/manualControl/AuxPump";
import PreEstablishedScan from "../plugins/manualControl/PreEstablishedScan";

function ManualControlApp() {


    /** DEPLOYED STATUS **/

    const [isLoadingDeployed, setIsLoadingDeployed] = useState(true);
    const [isErrorDeployed, setIsErrorDeployed] = useState(false);
    const [errorMessageDeployed, setErrorMessageDeployed] = useState('');
    const [isDeployed, setIsDeployed] = useState();

    const checkDeployedStatus = () => {
        fetch(`/api/is_deployed?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    setErrorMessageDeployed("Unable to connect")
                    setIsErrorDeployed(true)
                    setIsLoadingDeployed(false)
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setIsDeployed(data.data)
                setIsLoadingDeployed(false)
                console.log('Success:', data);
            })
            .catch(error => {
                setErrorMessageDeployed(`There is an error : ${error.message}`)
                setIsErrorDeployed(true)
                setIsLoadingDeployed(false)
                console.error('Error:', error);
            });
    };

    useEffect(() => {
        checkDeployedStatus();

        const intervalId = setInterval(() => {

            checkDeployedStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const [logMessages, setLogMessages] = useState([]);

    const addLogMessage = (message) => {
        setLogMessages(prev => [...prev, message]);
    };

    const [inAction, setInAction] = useState(false)

    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        fetch(`http://${SENSOR_IP}:5000/sensor/get_state`, {
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
                setConnected(true)
            })
            .catch(error => {
                console.error('Error:', error);
                setConnected(false)
            });
    };

    useEffect(() => {
        checkStatus();

        const intervalId = setInterval(() => {

            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            {isLoadingDeployed ? (
                <>
                    Loading...
                </>
            ) : (
                <div className={"flex flex-col"}>
                    {isDeployed &&
                        <div
                            className={"font-montserrat rounded-lg border border-red-700 bg-red-100 text-red-700 mb-5"}>
                            <div className={"flex flex-row h-min py-2 px-3"}>
                                <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                     className={"w-6 h-6 mr-2"}/>
                                <p>Deploy Mode is active. You must shut off it to use manual mode.</p>
                            </div>
                        </div>
                    }
                    {connected ? (
                        <>
                            <div className={"flex flex-row justify-between pb-12"}>
                                <ValvePort inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}/>
                                <Pumps inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}/>
                            </div>
                            <div className={"flex flex-row justify-between pb-12"}>
                                <Spectrophotometer inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}/>
                                <AuxPump inAction={inAction} setInAction={setInAction} isDeployed={isDeployed}/>
                            </div>
                            <div className={"flex flex-row justify-between pb-12"}>
                                <PreEstablishedScan/>
                            </div>
                        </>
                    ) : (
                        <div
                            className={"font-montserrat rounded-lg border border-red-700 bg-red-100 text-red-700 mb-5"}>
                            <div className={"flex flex-row h-min py-2 px-3"}>
                                <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                     className={"w-6 h-6 mr-2"}/>
                                <p>Sensor is disconnected. You can't use the manual mode.</p>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </>
    );
}

const manualControlDiv = document.getElementById("manual_control_app");
if (manualControlDiv) {
    const root = createRoot(manualControlDiv);
    root.render(<ManualControlApp/>);
}
