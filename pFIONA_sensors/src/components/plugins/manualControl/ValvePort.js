import React, {useEffect, useState} from 'react';
import Alert from "../universal/Alert";

const ValvePort = ({numberOfPorts = 8, inAction, setInAction, isDeployed, allowAnything}) => {

    // Get value of current valve in sensor
    const [currentVal, setCurrentVal] = useState('-');

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false)
    // Alert box error message
    const [alertModalText, setAlertModalText] = useState("");


    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Selected port state
    const [selectedPort, setSelectedPort] = useState(null);

    const handleClick = (port) => {
        if ((inAction && !allowAnything) || isDeployed) return;
        setSelectedPort(port);
        handleMoveClick(port);
    };

    // Get current port from sensor's API
    const getCurrentPort = () => {
        try {
            if (sessionStorage.getItem('accessToken')) {
                fetch(`http://${sensor_ip}:${sensor_port}/valve/get_valve`, {
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
                        if (data.message === 0) {
                            setCurrentVal('Air');
                            setSelectedPort('Air');
                        } else {
                            setCurrentVal(data.message);
                            setSelectedPort(data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        setAlertModalText(error.message);
                        setIsModalOpen(true);
                    });
            }
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }

    };

    // Change valve port threw sensor's API
    const handleMoveClick = (port) => {
        try {
            if (port <= 0) {
                setIsModalOpen(true);
            } else {
                const url = `http://${sensor_ip}:${sensor_port}/valve/change_valve`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        "valve_number": parseInt(port)
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Success:', data);
                        setCurrentVal(port.toString());
                        setSelectedPort(port);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        setAlertModalText(error.message);
                        setIsModalOpen(true);
                    });
            }
        } catch (error) {
            setAlertModalText(error.message);
            setIsModalOpen(true);
        }

    };

    // Move to the air port
    const handleMoveAirPortClick = () => {
        try {
            const url = `http://${sensor_ip}:${sensor_port}/valve/go_air_port`;

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
                    console.log('Success:', data);
                    setCurrentVal('Air');
                    setSelectedPort('Air');
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

    // Get current port every 3 seconds
    useEffect(() => {
        getCurrentPort();

        const intervalId = setInterval(() => {
            getCurrentPort();
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    // Function to generate ports array based on maxPort
    const generatePorts = (maxPort) => {
        let ports = [];
        for (let i = maxPort; i >= 1; i--) {
            ports.push(i);
        }
        return ports;
    };

    // Create ports array dynamically
    const ports = generatePorts(numberOfPorts);

    return (
        <div className={"w-1/6 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>VALVE</h2>
            </div>
            <div className={"bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <>
                        <button
                            className={`${!(inAction && !allowAnything) && !isDeployed ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 cursor-not-allowed"} rounded-lg font-poppins py-1`}
                            onClick={handleMoveAirPortClick}
                            disabled={(inAction && !allowAnything) || isDeployed}
                        >
                            Move to air port
                        </button>
                    </>
                </div>
                <div className="relative w-40 h-40 flex items-center justify-center mx-auto mt-5">
                    {ports.map((port, index) => {
                        const angle = (index / numberOfPorts) * 2 * Math.PI - Math.PI / 2; // Adjusted for counterclockwise order starting at 8
                        const x = Math.cos(angle) * 65;
                        const y = Math.sin(angle) * 65;

                        return (
                            <div
                                key={port}
                                onClick={() => handleClick(port)}
                                className={`absolute w-7 h-7 rounded-full flex items-center justify-center
    ${(inAction && !allowAnything) || isDeployed ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${(inAction && !allowAnything) || isDeployed
                                    ? (selectedPort === port ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-500')
                                    : (selectedPort === port ? 'bg-blue-900 text-white' : 'bg-blue-200 text-black')
                                }`}
                                style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                }}
                            >
                                {port}
                            </div>
                        );
                    })}
                </div>
                {currentVal === "Air" &&
                    <p className={"font-montserrat mt-2"}>> On the air port</p>
                }
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal}/>
        </div>
    );
};

export default ValvePort;
