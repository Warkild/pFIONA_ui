import React, {useEffect, useState} from 'react';
import Alert from "./Alert";

function Spectrophotometer({ addLogMessage }) {

    /** LOG **/

    const logResponse = (message) => {
        addLogMessage(message.message);
    };


    const [lightStatus, setLightStatus] = useState(false);

    const turnOnLight = () => {
        console.log('IP Address:', SENSOR_IP);

        // Define the URL for the POST request
        const url = `http://${SENSOR_IP}:5000/lamp/turn_on`;

        // Make a POST request to the specified URL
        fetch(url, {
            method: 'POST', // Specify the request method as POST
            headers: {
                'Content-Type': 'application/json', // Set the content type header
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response as JSON
        })
        .then(data => {
            console.log('Success:', data);
            setLightStatus(true);
        })
        .catch(error => {
            console.error('Error:', error);
            logResponse(error);
        });
    };
    const turnOffLight = () => {
        console.log('IP Address:', SENSOR_IP);

        // Define the URL for the POST request
        const url = `http://${SENSOR_IP}:5000/lamp/turn_off`;

        // Make a POST request to the specified URL
        fetch(url, {
            method: 'POST', // Specify the request method as POST
            headers: {
                'Content-Type': 'application/json', // Set the content type header
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response as JSON
        })
        .then(data => {
            console.log('Success:', data);
            setLightStatus(false);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
    const checkLightStatus = () => {
        fetch(`http://${SENSOR_IP}:5000/lamp/is_active`, {
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
            setLightStatus(data.message === "true");
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

     useEffect(() => {
        checkLightStatus();

        const intervalId = setInterval(() => {
            checkLightStatus();
        }, 8000);

        return () => clearInterval(intervalId);
    }, []);



    // Return HTML Code
    return (
        <div className={"w-9/12 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-row font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <p className={"text-sm mb-2"}>Current status :</p>
                    <div className={"flex flex-row items-center mb-5"}>
                        <div className={` w-5 h-5 rounded-full ${lightStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <p className={"ml-3"}>{lightStatus ? 'ON' : 'OFF'}</p>
                    </div>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"}
                            onClick={turnOnLight}>Turn ON
                    </button>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"}
                            onClick={turnOffLight}>Turn OFF
                    </button>
                    <p className={"text-sm mb-2"}>Spectrophotometer :</p>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"}>Scan now</button>
                </div>
            </div>
        </div>
    );
}

export default Spectrophotometer;
