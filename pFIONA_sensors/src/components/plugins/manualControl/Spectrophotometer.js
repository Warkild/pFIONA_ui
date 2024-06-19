import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import Alert from "../universal/Alert";

ChartJS.register(...registerables);

function Spectrophotometer({ inAction, setInAction, isDeployed, preScanCount }) {

    // Light Status
    const [lightStatus, setLightStatus] = useState(false);

    // Chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

const updateChartData = (data) => {
    const spectra = data.standard_concentration;
    console.log('Updating chart data with:', spectra);

    const colors = [
        'rgba(255, 99, 132, 1)', // Rouge
        'rgba(54, 162, 235, 1)', // Bleu
        'rgba(75, 192, 192, 1)'  // Vert
    ];

    const backgroundColors = [
        'rgba(255, 99, 132, 0.2)', // Rouge
        'rgba(54, 162, 235, 0.2)', // Bleu
        'rgba(75, 192, 192, 0.2)'  // Vert
    ];

    const datasets = spectra.map((spectrum, index) => ({
        label: `Intensity - ${spectrum.type}`,
        data: spectrum.values.map(v => v.value),
        borderColor: colors[index % colors.length],
        backgroundColor: backgroundColors[index % backgroundColors.length],
    }));

    const labels = spectra[0].values.map(v => Math.round(v.wavelength * 10) / 10);

    setChartData({
        labels: labels,
        datasets: datasets
    });
};




    const turnOnLight = () => {
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

    const calibrate = () => {
        setInAction(true);

        const url = `http://${SENSOR_IP}:5000/spectrophotometer/calibrate`;

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
                setInAction(false);
            })
            .catch(error => {
                console.error('Error:', error);
                setInAction(false);
            });
    };

    const checkLightStatus = () => {
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
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
    if (preScanCount !== 0) {
        fetch(`http://127.0.0.1:8000/api/get_lasts_spectrum_cycle_0?sensor_id=2`, {
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
                updateChartData(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}, [preScanCount]);


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
                const newWavelengths = data.message.wavelengths;
                const newIntensities = data.message.intensities;
                const currentScan = {
                    standard_concentration: [{
                        type: 'Current Scan',
                        values: newWavelengths.map((wavelength, index) => ({ wavelength, value: newIntensities[index] }))
                    }]
                };
                updateChartData(currentScan);
            })
            .catch(error => {
                console.error('Error:', error);
            });
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
                        <div className={`w-5 h-5 rounded-full ${lightStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
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
                    <button
                        className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                        onClick={scanNow}
                        disabled={isDeployed}
                    >Scan now
                    </button>
                    <button
                        className={`rounded-lg font-poppins py-2 mb-5 ${isDeployed || inAction ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                        onClick={calibrate}
                        disabled={isDeployed || inAction}
                    >Calibrate
                    </button>
                </div>
                <div className={"flex flex-col w-full ml-4 h-full"}>
                    <div style={{height: '400px'}}>
                        <Line data={chartData} options={{maintainAspectRatio: false}}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Spectrophotometer;
