import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import { TailSpin } from 'react-loader-spinner';

const ConcentrationChart = ({  }) => {
    // Initialize state variables
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm')); // Current timestamp
    const [selectedReaction, setSelectedReaction] = useState(''); // Selected reaction
    const [loading, setLoading] = useState(false); // Loading state for data fetching
    const [data, setData] = useState(null); // Concentration data fetched from the API
    const [chartData, setChartData] = useState(null); // Data for the chart
    const [availableReactions, setAvailableReactions] = useState([]); // List of available reactions
    const [errorMessage, setErrorMessage] = useState(''); // Error message to display
    const [startDate, setStartDate] = useState(''); // Start date for filtering data
    const [endDate, setEndDate] = useState(''); // End date for filtering data
    const [deployments, setDeployments] = useState([]); // List of deployments
    const [currentDeploymentIndex, setCurrentDeploymentIndex] = useState(null); // Index of the current deployment
    const [shouldFetch, setShouldFetch] = useState(false); // Flag to trigger data fetch

    // Fetch the list of deployments on component mount
    useEffect(() => {
        fetchDeploymentList();
    }, []);

    // Fetch concentration data if shouldFetch flag is true
    useEffect(() => {
        if (shouldFetch) {
            fetchConcentrationData();
            setShouldFetch(false);
        }
    }, [shouldFetch]);

    // Fetch the list of deployments from the API
    const fetchDeploymentList = async () => {
        try {
            const response = await fetch(`/api/get_deployment_list?sensor_id=${sensor_id}`);
            const result = await response.json();
            setDeployments(result);
        } catch (error) {
            console.error('Error fetching deployment list:', error);
            setErrorMessage('Error fetching deployment list. Please try again.');
        }
    };

    // Fetch concentration data from the API
    const fetchConcentrationData = async () => {
        setLoading(true); // Start loading
        setErrorMessage(''); // Clear previous error messages
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            const response = await fetch(`/api/get_concentration_for_deployment?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json(); // Parse the JSON response
            setData(result); // Set the fetched data to state
            const reactions = Object.keys(result.spectrums_data); // Extract reaction names from the data
            setAvailableReactions(reactions); // Set the available reactions
            if (reactions.length > 0) {
                setSelectedReaction(reactions[0]); // Automatically select the first reaction
            }
            setStartDate(moment.unix(result.deployment_info.deployment_start_time).format('YYYY-MM-DDTHH:mm'));
            setEndDate(moment.unix(result.deployment_info.deployment_end_time).format('YYYY-MM-DDTHH:mm'));

            // Set current deployment index based on deployment info
            const deploymentId = result.deployment_info.deployment_id;
            const deploymentIndex = deployments.findIndex(deployment => deployment.deployment === deploymentId);
            setCurrentDeploymentIndex(deploymentIndex);
        } catch (error) {
            console.error('Error fetching concentration data:', error); // Log error to the console
            setErrorMessage('Error fetching concentration data. Please try again.'); // Display error message
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Handler for changes in the timestamp input
    const handleTimestampChange = (event) => {
        setTimestamp(event.target.value); // Update the timestamp state
        setErrorMessage(''); // Clear any previous error messages
    };

    // Handler for changes in the reaction select dropdown
    const handleReactionChange = (event) => {
        setSelectedReaction(event.target.value); // Update the selected reaction state
    };

    // Handler for changes in the start date input
    const handleStartDateChange = (event) => {
        setStartDate(event.target.value); // Update the start date state
    };

    // Handler for changes in the end date input
    const handleEndDateChange = (event) => {
        setEndDate(event.target.value); // Update the end date state
    };

    // Handler for updating the chart data based on selected dates
    const handleDateChange = () => {
        if (selectedReaction && data && data.spectrums_data[selectedReaction]) {
            setChartData(generateChartData(data.spectrums_data[selectedReaction])); // Generate chart data for the selected reaction and dates
        }
    };

    // Handler for fetching the next deployment
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

    // Handler for fetching the previous deployment
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

    // Update chart data whenever selected reaction or data changes
    useEffect(() => {
        if (selectedReaction && data && data.spectrums_data[selectedReaction]) {
            setChartData(generateChartData(data.spectrums_data[selectedReaction])); // Generate chart data for the selected reaction
        }
    }, [selectedReaction, data]);

    // Function to generate chart data from the reaction data
    const generateChartData = (reactionData) => {
        if (!reactionData) {
            return { labels: [], datasets: [] }; // Return empty data if no reaction data is available
        }

        const labels = []; // Labels for the x-axis (cycle start times)
        const datasetMap = {}; // Map to hold datasets for different wavelengths
        const startEpoch = startDate ? moment(startDate).unix() : null; // Convert start date to epoch time
        const endEpoch = endDate ? moment(endDate).unix() : null; // Convert end date to epoch time

        // Loop through each cycle in the reaction data
        for (const [cycle, values] of Object.entries(reactionData)) {
            if (values.concentration && (!startEpoch || values.cycle_start_time >= startEpoch) && (!endEpoch || values.cycle_start_time <= endEpoch)) {
                const cycleStartTime = moment.unix(values.cycle_start_time).format('YYYY-MM-DD HH:mm:ss'); // Format the cycle start time
                labels.push(cycleStartTime); // Add the formatted start time to labels

                // Loop through each concentration value in the cycle
                for (const [wavelength, concentration] of Object.entries(values.concentration)) {
                    if (!datasetMap[wavelength]) { // Check if a dataset for the wavelength already exists
                        datasetMap[wavelength] = {
                            label: `Wavelength ${wavelength} nm`, // Label for the dataset
                            data: [], // Data points for the dataset
                            borderColor: getColor(wavelength), // Color for the dataset line
                            fill: false, // Do not fill under the line
                            tension: 0.1, // Line tension (smoothness)
                        };
                    }
                    datasetMap[wavelength].data.push(concentration); // Add the concentration value to the dataset
                }
            }
        }

        const datasets = Object.values(datasetMap); // Convert the dataset map to an array

        return { labels, datasets }; // Return the chart data
    };

    // Function to get a color for a dataset based on the wavelength
    const getColor = (wavelength) => {
        // Define a map of colors for specific wavelengths
        const colors = {
            '810.0': 'rgb(255, 99, 132)', // Color for 810 nm wavelength
            '660.0': 'rgb(54, 162, 235)', // Color for 660 nm wavelength
            '880.0': 'rgb(75, 192, 192)', // Color for 880 nm wavelength
        };
        return colors[wavelength] || getRandomColor(); // Return the color or a random color if not found
    };

    // Function to generate a random color
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">CONCENTRATION CHART</h2> {/* Header for the component */}
            </div>
            <div className="flex flex-col md:flex-row font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                <div className="md:w-1/2 mb-5 md:mb-0 pr-5">
                    <form className="mb-5">
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
                        <div className="flex flex-row space-x-10">
                            <button
                                type="button"
                                onClick={() => setShouldFetch(true)}
                                disabled={loading}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                            >
                                {loading ? (
                                    <TailSpin height="24" width="24" color="#000" ariaLabel="loading" />
                                ) : (
                                    'Fetch Deployment'
                                )}
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
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>} {/* Display error message */}
                    {availableReactions.length > 0 && ( // Only show the reaction select if reactions are available
                        <div className="mt-4">
                            <h3 className="font-bold text-lg mb-3">Reaction</h3>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Reaction:
                                <select
                                    onChange={handleReactionChange}
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
                    )}
                </div>
                {data && data.deployment_info && (
                    <div className="md:w-1/2 mb-5 md:mb-0 pr-5">
                        <div className="mb-4">
                            <h3 className="font-bold text-lg mb-3">Deployment Information</h3>
                            <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                                <p className="text-sm"><strong>Deployment ID:</strong> {data.deployment_info.deployment_id}</p>
                                <p className="text-sm"><strong>Deployment Start Time:</strong> {moment.unix(data.deployment_info.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                <p className="text-sm"><strong>Deployment End Time:</strong> {moment.unix(data.deployment_info.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                            </div>
                        </div>
                    </div>
                )}
                {chartData && ( // Show date filters only if chart data is available
                    <div className="flex mt-5 items-center">
                        <div className="mr-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Start Date:
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <div className="mr-3">
                            <label className="block text-sm font-medium text-gray-700">
                                End Date:
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={handleDateChange}
                            className="text-center justify-center mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Change
                        </button>
                    </div>
                )}
                <div>
                    {chartData && ( // Only show the chart if chart data is available
                        <div className="mt-5" style={{ height: '500px' }}>
                            <Line
                                data={chartData} // Data for the chart
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    animation: false,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Cycle Start Time',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Concentration',
                                            },
                                        },
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                title: function (context) {
                                                    return context[0].label; // Show label for tooltip title
                                                },
                                                label: function (context) {
                                                    let label = context.dataset.label || ''; // Show dataset label in tooltip
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.parsed.y.toFixed(2); // Show parsed value in tooltip
                                                    }
                                                    return label;
                                                },
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConcentrationChart;
