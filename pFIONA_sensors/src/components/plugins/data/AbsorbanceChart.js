import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import moment from 'moment';

const AbsorbanceChart = ({  }) => {
    const [cycleCount, setCycleCount] = useState(0);
    const [selectedCycle, setSelectedCycle] = useState('');
    const [selectedReaction, setSelectedReaction] = useState('');
    const [loading, setLoading] = useState(false);
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [data, setData] = useState(null);
    const [wavelengths, setWavelengths] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [deploymentInfo, setDeploymentInfo] = useState(null);
    const [availableReactions, setAvailableReactions] = useState([]);
    const [allReactionsData, setAllReactionsData] = useState({});
    const [deployments, setDeployments] = useState([]); // State to store deployments list
    const [currentDeploymentIndex, setCurrentDeploymentIndex] = useState(null); // State to store the index of current deployment
    const [shouldFetch, setShouldFetch] = useState(false); // State to trigger fetch action
    const [shouldFetchSpectrum, setShouldFetchSpectrum] = useState(false); // State to trigger fetch spectrum action

    useEffect(() => {
        fetchCycleCount();
    }, []);

    useEffect(() => {
        fetchDeploymentList(); // Fetch deployment list on component mount
    }, []);

    const fetchDeploymentList = async () => { // Fetch the list of deployments from API
        try {
            const response = await fetch(`/api/get_deployment_list?sensor_id=${sensor_id}`);
            const result = await response.json();
            setDeployments(result); // Set the deployments state with fetched data
        } catch (error) {
            console.error('Error fetching deployment list:', error);
            setErrorMessage('Error fetching deployment list. Please try again.');
        }
    };

    useEffect(() => {
        if (selectedCycle && shouldFetchSpectrum) { // Fetch spectrum data if a cycle is selected and shouldFetchSpectrum is true
            fetchAbsorbanceData(selectedCycle);
            setShouldFetchSpectrum(false); // Reset the flag after fetching spectrum data
        }
    }, [selectedCycle, shouldFetchSpectrum]);

    useEffect(() => {
        if (selectedReaction) {
            setData(allReactionsData[selectedReaction] || {});
        }
    }, [selectedReaction]);

    useEffect(() => {
        if (shouldFetch) { // Fetch cycle count if shouldFetch is true
            fetchCycleCount();
            setShouldFetch(false); // Reset the flag after fetching cycle count
        }
    }, [timestamp, shouldFetch]);

    const fetchCycleCount = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            if (response.ok) {
                if (result.cycle_count > 0) {
                    setCycleCount(result.cycle_count);
                    setSelectedCycle(result.cycle_count.toString());
                    setShouldFetchSpectrum(true); // Set the flag to fetch spectrum data
                } else {
                    setCycleCount(0);
                    setSelectedCycle('');
                    setData(null);
                    setDeploymentInfo(null);
                    setErrorMessage('No deployment found before the selected date.');
                }
            } else {
                throw new Error(result.message || 'Error fetching cycle count.');
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error);
            setErrorMessage('Error fetching cycle count. Please try again.');
            setLoading(false);
        }
    };

    const fetchAbsorbanceData = async (cycle) => {
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_absorbance_spectrums_in_cycle?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`);
            const result = await response.json();
            if (response.ok) {
                const reactions = Object.keys(result.absorbance_data || {});
                setAvailableReactions(reactions);
                setAllReactionsData(result.absorbance_data);

                if (reactions.includes(selectedReaction)) {
                    setData(result.absorbance_data[selectedReaction] || {});
                } else {
                    const firstReaction = reactions[0] || '';
                    setSelectedReaction(firstReaction);
                    setData(result.absorbance_data[firstReaction] || {});
                }

                setWavelengths(result.wavelengths);
                const deploymentId = result.deployment_info.deployment_id;
                const deploymentIndex = deployments.findIndex(deployment => deployment.deployment === deploymentId);
                setCurrentDeploymentIndex(deploymentIndex); // Set current deployment index state
                setDeploymentInfo(result.deployment_info);
            } else {
                throw new Error(result.message || 'Error fetching absorbance data.');
            }
        } catch (error) {
            console.error('Error fetching absorbance data:', error);
            setErrorMessage(error.message || 'Error fetching absorbance data. Please try again.');
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

    const handleCycleChange = (cycle) => {
        setSelectedCycle(cycle);
        fetchAbsorbanceData(cycle);
    };

    const handleReactionChange = (reaction) => {
        setSelectedReaction(reaction);
    };

    const handleNextCycle = () => {
        const nextCycle = Math.min(parseInt(selectedCycle) + 1, cycleCount).toString();
        setErrorMessage("");
        handleCycleChange(nextCycle);
    };

    const handlePrevCycle = () => {
        const prevCycle = Math.max(parseInt(selectedCycle) - 1, 1).toString();
        setErrorMessage("");
        handleCycleChange(prevCycle);
    };

    const handleNextDeployment = () => {
        if (currentDeploymentIndex !== null && currentDeploymentIndex < deployments.length - 1) {
            const nextDeploymentIndex = currentDeploymentIndex + 1;
            const nextDeployment = deployments[nextDeploymentIndex];
            const averageTimestamp = (nextDeployment.start_time + nextDeployment.end_time) / 2;

            const formattedTimestamp = moment.unix(averageTimestamp).format('YYYY-MM-DDTHH:mm');
            setTimestamp(formattedTimestamp); // Update timestamp to the average of next deployment
            setCurrentDeploymentIndex(nextDeploymentIndex); // Update current deployment index
            setShouldFetch(true); // Set the flag to fetch data
        }
    };

    const handlePrevDeployment = () => {
        if (currentDeploymentIndex !== null && currentDeploymentIndex > 0) {
            const prevDeploymentIndex = currentDeploymentIndex - 1;
            const prevDeployment = deployments[prevDeploymentIndex];
            const averageTimestamp = (prevDeployment.start_time + prevDeployment.end_time) / 2;

            const formattedTimestamp = moment.unix(averageTimestamp).format('YYYY-MM-DDTHH:mm');
            setTimestamp(formattedTimestamp); // Update timestamp to the average of previous deployment
            setCurrentDeploymentIndex(prevDeploymentIndex); // Update current deployment index
            setShouldFetch(true); // Set the flag to fetch data
        }
    };

    const generateColor = (baseColor, subcycleIndex) => {
        const factor = 0.1 * subcycleIndex;
        return `rgb(${Math.min(baseColor[0] + factor * 255, 255)}, ${Math.min(baseColor[1] + factor * 255, 255)}, ${Math.min(baseColor[2] + factor * 255, 255)})`;
    };

    const generateChartData = (cycleData) => {
        if (!wavelengths || wavelengths.length === 0) {
            return { labels: [], datasets: [] };
        }

        const chartData = { labels: wavelengths.map(w => w.toFixed(2)), datasets: [] };
        const baseColors = {
            Blank: [0, 0, 255],  // Blue
            Sample: [0, 255, 0], // Green
            Standard: [255, 0, 0], // Red
            Standard_Dillution_0: [191, 9, 9], // Red
            Standard_Dillution_1: [255, 0, 0], // Red
            Standard_Dillution_2: [255, 100, 0], // Red
            Standard_Dillution_3: [255, 175, 0], // Red
            Standard_Dillution_4: [255, 255, 0], // Red
        };

        for (const [type, subcycles] of Object.entries(cycleData || {})) {
            for (const [subcycle, absorbanceValues] of Object.entries(subcycles || {})) {
                const key="time_"+selectedReaction+"_"+type+"_subcycle_"+subcycle
                let spectra_time = ""
                try {
                    spectra_time = deploymentInfo[key]
                } catch (error) {
                    console.error(error)
                }
                chartData.datasets.push({
                    label: `${type} Subcycle ${subcycle}`,
                    data: absorbanceValues,
                    borderColor: generateColor(baseColors[type] || [0, 0, 0], subcycle),
                    fill: false,
                    time: spectra_time
                });
            }
        }
        return chartData;
    };

    const selectedCycleData = selectedCycle ? generateChartData(data) : null;

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">ABSORBANCE CHARTS</h2>
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
                        <div className={"flex flex-rox space-x-10"}> {/* Button container */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Fetch Deployment
                            </button>
                            <button
                                type="button"
                                onClick={handlePrevDeployment}
                                disabled={loading || currentDeploymentIndex === null || currentDeploymentIndex === 0}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading || currentDeploymentIndex === null || currentDeploymentIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Previous Deployment
                            </button>
                            <button
                                type="button"
                                onClick={handleNextDeployment}
                                disabled={loading || currentDeploymentIndex === null || currentDeploymentIndex >= deployments.length - 1}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading || currentDeploymentIndex === null || currentDeploymentIndex >= deployments.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Next Deployment
                            </button>
                        </div>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>}
                    <div className="flex flex-row justify-between">
                        <div className="w-5/12">
                            <h3 className="font-bold text-lg mb-3">Cycle</h3>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Cycle:
                                <select
                                    onChange={(e) => handleCycleChange(e.target.value)}
                                    value={selectedCycle}
                                    disabled={loading}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="" disabled>Select a cycle</option>
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
                                    disabled={parseInt(selectedCycle) <= 1 || loading}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(selectedCycle) <= 1 || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                >
                                    Previous Cycle
                                </button>
                                <button
                                    onClick={handleNextCycle}
                                    disabled={parseInt(selectedCycle) >= cycleCount || loading}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(selectedCycle) >= cycleCount || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                >
                                    Next Cycle
                                </button>
                            </div>
                        </div>
                        <div className="w-1/2">
                            {deploymentInfo ? (
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg mb-3">Deployment Information</h3>
                                    <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                                        <p className="text-sm"><strong>Deployment ID:</strong> {deploymentInfo.deployment_id}</p>
                                        <p className="text-sm"><strong>Deployment Start Time:</strong> {moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                        <p className="text-sm"><strong>Deployment End Time:</strong> {moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                        <p className="text-sm"><strong>Cycle Start Time:</strong> {moment.unix(deploymentInfo.cycle_start_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                        <p className="text-sm"><strong>Cycle End Time:</strong> {moment.unix(deploymentInfo.cycle_end_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg mb-3">Deployment Information</h3>
                                    <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                                        <p className="text-sm">No deployment information available.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-lg mb-3">Reaction</h3>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Reaction:
                            <select
                                onChange={(e) => handleReactionChange(e.target.value)}
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
                </div>
                <div>
                    {selectedCycle && selectedCycleData && (
                        <div className="mt-5" style={{ height: '500px' }}>
                            <h2 className="text-lg font-bold mb-2">Cycle {selectedCycle}</h2>
                            <Line
                                data={selectedCycleData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Wavelength (nm)',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Absorbance',
                                            },
                                        },
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                title: function (context) {
                                                    const index = context[0].dataIndex;
                                                    return `Wavelength: ${wavelengths[index].toFixed(2)}`; // round wavelength to 2 decimal places
                                                },
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.parsed.y.toFixed(2); // round absorbance to 2 decimal places
                                                    }
                                                    return label;
                                                },
                                                afterLabel: function (context) {
                                                    const time = context.dataset.time;
                                                    return `Time: ${moment.unix(time).format('YYYY-MM-DD HH:mm:ss')}`;
                                                },
                                            }
                                        }
                                    },
                                    elements: {
                                        point: {
                                            radius: 0
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AbsorbanceChart;
