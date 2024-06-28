import React, {useEffect, useState} from 'react';
import {Line} from 'react-chartjs-2';
import {Chart as ChartJS, registerables} from 'chart.js';
import Alert from "../universal/Alert";

ChartJS.register(...registerables);

function Spectrophotometer({inAction, setInAction, isDeployed, preScanCount}) {

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
     * COMPONENT SPECTROPHOTOMETER
     */

        // Component to manage spectrophotometer

        // Light Status
    const [lightStatus, setLightStatus] = useState(false);

    // Chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    // Integration time
    const [integrationTime, setIntegrationTime] = useState(0);

    // Update chart.js comp with new data
    const updateChartData = (data) => {
        const spectra = data.standard_concentration;

        const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
        ];

        const backgroundColors = [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(75, 192, 192, 0.2)'
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


    // Turn on the light of sensor's spectrophotometer
    const turnOnLight = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                const url = `http://${sensor_ip}:${sensor_port}/lamp/turn_on`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    },
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        setLightStatus(true);
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
        }

    };

    // Turn off the light of sensor's spectrophotometer
    const turnOffLight = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                const url = `http://${sensor_ip}:${sensor_port}/lamp/turn_off`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    },
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        setLightStatus(false);
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
        }

    };

    // Send request to sensor to calibrate the spectrophotometer
    const calibrate = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                setInAction(true);

                const url = `http://${sensor_ip}:${sensor_port}/spectrophotometer/calibrate`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    },
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        setInAction(false);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        setInAction(false);
                        setAlertModalText(error.message);
                        setIsModalOpen(true);
                    });
            } catch (error) {
                setAlertModalText(error.message);
                setIsModalOpen(true);
            }
        }

    };

    // Check the light status for sensor
    const checkLightStatus = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                fetch(`http://${sensor_ip}:${sensor_port}/lamp/is_active`, {
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
                        setLightStatus(data.message === "true");
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
        }

    };

    // Get the integration time
    const getIntegrationTime = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                fetch(`http://${sensor_ip}:${sensor_port}/spectrophotometer/get_integration_time`, {
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
                        setIntegrationTime(data.message);
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
        }

    };


    // Check the light status and integration time every 2 seconds
    useEffect(() => {
        checkLightStatus();
        getIntegrationTime();
        const intervalId = setInterval(() => {
            checkLightStatus();
            getIntegrationTime();
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    // When news spectra is finished, check the update, load and display new specs
    useEffect(() => {
        if (preScanCount !== 0) {
            fetch(`/api/get_lasts_spectrum_cycle_0?sensor_id=${sensor_id}`, {
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
                    updateChartData(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }, [preScanCount]);

    // Get the current spectra from the sensor spectrophotometer
    const scanNow = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                const url = `http://${sensor_ip}:${sensor_port}/spectrophotometer/get_measure`;

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
                        const newWavelengths = data.message.wavelengths;
                        const newIntensities = data.message.intensities;
                        const currentScan = {
                            standard_concentration: [{
                                type: 'Current Scan',
                                values: newWavelengths.map((wavelength, index) => ({
                                    wavelength,
                                    value: newIntensities[index]
                                }))
                            }]
                        };
                        updateChartData(currentScan);
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
        }

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
                    <p>Integration time :</p>
                    <p>{integrationTime}</p>
                </div>
                <div className={"flex flex-col w-full ml-4 h-full"}>
                    <div style={{height: '400px'}}>
                        <Line data={chartData} options={{maintainAspectRatio: false}}/>
                    </div>
                </div>
                <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
            </div>
        </div>
    );
}

export default Spectrophotometer;
