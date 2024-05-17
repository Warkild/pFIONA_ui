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

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">STATUS</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-col space-y-5"}>
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
            </div>
        </div>

    );
}

export default DeployStatus;
