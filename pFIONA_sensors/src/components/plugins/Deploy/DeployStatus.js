import React, {useEffect, useState} from 'react';

function DeployStatus({}) {

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

    /** SLEEPING STATUS **/

    const [isLoadingSleeping, setIsLoadingSleeping] = useState(true);
    const [isErrorSleeping, setIsErrorSleeping] = useState(false);
    const [errorMessageSleeping, setErrorMessageSleeping] = useState('');
    const [isSleeping, setIsSleeping] = useState();

    const checkSleepingStatus = () => {
        fetch(`/api/is_sleeping?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    setErrorMessageSleeping("Unable to connect")
                    setIsErrorSleeping(true)
                    setIsLoadingSleeping(false)
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setIsSleeping(data.data)
                setIsLoadingSleeping(false)
                console.log('Success:', data);
            })
            .catch(error => {
                setErrorMessageSleeping(`There is an error : ${error.message}`)
                setIsErrorSleeping(true)
                setIsLoadingSleeping(false)
                console.error('Error:', error);
            });
    };

    useEffect(() => {
        checkDeployedStatus();
        checkSleepingStatus()

        const intervalId = setInterval(() => {

            checkDeployedStatus();
            checkSleepingStatus()
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    /** START DEPLOY **/

    const startDeploy = () => {
        const url = `http://${sensor_ip}:5000/sensor/deploy`;

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
                setIsDeployed(true)
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    /** STOP DEPLOY **/

    const [stopDeploySuccess, setStopDeploySuccess] = useState(false)

    const stopDeploy = () => {
        const url = `http://${sensor_ip}:5000/sensor/stop_deploy`;

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
                setStopDeploySuccess(true)
                setTimeout(() => setStopDeploySuccess(false), 5000);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    /** GET CURRENT REACTION **/

    const [currentReactionId, setCurrentReactionId] = useState(null);
    const [reactionValid, setReactionValid] = useState(true);
    const [currentReactionName, setCurrentReactionName] = useState(null)



    useEffect(() => {
        fetch(`/api/get_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => {
                setCurrentReactionId(data.reaction_id);
                setCurrentReactionName(data.reaction_name)
            })
            .catch(error => console.error("Error fetching current reaction id:", error));
    }, [sensor_id]);

    useEffect(() => {
        checkReactionValid();
    }, [currentReactionId]);

    function checkReactionValid() {
        if (currentReactionId) {
            fetch(`/api/get_validity_reaction_to_set_as_current_reaction?reaction_id=${currentReactionId}`)
                .then(response => response.json())
                .then(data => {
                    setReactionValid(data.data);
                })
                .catch(error => console.error("Error fetching current reaction id:", error));
        } else {
        }
    }

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">STATUS</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-row pb-6"}>
                    {currentReactionName ? (
                        <>
                            <p>Current Reaction Name: <strong>{currentReactionName}</strong></p>
                        </>
                    ) : (
                        <>
                            <p>Current Reaction Name: --nothing-- </p>
                        </>
                    )}
                    {currentReactionId && (
                        <>
                                {reactionValid ? (
                                    <div className={"flex flex-row h-min ml-5"}>
                                        <img src={"/static/img/ico/icons8-checked-512.svg"} alt="Checked"
                                             className={"w-6 h-6 mr-2"}/>
                                        <p>All reagents and standard are active</p>
                                    </div>
                                ) : (
                                    <div className={"flex flex-row h-min ml-5"}>
                                        <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                             className={"w-6 h-6 mr-2"}/>
                                        <p>Warning : Some reagents/standard are not loaded. <strong>This can make error on execution !</strong></p>
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
                                className={`w-5 h-5 rounded-full ${isLoadingSleeping ? 'bg-amber-500' : isErrorSleeping ? 'bg-red-600' : isSleeping ? 'bg-gray-500' : 'bg-green-600'}`}></div>
                            <p className="ml-3">
                                {isLoadingSleeping ? 'Loading' : isErrorSleeping ? errorMessageSleeping : isSleeping ? 'Sleeping' : 'Active'}
                            </p>
                        </div>
                    </div>
                    <div className={"flex flex-col w-9/12"}>
                        {!isDeployed ? (
                            <>
                                <button
                                    className={"bg-lime-500 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-lime-300"}
                                    onClick={startDeploy}
                                >
                                    START DEPLOY
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={"bg-red-600 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-red-400"}
                                    onClick={stopDeploy}
                                >
                                    STOP DEPLOY</button>
                            </>
                        )}
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

export default DeployStatus;
