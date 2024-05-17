import React, {useEffect, useState} from 'react';

function DeployBasicSettings({}) {

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

    /** SLEEP MODE **/

    const [initialSleep, setInitialSleep] = useState();
    const [sleep, setSleep] = useState();

    const handleSleepChange = (event) => {
        setSleep(event.target.checked);
    };

    const getSensorSleep = () => {
        fetch(`/api/get_sensor_sleep?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
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
            setInitialSleep(data.data)
            setSleep(data.data)
        })
        .catch(error => {
            setErrorMessageSleeping(`There is an error : ${error.message}`)
            console.error('Error:', error);
        });
    };

    const saveSensorSleep = () => {
        const data = {
            sleep: sleep,
            sensor_id: sensor_id,
        }
        fetch(`/api/set_sensor_sleep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            setInitialSleep(sleep)
        })
        .catch(error => {
            setErrorMessageSleeping(`There is an error : ${error.message}`)
            console.error('Error:', error);
        });
    };

    useEffect(() => {
        getSensorSleep()
    }, []);

    /** SAVE **/

    const save = () => {
        saveSensorSleep()
    }



    return (
        <div className="w-6/12">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">BASIC SETTINGS</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={sleep} // Controls the checked property based on the sleep state
                            onChange={handleSleepChange} // Updates the state when checkbox is toggled
                        />
                        Sleep Mode
                    </label>
                </div>
                {isDeployed && initialSleep !== sleep && (
                    <div className={"flex flex-row h-min pt-3"}>
                        <img src={"/static/img/ico/icons8-warning-yellow-512.svg"} alt="Warning"
                             className={"w-6 h-6 mr-2"}/>
                        <p>Warning: The following changes will be made in the next cycle</p>
                    </div>
                )}
                <div>
                    <button onClick={save}>Save</button>
                </div>
            </div>
        </div>

    );
}

export default DeployBasicSettings;
