import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import moment from 'moment';

const WavelengthMonitoredChart = ({  }) => {
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [cycle, setCycle] = useState('');
    const [cycleCount, setCycleCount] = useState(0);
    const [data, setData] = useState(null);
    const [wavelengths, setWavelengths] = useState([]);
    const [selectedReaction, setSelectedReaction] = useState('');
    const [availableReactions, setAvailableReactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [deploymentInfo, setDeploymentInfo] = useState(null);

    useEffect(() => {
        if (cycle) {
            fetchData();
        }
    }, [cycle]);

    const fetchCycleCount = async () => {
        setLoading(true);
        setErrorMessage(null)
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            if (response.ok) {
                setCycleCount(result.cycle_count);
                if (result.cycle_count > 0) {
                    setCycle('1'); // Set the first cycle as default
                    setDeploymentInfo(result.deployment_info);
                    fetchData(); // Fetch data after getting cycle count
                } else {
                    setCycle('');
                    setData(null);
                    setWavelengths([]);
                    setAvailableReactions([]);
                    setSelectedReaction('');
                    setDeploymentInfo(null);
                }
            } else {
                throw new Error(result.message || 'Error fetching cycle count.');
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error);
            setErrorMessage('Error fetching cycle count. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setErrorMessage(null)
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_only_wavelength_monitored_through_time_in_cycle_full_info?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`);
            const result = await response.json();

            if (result.data && result.wavelengths && result.deployment_info) {
                setData(result.data);
                setWavelengths(result.wavelengths);
                const reactions = Object.keys(result.data);
                setAvailableReactions(reactions);
                setSelectedReaction(reactions[0]);
                setDeploymentInfo(result.deployment_info);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Error fetching data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTimestampChange = (event) => {
        setTimestamp(event.target.value);
        setErrorMessage('');
    };

    const handleTimestampSubmit = (event) => {
        event.preventDefault();
        fetchCycleCount();
    };

    const handleCycleChange = (event) => {
        setCycle(event.target.value);
    };

    const handleReactionChange = (event) => {
        setSelectedReaction(event.target.value);
    };

    const handleNextCycle = () => {
        const nextCycle = Math.min(parseInt(cycle) + 1, cycleCount).toString();
        handleCycleChange({ target: { value: nextCycle } });
    };

    const handlePrevCycle = () => {
        const prevCycle = Math.max(parseInt(cycle) - 1, 1).toString();
        handleCycleChange({ target: { value: prevCycle } });
    };

    const generateChartData = (spectraData) => {
        if (!spectraData || !wavelengths.length) return { labels: [], datasets: [] };

        const labels = [];
        const datasets = {};

        Object.keys(spectraData).forEach(subcycle => {
            spectraData[subcycle].forEach((spectrum, sIndex) => {
                const spectrumLabel = `Spectrum ${sIndex + 1}`;
                if (!labels.includes(spectrumLabel)) {
                    labels.push(spectrumLabel);
                }
                spectrum.values.forEach((value, vIndex) => {
                    const wavelength = wavelengths[vIndex].toFixed(2);
                    const key = `Wavelength ${wavelength} Subcycle ${subcycle}`;
                    if (!datasets[key]) {
                        datasets[key] = {
                            label: key,
                            data: new Array(labels.length).fill(null),
                            borderColor: generateColor(vIndex),
                            fill: false,
                        };
                    }
                    datasets[key].data[labels.indexOf(spectrumLabel)] = value[1];
                });
            });
        });

        // Clean datasets to remove empty data points
        Object.values(datasets).forEach(dataset => {
            dataset.data = dataset.data.filter((_, index) => {
                return labels[index] !== undefined;
            });
        });

        return { labels, datasets: Object.values(datasets) };
    };

    const generateColor = (index) => {
        const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">WAVELENGTH MONITORED CHARTS</h2>
            </div>
            <div className="flex flex-col md:flex-row font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                <div className="md:w-1/2 mb-5 md:mb-0 pr-5">
                    <form onSubmit={handleTimestampSubmit} className="mb-5">
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Timestamp:
                                <input
                                    type="datetime-local"
                                    value={timestamp}
                                    onChange={handleTimestampChange}
                                    required
                                    disabled={loading}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex w-full mt-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                        >
                            Fetch Deployment
                        </button>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>}
                    {data && (
                        <>
                            <div className="flex flex-row justify-between">
                                <div className="w-5/12">
                                    <h3 className="font-bold text-lg mb-3">Cycle</h3>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Cycle:
                                        <select
                                            onChange={handleCycleChange}
                                            value={cycle}
                                            disabled={loading}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            {[...Array(cycleCount).keys()].map((cycle) => (
                                                <option key={cycle} value={cycle + 1}>
                                                    {cycle + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="flex space-x-2 mt-2">
                                        <button
                                            onClick={handlePrevCycle}
                                            disabled={parseInt(cycle) <= 1 || loading}
                                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(cycle) <= 1 || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                        >
                                            Previous Cycle
                                        </button>
                                        <button
                                            onClick={handleNextCycle}
                                            disabled={parseInt(cycle) >= cycleCount || loading}
                                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(cycle) >= cycleCount || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                        >
                                            Next Cycle
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-lg mb-3">Reaction</h3>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Reaction:
                                    <select
                                        onChange={handleReactionChange}
                                        value={selectedReaction}
                                        disabled={loading}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {availableReactions.map((reaction) => (
                                            <option key={reaction} value={reaction}>
                                                {reaction}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </>
                    )}
                    <div className="mt-4">
                        {deploymentInfo && (
                            <div className="mb-4">
                                <h3 className="font-bold text-lg mb-3">Deployment Information</h3>
                                <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                                    <p className="text-sm"><strong>Deployment ID:</strong> {deploymentInfo.deployment_id}</p>
                                    <p className="text-sm"><strong>Deployment Start Time:</strong> {moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                    <p className="text-sm"><strong>Deployment End Time:</strong> {moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data && selectedReaction && Object.keys(data[selectedReaction]).map((type) => (
                            <div key={type} className="p-2">
                                <h2 className="text-lg font-bold mb-2">{type}</h2>
                                <div style={{ height: '300px' }}>
                                    <Line
                                        data={generateChartData(data[selectedReaction][type])}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                x: {
                                                    title: {
                                                        display: true,
                                                        text: 'Spectrum Number',
                                                    },
                                                },
                                                y: {
                                                    title: {
                                                        display: true,
                                                        text: 'Intensity',
                                                    },
                                                },
                                            },
                                            elements: {
                                                point: {
                                                    radius: 0
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WavelengthMonitoredChart;
