import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import Alert from "../universal/Alert";

ChartJS.register(...registerables);

function Spectrophotometer({ inAction, setInAction, isDeployed }) {

    // Light Status
    const [lightStatus, setLightStatus] = useState(false);

    // Wavelengths returned by the spec
    const [wavelengths, setWavelengths] = useState([]);

    // Intensities returned by the spec
    const [intensities, setIntensities] = useState([]);

    // Chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    const updateChartData = (wavelengths, intensities) => {
        console.log('Updating chart data with:', { wavelengths, intensities });
        const formattedWavelengths = formatWavelengths(wavelengths);
        setChartData({
            labels: formattedWavelengths,
            datasets: [
                {
                    label: 'Intensity',
                    data: intensities,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                }
            ]
        });
    };

    const turnOnLight = () => {
        console.log('IP Address:', SENSOR_IP);

        const url = `http://${SENSOR_IP}:5000/lamp/turn_on`;

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
                setLightStatus(true);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    const turnOffLight = () => {
        console.log('IP Address:', SENSOR_IP);

        const url = `http://${SENSOR_IP}:5000/lamp/turn_off`;

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
                setLightStatus(false);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    const checkLightStatus = () => {
        console.log(sessionStorage.getItem('accessToken'))
        fetch(`http://${SENSOR_IP}:5000/lamp/is_active`, {
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

    const scanNow = () => {
        const url = `http://${SENSOR_IP}:5000/spectrophotometer/get_measure`;

        fetch(url, {
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
                console.log('Wavelengths:', data.message.wavelengths);
                console.log('Intensities:', data.message.intensities);
                const newWavelengths = data.message.wavelengths;
                const newIntensities = data.message.intensities;
                setWavelengths(newWavelengths);
                setIntensities(newIntensities);
                updateChartData(newWavelengths, newIntensities);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    const formatWavelengths = (wavelengths) => {
        return wavelengths.map(wavelength => Math.round(wavelength * 10) / 10);
    };

    return (
        <div className={"w-9/12 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-row font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <p className={"text-sm mb-2"}>Light current status</p>
                    <div className={"flex flex-row items-center mb-5"}>
                        <div className={` w-5 h-5 rounded-full ${lightStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <p className={"ml-3"}>{lightStatus ? 'ON' : 'OFF'}</p>
                    </div>
                    {!lightStatus ? (
                        <button
                            className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                            onClick={turnOnLight}
                            disabled={inAction || isDeployed}
                        >
                            Turn ON
                        </button>
                    ) : (
                        <button
                            className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                            onClick={turnOffLight}
                            disabled={isDeployed}
                        >
                            Turn OFF
                        </button>
                    )}
                    <p className={"text-sm mb-2"}>Spectrophotometer</p>
                    <button className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                        onClick={scanNow}
                        disabled={isDeployed}
                    >Scan now</button>
                </div>
                <div className={"flex flex-col w-full ml-4 h-full"}>
                    <div style={{ height: '400px' }}>
                        <Line data={chartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Spectrophotometer;
