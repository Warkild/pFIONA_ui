import React, {useEffect, useState} from 'react';
import Alert from "../universal/Alert";

function AuxPump({inAction, setInAction, isDeployed, allowAnything}) {

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
     * COMPONENT AUX PUMP
     */

        // This component is used to manage aux pump

        // Status if aux pump running
    const [auxPumpRunning, setAuxPumpRunning] = useState(false);

    // Function to turn on pump throw sensor API
    const turnOnAuxPump = () => {
        const url = `http://${sensor_ip}:${sensor_port}/auxpump/turn_on`;

        try {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    setAuxPumpRunning(true);
                    setInAction(true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    setAuxPumpRunning(false);
                    setInAction(false);
                    setAlertModalText(error.message);
                    setIsModalOpen(true);
                });
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
            setAuxPumpRunning(false);
            setInAction(false);
        }
    };

    // Function to turn off pump throw sensor API
    const turnOffAuxPump = () => {
        const url = `http://${sensor_ip}:${sensor_port}/auxpump/turn_off`;

        try {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
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
                    setAuxPumpRunning(false);
                    setInAction(false);
                })
                .catch(error => {
                    console.error('Error:', error);
                    setAlertModalText(error.message);
                    setIsModalOpen(true);
                });
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }

    };

    // Function to get the state of aux pump from sensor
    const getStatus = () => {
        try {
            fetch(`http://${sensor_ip}:${sensor_port}/auxpump/is_active`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
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
                    setAuxPumpRunning(JSON.parse(data.message));
                })
                .catch(error => {
                    console.error('Error:', error);
                    setAlertModalText(error.message);
                    setIsModalOpen(true);
                });
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }

    };


    // Check the real aux pump status from the sensor every 5 seconds
    useEffect(() => {
        getStatus();

        const intervalId = setInterval(() => {
            getStatus();
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className={"w-2/12 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>AUX PUMP</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <p className={"text-sm mb-2"}>Current status :</p>
                    <div className={"flex flex-row items-center mb-5"}>
                        <div className={`w-5 h-5 rounded-full ${auxPumpRunning ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <p className={"ml-3"}>{auxPumpRunning ? 'ON' : 'OFF'}</p>
                    </div>
                    {!auxPumpRunning ? (
                        <button
                            className={`rounded-lg font-poppins py-2 mb-5 ${(inAction && !allowAnything) || isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                            onClick={turnOnAuxPump}
                            disabled={(inAction && !allowAnything) || isDeployed}
                        >
                            Turn ON
                        </button>
                    ) : (
                        <button
                            className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                            onClick={turnOffAuxPump}
                            disabled={isDeployed}
                        >
                            Turn OFF
                        </button>
                    )}
                </div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

export default AuxPump;
