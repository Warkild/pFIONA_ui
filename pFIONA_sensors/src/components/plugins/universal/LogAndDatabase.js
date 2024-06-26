import React, { useEffect, useState } from 'react';
import { createRoot } from "react-dom/client";

const LogAndDatabase = ({  }) => {
    const [connected, setConnected] = useState(false);
    const [logUrl, setLogUrl] = useState(null);
    const [databaseUrl, setDatabaseUrl] = useState(null);

    const checkStatus = () => {
        if (sessionStorage.getItem('accessToken') != null) {
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
                    setConnected(true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    setConnected(false);
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

    const handleGetLog = () => {
        if (sessionStorage.getItem('accessToken') != null) {
            const getLogUrl = `http://${sensor_ip}:5000/sensor/get_logs`;
            fetch(getLogUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    setLogUrl(url);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        }
    };

    const handleGetDatabase = () => {
        if (sessionStorage.getItem('accessToken') != null) {
            const getDatabaseUrl = `http://${sensor_ip}:5000/sensor/get_sqlite_db`;
            fetch(getDatabaseUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    setDatabaseUrl(url);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        }
    };

    return connected ? (
        <div className="flex space-x-4">
            <a
                href={logUrl}
                download="log.txt"
                onClick={handleGetLog}
                className="w-10 h-10 mr-2 cursor-pointer"
                title="Download Log"
            >
                <img
                    src="/static/img/ico/icons8-file-512.svg"
                    alt="Get Log"
                    className={'w-10 h-10'}
                />
            </a>
            <a
                href={databaseUrl}
                download="database.db"
                onClick={handleGetDatabase}
                className="w-10 h-10 mr-2 cursor-pointer"
                title="Download Database"
            >
                <img
                    src="/static/img/ico/icons8-server-512.svg"
                    alt="Get Database"
                    className={'w-10 h-10'}
                />
            </a>
        </div>
    ) : null;
};

export default LogAndDatabase;

document.querySelectorAll("#log_and_database").forEach(div => {
    const ip = div.getAttribute('data-ip');
    console.log(ip);
    const root = createRoot(div);
    root.render(<LogAndDatabase sensor_ip={ip} />);
});
