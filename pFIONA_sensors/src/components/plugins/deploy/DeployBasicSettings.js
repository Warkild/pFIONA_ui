// Importing React and useEffect, useState hooks from the react library
import React, { useEffect, useState } from 'react';

// Defining the DeployBasicSettings functional component with no props
function DeployBasicSettings({}) {

    /** DEPLOYED STATUS **/

    // State to manage loading status of deployment check
    const [isLoadingDeployed, setIsLoadingDeployed] = useState(true);
    // State to manage error status of deployment check
    const [isErrorDeployed, setIsErrorDeployed] = useState(false);
    // State to store error message for deployment check
    const [errorMessageDeployed, setErrorMessageDeployed] = useState('');
    // State to store deployment status
    const [isDeployed, setIsDeployed] = useState();

    // Function to check deployment status from the server
    const checkDeployedStatus = () => {
        fetch(`/api/is_deployed?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                // Handling unsuccessful response
                setErrorMessageDeployed("Unable to connect");
                setIsErrorDeployed(true);
                setIsLoadingDeployed(false);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handling successful response
            setIsDeployed(data.data);
            setIsLoadingDeployed(false);
            console.log('Success:', data);
        })
        .catch(error => {
            // Handling fetch errors
            setErrorMessageDeployed(`There is an error : ${error.message}`);
            setIsErrorDeployed(true);
            setIsLoadingDeployed(false);
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

    // useEffect to run the deployment and sleeping status checks on component mount
    useEffect(() => {
        checkDeployedStatus();
        checkSleepingStatus();

        // Setting up an interval to periodically check statuses
        const intervalId = setInterval(() => {
            checkDeployedStatus();
            checkSleepingStatus();
        }, 5000);

        // Clearing the interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    /** SLEEP MODE **/

    // State to store initial sleep mode status
    const [initialSleep, setInitialSleep] = useState();
    // State to store current sleep mode status
    const [sleep, setSleep] = useState();

    // Function to handle changes in sleep mode status
    const handleSleepChange = (event) => {
        setSleep(event.target.checked);
    };

    // Function to get the current sleep mode status from the server
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
            setInitialSleep(data.data);
            setSleep(data.data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    /** SAMPLE FREQUENCY **/

    // State to store initial sample frequency
    const [initialSampleFrequency, setInitialSampleFrequency] = useState();
    // State to store current sample frequency
    const [sampleFrequency, setSampleFrequency] = useState();

    // Function to get the current sample frequency from the server
    const getSensorSampleFrequency = () => {
        fetch(`/api/get_sensor_sample_frequency?sensor_id=${sensor_id}`, {
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
            setInitialSampleFrequency(data.data);
            setSampleFrequency(data.data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    // Function to handle changes in sample frequency
    const handleSampleFrequencyChange = (event) => {
        setSampleFrequency(event.target.value);
        console.log(event.target.value);
    };

    /** SAVE **/

    // State to manage save status
    const [save, setSave] = useState(false);

    // Function to save sensor settings to the server
    const saveSensorSettings = () => {
        const data = {
            sleep: sleep,
            sample_frequency: sampleFrequency,
            sensor_id: sensor_id,
        };
        fetch(`/api/set_sensor_general_settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Updating initial settings to reflect the saved state
            setInitialSleep(sleep);
            setInitialSampleFrequency(sampleFrequency);
            setSave(true);
            // Hiding the save notification after a timeout
            setTimeout(() => setSave(false), 5000);
        })
        .catch(error => {
            setErrorMessageSleeping(`There is an error : ${error.message}`);
            console.error('Error:', error);
        });
    };

    /** LOADING **/

    // useEffect to load initial sensor settings on component mount
    useEffect(() => {
        getSensorSleep();
        getSensorSampleFrequency();
    }, []);

    // Returning the JSX to render the component
    return (
        <div className="w-5/12">
            <div className="mb-5">
                {/* Heading for the Basic Settings section */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">BASIC SETTINGS</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"mb-4"}>
                    <label>
                        {/* Checkbox for sleep mode */}
                        <input
                            type="checkbox"
                            className={"form-checkbox focus:outline-none rounded-lg mr-3"}
                            checked={sleep} // Controls the checked property based on the sleep state
                            onChange={handleSleepChange} // Updates the state when checkbox is toggled
                        />
                        Sleep Mode
                    </label>
                </div>
                <div className={"flex flex-col mb-5"}>
                    <label>
                        Sample Frequency (min)
                    </label>
                    {/* Input field for sample frequency */}
                    <input
                        type="number"
                        className={"remove-arrow border-gray-600 rounded-lg"}
                        onChange={handleSampleFrequencyChange}
                        value={sampleFrequency}
                    />
                </div>
                {/* Warning message if deployment is active and settings have changed */}
                {isDeployed && (initialSleep !== sleep || initialSampleFrequency !== sampleFrequency) && (
                    <div className={"flex flex-row items-center h-min mb-5"}>
                        <img src={"/static/img/ico/icons8-warning-yellow-512.svg"} alt="Warning"
                             className={"w-6 h-6 mr-2"}/>
                        <p>Warning: The following changes will be made in the next cycle</p>
                    </div>
                )}
                <div className={"flex flex-row items-center"}>
                    {/* Button to save sensor settings */}
                    <button onClick={saveSensorSettings} className={"bg-blue-600 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400"}>Save</button>
                    {/* Notification of successful save */}
                    {save &&
                        <div className={"flex flex-row h-min items-center pl-2"}>
                            <img src={"/static/img/ico/icons8-checked-512.svg"} alt="Checked"
                                 className={"w-6 h-6 mr-2"}/>
                            <p>Save in database</p>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

// Exporting the DeployBasicSettings component as default
export default DeployBasicSettings;
