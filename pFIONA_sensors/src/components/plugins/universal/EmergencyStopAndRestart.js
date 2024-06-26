import React, {useEffect, useState} from 'react';
import {createRoot} from "react-dom/client";

const EmergencyStopAndRestart = ({}) => {

    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        if(sessionStorage.getItem('accessToken') != null) {
            fetch(`http://${sensor_ip}:5000/sensor/get_state`, {
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
                    setConnected(true)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setConnected(false)
                });
        }
    };

    useEffect(() => {
        checkStatus();

        const intervalId = setInterval(() => {

            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);


    const [emergencyStopClicked, setEmergencyStopClicked] = useState(0);
    const [restartClicked, setRestartClicked] = useState(0);

    const handleEmergencyStop = () => {
        setEmergencyStopClicked(prev => prev + 1);
        setTimeout(() => setEmergencyStopClicked(0), 2000);
        if (emergencyStopClicked + 1 === 2 && sessionStorage.getItem('accessToken') != null) {
            const emergencyStopUrl =  `http://${sensor_ip}:5000/sensor/stop_deploy`
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
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Emergency Stop Successful:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
            setEmergencyStopClicked(0);
        }
    };

    const handleRestart = () => {
        setRestartClicked(prev => prev + 1);
        setTimeout(() => setRestartClicked(0), 2000);
        if (restartClicked + 1 === 2 && sessionStorage.getItem('accessToken') != null) {
            const restartUrl =  `http://${sensor_ip}:5000/sensor/restart`
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
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Restart Successful:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
            setRestartClicked(0);
        }
    };

    return connected ? (
        <div className="flex space-x-4">
            <img
                onDoubleClick={handleEmergencyStop}
                src="/static/img/ico/icons8-open-hand-512.svg"
                alt="Stop"
                className="w-10 h-10 mr-2 cursor-pointer"
            />
            <img
                onDoubleClick={handleRestart}
                src="/static/img/ico/icons8-restart-512.svg"
                alt="Restart"
                className="w-10 h-10 mr-2 cursor-pointer"
            />
        </div>
    ) : null;
};

export default EmergencyStopAndRestart;

document.querySelectorAll("#emergency_stop_and_restart").forEach(div => {
    const ip = div.getAttribute('data-ip');
    console.log(ip)
    const root = createRoot(div);
    root.render(<EmergencyStopAndRestart sensor_ip={ip}/>);
});