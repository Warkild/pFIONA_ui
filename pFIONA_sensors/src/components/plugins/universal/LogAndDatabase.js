import React, { useEffect, useState } from 'react';
import { createRoot } from "react-dom/client";

const LogAndDatabase = ({  }) => {
    // State to track if the sensor is connected
    const [connected, setConnected] = useState(false);

    // State to store the URL for the log file
    const [logUrl, setLogUrl] = useState(null);

    // State to store the URL for the database file
    const [databaseUrl, setDatabaseUrl] = useState(null);

    // State to control the visibility of the Log text
    const [showLogText, setShowLogText] = useState(false);

    // State to control the visibility of the Database text
    const [showDatabaseText, setShowDatabaseText] = useState(false);

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

    // Function to handle the Get Log button click
    const handleGetLog = () => {
        // Check if the access token exists in session storage
        if (sessionStorage.getItem('accessToken') != null) {
            const getLogUrl = `http://${sensor_ip}:5000/sensor/get_logs`;
            // Fetch the log file from the server
            fetch(getLogUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Parse the response as a blob
                    return response.blob();
                })
                .then(blob => {
                    // Create a URL for the blob
                    const url = window.URL.createObjectURL(blob);
                    // Set the log URL state
                    setLogUrl(url);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        }
    };

    // Function to handle the Get Database button click
    const handleGetDatabase = () => {
        // Check if the access token exists in session storage
        if (sessionStorage.getItem('accessToken') != null) {
            const getDatabaseUrl = `http://${sensor_ip}:5000/sensor/get_sqlite_db`;
            // Fetch the database file from the server
            fetch(getDatabaseUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Parse the response as a blob
                    return response.blob();
                })
                .then(blob => {
                    // Create a URL for the blob
                    const url = window.URL.createObjectURL(blob);
                    // Set the database URL state
                    setDatabaseUrl(url);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        }
    };

    // Render the component if connected
    return connected ? (
        <div className="flex flex-col space-y-5">
            <li
                onClick={handleGetLog}
                onMouseEnter={() => setShowLogText(true)}
                onMouseLeave={() => setShowLogText(false)}
                className="flex"
            >
                <img
                    src="/static/img/ico/icons8-file-512.svg"
                    alt="Get Log"
                    className="h-10 cursor-pointer"
                    style={{ filter: 'invert(20%) sepia(7%) saturate(2126%) hue-rotate(178deg) brightness(98%) contrast(84%)' }}
                />
                {/* Conditionally render the Log text based on showLogText state */}
                {showLogText && (
                    <p className="font-poppins content-around pl-4 font-medium">Download Log</p>
                )}
            </li>
            <li
                onClick={handleGetDatabase}
                onMouseEnter={() => setShowDatabaseText(true)}
                onMouseLeave={() => setShowDatabaseText(false)}
                className="flex"
            >
                <img
                    src="/static/img/ico/icons8-data-server-512.svg"
                    alt="Get Database"
                    className="h-10 cursor-pointer"
                    style={{ filter: 'invert(20%) sepia(7%) saturate(2126%) hue-rotate(178deg) brightness(98%) contrast(84%)' }}
                />
                {/* Conditionally render the Database text based on showDatabaseText state */}
                {showDatabaseText && (
                    <p className="font-poppins content-around pl-4 font-medium">Download Database</p>
                )}
            </li>
        </div>
    ): null;
};

export default LogAndDatabase;

// Render the LogAndDatabase component in each div with id "log_and_database"
document.querySelectorAll("#log_and_database").forEach(div => {
    const ip = div.getAttribute('data-ip');
    console.log(ip);
    const root = createRoot(div);
    root.render(<LogAndDatabase sensor_ip={ip} />);
});
