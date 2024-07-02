import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import moment from 'moment';

// AbsorbanceChart component
const AbsorbanceChart = ({  }) => {
    const [cycleCount, setCycleCount] = useState(0); // State to store the cycle count
    const [selectedCycle, setSelectedCycle] = useState(''); // State to store the selected cycle
    const [selectedReaction, setSelectedReaction] = useState(''); // State to store the selected reaction
    const [loading, setLoading] = useState(false); // State to indicate loading
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm')); // State to store the timestamp
    const [data, setData] = useState(null); // State to store the absorbance data
    const [wavelengths, setWavelengths] = useState([]); // State to store the wavelengths
    const [errorMessage, setErrorMessage] = useState(''); // State to store the error message
    const [deploymentInfo, setDeploymentInfo] = useState(null); // State to store deployment info
    const [availableReactions, setAvailableReactions] = useState([]); // State to store available reactions
    const [allReactionsData, setAllReactionsData] = useState({}); // State to store all reactions data
    const [deployments, setDeployments] = useState([]); // State to store deployments list
    const [currentDeploymentIndex, setCurrentDeploymentIndex] = useState(null); // State to store the index of current deployment
    const [shouldFetch, setShouldFetch] = useState(false); // State to trigger fetch action
    const [shouldFetchSpectrum, setShouldFetchSpectrum] = useState(false); // State to trigger fetch spectrum action

    useEffect(() => {
        fetchCycleCount(); // Fetch the cycle count on component mount
    }, []);

    useEffect(() => {
        fetchDeploymentList(); // Fetch deployment list on component mount
    }, []);

    const fetchDeploymentList = async () => {
        try {
            const response = await fetch(`/api/get_deployment_list?sensor_id=${sensor_id}`); // Fetch the list of deployments from API
            const result = await response.json(); // Parse the JSON response
            setDeployments(result); // Set the deployments state with fetched data
        } catch (error) {
            console.error('Error fetching deployment list:', error); // Log error to console
            setErrorMessage('Error fetching deployment list. Please try again.'); // Set error message state
        }
    };

    useEffect(() => {
        if (selectedCycle && shouldFetchSpectrum) {
            fetchAbsorbanceData(selectedCycle); // Fetch spectrum data if a cycle is selected and shouldFetchSpectrum is true
            setShouldFetchSpectrum(false); // Reset the flag after fetching spectrum data
        }
    }, [selectedCycle, shouldFetchSpectrum]);

    useEffect(() => {
        if (selectedReaction) {
            setData(allReactionsData[selectedReaction] || {}); // Update the data state when selected reaction changes
        }
    }, [selectedReaction]);

    useEffect(() => {
        if (shouldFetch) {
            fetchCycleCount(); // Fetch cycle count if shouldFetch is true
            setShouldFetch(false); // Reset the flag after fetching cycle count
        }
    }, [timestamp, shouldFetch]);

    const fetchCycleCount = async () => {
        setLoading(true); // Set loading state to true
        setErrorMessage(''); // Clear any previous error messages
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch
            const response = await fetch(`/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`); // Fetch cycle count from API
            const result = await response.json(); // Parse the JSON response
            if (response.ok) {
                if (result.cycle_count > 0) {
                    setCycleCount(result.cycle_count); // Set the cycle count state
                    setSelectedCycle(result.cycle_count.toString()); // Set the selected cycle state
                    setShouldFetchSpectrum(true); // Set the flag to fetch spectrum data
                } else {
                    setCycleCount(0); // Set cycle count to 0 if no deployment found
                    setSelectedCycle(''); // Clear selected cycle state
                    setData(null); // Clear data state
                    setDeploymentInfo(null); // Clear deployment info state
                    setErrorMessage('No deployment found before the selected date.'); // Set error message
                }
            } else {
                throw new Error(result.message || 'Error fetching cycle count.'); // Throw error if response is not ok
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error); // Log error to console
            setErrorMessage('Error fetching cycle count. Please try again.'); // Set error message state
            setLoading(false); // Set loading state to false
        }
    };

    const fetchAbsorbanceData = async (cycle) => {
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch
            const response = await fetch(`/api/get_absorbance_spectrums_in_cycle?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`); // Fetch absorbance data from API
            const result = await response.json(); // Parse the JSON response
            if (response.ok) {
                const reactions = Object.keys(result.absorbance_data || {}); // Get the list of reactions
                setAvailableReactions(reactions); // Set available reactions state
                setAllReactionsData(result.absorbance_data); // Set all reactions data state

                if (reactions.includes(selectedReaction)) {
                    setData(result.absorbance_data[selectedReaction] || {}); // Set data state for selected reaction
                } else {
                    const firstReaction = reactions[0] || ''; // Select the first reaction if available
                    setSelectedReaction(firstReaction); // Set the selected reaction state
                    setData(result.absorbance_data[firstReaction] || {}); // Set data state for the first reaction
                }

                setWavelengths(result.wavelengths); // Set wavelengths state
                const deploymentId = result.deployment_info.deployment_id; // Get deployment ID
                const deploymentIndex = deployments.findIndex(deployment => deployment.deployment === deploymentId); // Find the index of the current deployment
                setCurrentDeploymentIndex(deploymentIndex); // Set current deployment index state
                setDeploymentInfo(result.deployment_info); // Set deployment info state
            } else {
                throw new Error(result.message || 'Error fetching absorbance data.'); // Throw error if response is not ok
            }
        } catch (error) {
            console.error('Error fetching absorbance data:', error); // Log error to console
            setErrorMessage(error.message || 'Error fetching absorbance data. Please try again.'); // Set error message state
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    const handleTimestampChange = (event) => {
        setTimestamp(event.target.value); // Update timestamp state
        setErrorMessage(''); // Clear any previous error messages
    };

    const handleTimestampSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission
        fetchCycleCount(); // Fetch cycle count on timestamp submit
    };

    const handleCycleChange = (cycle) => {
        setSelectedCycle(cycle); // Update selected cycle state
        fetchAbsorbanceData(cycle); // Fetch absorbance data for the selected cycle
    };

    const handleReactionChange = (reaction) => {
        setSelectedReaction(reaction); // Update selected reaction state
    };

    const handleNextCycle = () => {
        const nextCycle = Math.min(parseInt(selectedCycle) + 1, cycleCount).toString(); // Calculate the next cycle
        setErrorMessage(""); // Clear any previous error messages
        handleCycleChange(nextCycle); // Handle cycle change to the next cycle
    };

    const handlePrevCycle = () => {
        const prevCycle = Math.max(parseInt(selectedCycle) - 1, 1).toString(); // Calculate the previous cycle
        setErrorMessage(""); // Clear any previous error messages
        handleCycleChange(prevCycle); // Handle cycle change to the previous cycle
    };

    const handleNextDeployment = () => {
        if (currentDeploymentIndex !== null && currentDeploymentIndex < deployments.length - 1) {
            const nextDeploymentIndex = currentDeploymentIndex + 1; // Calculate the next deployment index
            const nextDeployment = deployments[nextDeploymentIndex]; // Get the next deployment
            const averageTimestamp = (nextDeployment.start_time + nextDeployment.end_time) / 2; // Calculate the average timestamp for the next deployment

            const formattedTimestamp = moment.unix(averageTimestamp).format('YYYY-MM-DDTHH:mm'); // Format the average timestamp
            setTimestamp(formattedTimestamp); // Update timestamp state
            setCurrentDeploymentIndex(nextDeploymentIndex); // Update current deployment index state
            setShouldFetch(true); // Set the flag to fetch data
        }
    };

    const handlePrevDeployment = () => {
        if (currentDeploymentIndex !== null && currentDeploymentIndex > 0) {
            const prevDeploymentIndex = currentDeploymentIndex - 1; // Calculate the previous deployment index
            const prevDeployment = deployments[prevDeploymentIndex]; // Get the previous deployment
            const averageTimestamp = (prevDeployment.start_time + prevDeployment.end_time) / 2; // Calculate the average timestamp for the previous deployment

            const formattedTimestamp = moment.unix(averageTimestamp).format('YYYY-MM-DDTHH:mm'); // Format the average timestamp
            setTimestamp(formattedTimestamp); // Update timestamp state
            setCurrentDeploymentIndex(prevDeploymentIndex); // Update current deployment index state
            setShouldFetch(true); // Set the flag to fetch data
        }
    };

    const generateColor = (baseColor, subcycleIndex) => {
        const factor = 0.1 * subcycleIndex; // Calculate the color factor based on subcycle index
        return `rgb(${Math.min(baseColor[0] + factor * 255, 255)}, ${Math.min(baseColor[1] + factor * 255, 255)}, ${Math.min(baseColor[2] + factor * 255, 255)})`; // Generate the color
    };

    const generateChartData = (cycleData) => {
        if (!wavelengths || wavelengths.length === 0) {
            return { labels: [], datasets: [] }; // Return empty data if no wavelengths are available
        }

        const chartData = { labels: wavelengths.map(w => w.toFixed(2)), datasets: [] }; // Initialize chart data with labels
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
                    spectra_time = deploymentInfo[key] // Get the time for the subcycle
                } catch (error) {
                    console.error(error) // Log error to console
                }
                chartData.datasets.push({
                    label: `${type} Subcycle ${subcycle}`, // Label for the dataset
                    data: absorbanceValues, // Data points for the dataset
                    borderColor: generateColor(baseColors[type] || [0, 0, 0], subcycle), // Border color for the dataset
                    fill: false, // Do not fill under the line
                    time: spectra_time // Time for the subcycle
                });
            }
        }
        return chartData; // Return the generated chart data
    };

    const selectedCycleData = selectedCycle ? generateChartData(data) : null; // Generate chart data for the selected cycle

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">ABSORBANCE CHARTS</h2> {/* Header for the component */}
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
                                    disabled={loading} // Disable input when loading
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <div className={"flex flex-rox space-x-10"}> {/* Button container */}
                            <button
                                type="submit"
                                disabled={loading} // Disable button when loading
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Fetch Deployment
                            </button>
                            <button
                                type="button"
                                onClick={handlePrevDeployment}
                                disabled={loading || currentDeploymentIndex === null || currentDeploymentIndex === 0} // Disable button when loading or at first deployment
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading || currentDeploymentIndex === null || currentDeploymentIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Previous Deployment
                            </button>
                            <button
                                type="button"
                                onClick={handleNextDeployment}
                                disabled={loading || currentDeploymentIndex === null || currentDeploymentIndex >= deployments.length - 1} // Disable button when loading or at last deployment
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading || currentDeploymentIndex === null || currentDeploymentIndex >= deployments.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                Next Deployment
                            </button>
                        </div>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>} {/* Display error message */}
                    <div className="flex flex-row justify-between">
                        <div className="w-5/12">
                            <h3 className="font-bold text-lg mb-3">Cycle</h3>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Cycle:
                                <select
                                    onChange={(e) => handleCycleChange(e.target.value)}
                                    value={selectedCycle}
                                    disabled={loading} // Disable select when loading
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="" disabled>Select a cycle</option> {/* Default option */}
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
                                    disabled={parseInt(selectedCycle) <= 1 || loading} // Disable button if on first cycle or loading
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(selectedCycle) <= 1 || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                >
                                    Previous Cycle
                                </button>
                                <button
                                    onClick={handleNextCycle}
                                    disabled={parseInt(selectedCycle) >= cycleCount || loading} // Disable button if on last cycle or loading
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(selectedCycle) >= cycleCount || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                >
                                    Next Cycle
                                </button>
                            </div>
                        </div>
                        <div className="w-1/2">
                            {deploymentInfo ? (
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg mb-3">Deployment Information</h3> {/* Header for deployment information */}
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
                                    <h3 className="font-bold text-lg mb-3">Deployment Information</h3> {/* Header for deployment information */}
                                    <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                                        <p className="text-sm">No deployment information available.</p> {/* Message if no deployment info */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-lg mb-3">Reaction</h3> {/* Header for reaction selection */}
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Reaction:
                            <select
                                onChange={(e) => handleReactionChange(e.target.value)}
                                value={selectedReaction}
                                disabled={loading} // Disable select when loading
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
                            <h2 className="text-lg font-bold mb-2">Cycle {selectedCycle}</h2> {/* Header for the chart */}
                            <Line
                                data={selectedCycleData} // Data for the chart
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
                                                    return `Wavelength: ${wavelengths[index].toFixed(2)}`; // Round wavelength to 2 decimal places
                                                },
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.parsed.y.toFixed(2); // Round absorbance to 2 decimal places
                                                    }
                                                    return label;
                                                },
                                                afterLabel: function (context) {
                                                    const time = context.dataset.time;
                                                    return `Time: ${moment.unix(time).format('YYYY-MM-DD HH:mm:ss')}`; // Format time
                                                },
                                            }
                                        }
                                    },
                                    elements: {
                                        point: {
                                            radius: 0 // No point radius
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
