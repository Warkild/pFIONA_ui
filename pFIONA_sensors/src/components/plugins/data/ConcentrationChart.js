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

    // Function to fetch concentration data from the API
    const fetchConcentrationData = async () => {
        setLoading(true); // Start loading
        setErrorMessage(''); // Clear previous error messages
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            // Fetch concentration data from the API
            const response = await fetch(`/api/get_concentration_for_deployment?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json(); // Parse the JSON response
            setData(result); // Set the fetched data to state
            const reactions = Object.keys(result.spectrums_data); // Extract reaction names from the data
            setAvailableReactions(reactions); // Set the available reactions
            if (reactions.length > 0) {
                setSelectedReaction(reactions[0]); // Automatically select the first reaction
            }
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

    // Effect to update chart data whenever selected reaction or data changes
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

        // Loop through each cycle in the reaction data
        for (const [cycle, values] of Object.entries(reactionData)) {
            if (values.concentration) { // Check if concentration data is available for the cycle
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
                        <button
                            type="button"
                            onClick={fetchConcentrationData}
                            disabled={loading} // Disable button when loading
                            className={`mt-3 w-full text-center justify-center inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                            {loading ? (
                                <TailSpin height="24" width="24" color="#000" ariaLabel="loading" />
                            ) : (
                                'Fetch Deployment'
                            )}
                        </button>
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
