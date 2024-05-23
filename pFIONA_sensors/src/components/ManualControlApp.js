import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import ValvePort from "./plugins/ManualControl/ValvePort";
import Pumps from "./plugins/ManualControl/Pumps";
import Spectrophotometer from "./plugins/ManualControl/Spectrophotometer";
import AuxPump from "./plugins/ManualControl/AuxPump";
import PreEstablishedScan from "./plugins/ManualControl/PreEstablishedScan";
import Log from "./plugins/ManualControl/Log";

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
            setInAction(data.data)
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

    return (
        <>
            {isLoadingDeployed ? (
            <>
                Loading...
            </>
            ): (
                <div className={"flex flex-col"}>
                    {isDeployed &&
                        <div className={"font-montserrat rounded-lg border border-red-700 bg-red-100 text-red-700 mb-5"}>
                            <div className={"flex flex-row h-min py-2 px-3"}>
                                <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                     className={"w-6 h-6 mr-2"}/>
                                <p>Deploy Mode is active. You must shut off it to use manual mode.</p>
                            </div>
                        </div>
                    }
                    <div className={"flex flex-row justify-between pb-12"}>
                        <ValvePort inAction={inAction} setInAction={setInAction}/>
                        <Pumps inAction={inAction} setInAction={setInAction}/>
                    </div>
                    <div className={"flex flex-row justify-between pb-12"}>
                        <Spectrophotometer addLogMessage={addLogMessage}/>
                        <AuxPump inAction={inAction} setInAction={setInAction}/>
                    </div>
                    <div className={"flex flex-row justify-between"}>
                        <PreEstablishedScan/>
                    </div>
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
