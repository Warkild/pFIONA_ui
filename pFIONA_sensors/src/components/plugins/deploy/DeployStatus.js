// Importing React and useEffect, useState hooks from the react library
import React, { useEffect, useState } from 'react';

// Defining the DeployStatus functional component with props
function DeployStatus({ connected, isDeployed, setIsDeployed, isLoadingDeployed, isErrorDeployed, errorMessageDeployed }) {

    /** STOP DEPLOYING STATUS **/

    // State to manage the stop deploying status
    const [isStopDeploying, setIsStopDeploying] = useState();

    // Function to check the stop deploying status from the server
    const checkStopDeployingStatus = () => {
        fetch(`/api/is_stop_deploying_in_progress?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                // Handling unsuccessful response
                setErrorMessageDeployed("Unable to connect");
                setIsStopDeploying(false);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handling successful response
            setIsStopDeploying(data.data);
            console.log('Success:', data);
        })
        .catch(error => {
            // Handling fetch errors
            setErrorMessageDeployed(`There is an error : ${error.message}`);
            setIsStopDeploying(false);
            console.error('Error:', error);
        });
    };

    /** SLEEPING STATUS **/

    // State to manage loading status of sleeping check
    const [isLoadingSleeping, setIsLoadingSleeping] = useState(true);
    // State to manage error status of sleeping check
    const [isErrorSleeping, setIsErrorSleeping] = useState(false);
    // State to store error message for sleeping check
    const [errorMessageSleeping, setErrorMessageSleeping] = useState('');
    // State to store sleeping status
    const [isSleeping, setIsSleeping] = useState();

    // Function to check sleeping status from the server
    const checkSleepingStatus = () => {
        fetch(`/api/is_sleeping?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                // Handling unsuccessful response
                setErrorMessageSleeping("Unable to connect");
                setIsErrorSleeping(true);
                setIsLoadingSleeping(false);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handling successful response
            setIsSleeping(data.data);
            setIsLoadingSleeping(false);
            console.log('Success:', data);
        })
        .catch(error => {
            // Handling fetch errors
            setErrorMessageSleeping(`There is an error : ${error.message}`);
            setIsErrorSleeping(true);
            setIsLoadingSleeping(false);
            console.error('Error:', error);
        });
    };

    // useEffect to run the sleeping and stop deploying status checks on component mount and periodically
    useEffect(() => {
        checkSleepingStatus();
        checkStopDeployingStatus();

        // Setting up an interval to periodically check statuses
        const intervalId = setInterval(() => {
            checkSleepingStatus();
            checkStopDeployingStatus();
        }, 5000);

        // Clearing the interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    /** START DEPLOY **/

    // Function to start the deployment
    const startDeploy = () => {
        const url = `http://${sensor_ip}:${sensor_port}/sensor/deploy`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setIsDeployed(true);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    /** STOP DEPLOY **/

    // State to manage stop deploy success status
    const [stopDeploySuccess, setStopDeploySuccess] = useState(false);

    // Function to stop the deployment
    const stopDeploy = () => {
        const url = `http://${sensor_ip}:${sensor_port}/sensor/stop_deploy`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setStopDeploySuccess(true);
            setIsStopDeploying(true);
            setTimeout(() => setStopDeploySuccess(false), 5000);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    /** GET CURRENT REACTION **/

    // State to store the current reaction names
    const [currentReactionNames, setCurrentReactionNames] = useState([]);
    // State to manage the validity of the current reaction
    const [reactionValid, setReactionValid] = useState(true);

    // useEffect to fetch the current reaction names on component mount
    useEffect(() => {
        fetch(`/api/get_current_reaction?sensor_id=${sensor_id}`)
        .then(response => response.json())
        .then(data => {
            const reactionNames = data.reaction_names || []; // assuming the API returns a list of reaction names
            setCurrentReactionNames(reactionNames);
            checkReactionValid(reactionNames);
        })
        .catch(error => console.error("Error fetching current reaction names:", error));
    }, [sensor_id]);

    // Function to check the validity of the current reaction
    function checkReactionValid(reactionNames) {
        if (reactionNames.length > 0) {
            const queries = reactionNames.map(name =>
                fetch(`/api/get_validity_reaction_to_set_as_current_reaction?reaction_name=${name}&sensor_id=${sensor_id}`).then(response => response.json())
            );

            Promise.all(queries)
            .then(results => {
                const allValid = results.every(result => result.data);
                setReactionValid(allValid);
            })
            .catch(error => console.error("Error fetching current reaction validity:", error));
        }
    }

    // Returning the JSX to render the component
    return (
        <div className="w-full">
            <div className="mb-5">
                {/* Heading for the Status section */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">STATUS</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-row pb-6"}>
                    {currentReactionNames.length > 0 ? (
                        <>
                            <p>Current Reaction Names: <strong>{currentReactionNames.join(', ')}</strong></p>
                        </>
                    ) : (
                        <>
                            <p>Current Reaction Names: --nothing-- </p>
                        </>
                    )}
                    {currentReactionNames.length > 0 && (
                        <>
                            {reactionValid ? (
                                <div className={"flex flex-row h-min ml-5"}>
                                    <img src={"/static/img/ico/icons8-checked-512.svg"} alt="Checked"
                                         className={"w-6 h-6 mr-2"}/>
                                    <p>All reagents and standards are active</p>
                                </div>
                            ) : (
                                <div className={"flex flex-row h-min ml-5"}>
                                    <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                         className={"w-6 h-6 mr-2"}/>
                                    <p>Warning: Some reagents/standards are not loaded. <strong>This can cause errors during execution!</strong></p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className={"flex flex-row"}>
                    <div className={"flex flex-col space-y-5 w-3/12"}>
                        <div className="flex flex-row items-center">
                            <div
                                className={`w-5 h-5 rounded-full ${isLoadingDeployed ? 'bg-amber-500' : isErrorDeployed ? 'bg-red-600' : isDeployed ? 'bg-green-600' : 'bg-red-600'}`}></div>
                            <p className="ml-3">
                                {isLoadingDeployed ? 'Loading' : isErrorDeployed ? errorMessageDeployed : isDeployed ? 'Deployed' : 'Not Deployed'}
                            </p>
                        </div>
                        <div className="flex flex-row items-center">
                            <div
                                className={`w-5 h-5 rounded-full ${isLoadingSleeping ? 'bg-amber-500' : isErrorSleeping ? 'bg-red-600' : isSleeping ? 'bg-purple-600' : connected ? "bg-green-600" : "bg-red-600"}`}></div>
                            <p className="ml-3">
                                {isLoadingSleeping ? 'Loading' : isErrorSleeping ? errorMessageSleeping : isSleeping ? 'Sleeping' : connected ? 'Active' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <div className={"flex flex-col w-9/12"}>
                        {!isDeployed ? (
                            <>
                                {/* Button to start deployment */}
                                <button
                                    className={`rounded-lg font-poppins py-2 px-7 text-sm ${connected ? "bg-lime-500 hover:bg-lime-300 text-white" : "text-gray-600 bg-gray-300"}`}
                                    onClick={startDeploy}
                                    disabled={!connected}
                                >
                                    START DEPLOY
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Button to stop deployment */}
                                <button
                                    className={`rounded-lg text-white font-poppins py-2 px-7 text-sm ${isStopDeploying ? 'bg-amber-500' : 'bg-red-600 hover:bg-red-400'}`}
                                    onClick={stopDeploy}
                                    disabled={isStopDeploying}
                                >
                                    {isStopDeploying ? 'STOP DEPLOYING IN PROGRESS' : 'STOP DEPLOY'}</button>
                            </>
                        )}
                        {/* Notification of successful stop order */}
                        {stopDeploySuccess &&
                            <div className={"flex flex-row h-min items-center mt-2"}>
                                <img src={"/static/img/ico/icons8-checked-512.svg"} alt="Checked"
                                     className={"w-6 h-6 mr-2"}/>
                                <p>Stop order sent successfully</p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

// Exporting the DeployStatus component as default
export default DeployStatus;
