import React, { useEffect, useState } from 'react';
import { createRoot } from "react-dom/client";

const EmergencyStopAndRestart = ({  }) => {
    // State to track if the sensor is connected
    const [connected, setConnected] = useState(false);

    // State to control the visibility of the Emergency Stop text
    const [showEmergencyStopText, setShowEmergencyStopText] = useState(false);

    // State to control the visibility of the Restart text
    const [showRestartText, setShowRestartText] = useState(false);

    // Function to check the status of the sensor
    const checkStatus = () => {
        // Check if the access token exists in session storage
        if (sessionStorage.getItem('accessToken') != null) {
            // Fetch the sensor state from the server
            fetch(`http://${sensor_ip}:5000/sensor/get_state`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Parse the response JSON
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    // Set the connected state to true
                    setConnected(true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Set the connected state to false
                    setConnected(false);
                });
        }
    };

    // useEffect to check the status initially and set an interval to check the status every 5 seconds
    useEffect(() => {
        checkStatus();

        const intervalId = setInterval(() => {
            checkStatus();
        }, 5000);

        // Cleanup the interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // State to track the number of times the Emergency Stop button is clicked
    const [emergencyStopClicked, setEmergencyStopClicked] = useState(0);

    // State to track the number of times the Restart button is clicked
    const [restartClicked, setRestartClicked] = useState(0);

    // Function to handle the Emergency Stop button click
    const handleEmergencyStop = () => {
        // Increment the emergency stop click count
        setEmergencyStopClicked(prev => prev + 1);
        // Reset the click count after 2 seconds
        setTimeout(() => setEmergencyStopClicked(0), 2000);
        // If the button is double-clicked and the access token exists
        if (emergencyStopClicked + 1 === 2 && sessionStorage.getItem('accessToken') != null) {
            const emergencyStopUrl = `http://${sensor_ip}:5000/sensor/stop_deploy`;
            // Send a POST request to stop the sensor deployment
            fetch(emergencyStopUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    now: 'True',
                }),
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Parse the response JSON
                    return response.json();
                })
                .then(data => {
                    console.log('Emergency Stop Successful:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
            // Reset the click count
            setEmergencyStopClicked(0);
        }
    };

    // Function to handle the Restart button click
    const handleRestart = () => {
        // Increment the restart click count
        setRestartClicked(prev => prev + 1);
        // Reset the click count after 2 seconds
        setTimeout(() => setRestartClicked(0), 2000);
        // If the button is double-clicked and the access token exists
        if (restartClicked + 1 === 2 && sessionStorage.getItem('accessToken') != null) {
            const restartUrl = `http://${sensor_ip}:5000/sensor/restart`;
            // Send a POST request to restart the sensor
            fetch(restartUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    action: 'restart',
                }),
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Parse the response JSON
                    return response.json();
                })
                .then(data => {
                    console.log('Restart Successful:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
            // Reset the click count
            setRestartClicked(0);
        }
    };

    return connected ? (
        <div className="flex flex-col space-y-5">
            <li
                onDoubleClick={handleEmergencyStop}
                onMouseEnter={() => setShowEmergencyStopText(true)}
                onMouseLeave={() => setShowEmergencyStopText(false)}
                className="flex cursor-pointer"
            >
                <img
                    src="/static/img/ico/icons8-open-hand-512.svg"
                    alt="icons-list"
                    style={{ filter: 'invert(22%) sepia(80%) saturate(2871%) hue-rotate(346deg) brightness(87%) contrast(97%)' }}
                    className="h-10"
                />
                {/* Conditionally render the Emergency Stop text based on showEmergencyStopText state */}
                {showEmergencyStopText && (
                    <p className="font-poppins content-around pl-4 font-medium text-red-600">Emergency stop</p>
                )}
            </li>
            <li
                onDoubleClick={handleRestart}
                onMouseEnter={() => setShowRestartText(true)}
                onMouseLeave={() => setShowRestartText(false)}
                className="flex cursor-pointer"
            >
                <img
                    src="/static/img/ico/icons8-restart-512.svg"
                    alt="icons-list"
                    style={{ filter: 'invert(20%) sepia(7%) saturate(2126%) hue-rotate(178deg) brightness(98%) contrast(84%)' }}
                    className="h-10"
                />
                {/* Conditionally render the Restart text based on showRestartText state */}
                {showRestartText && (
                    <p className="font-poppins content-around pl-4 font-medium">Restart Sensor</p>
                )}
            </li>
        </div>
    ) : null;
};

export default EmergencyStopAndRestart;

// Render the EmergencyStopAndRestart component in each div with id "emergency_stop_and_restart"
document.querySelectorAll("#emergency_stop_and_restart").forEach(div => {
    const ip = div.getAttribute('data-ip');
    console.log(ip);
    const root = createRoot(div);
    root.render(<EmergencyStopAndRestart sensor_ip={ip} />);
});
