import React, { useState, useEffect } from 'react'; // Import React and hooks
import { Line } from 'react-chartjs-2'; // Import Line chart from react-chartjs-2
import Chart from 'chart.js/auto'; // Import Chart.js
import moment from 'moment'; // Import moment.js for date handling

const WavelengthMonitoredChart = ({  }) => {
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm')); // State for timestamp
    const [cycle, setCycle] = useState(''); // State for selected cycle
    const [cycleCount, setCycleCount] = useState(0); // State for total cycle count
    const [data, setData] = useState(null); // State for fetched data
    const [wavelengths, setWavelengths] = useState([]); // State for wavelengths
    const [selectedReaction, setSelectedReaction] = useState(''); // State for selected reaction
    const [availableReactions, setAvailableReactions] = useState([]); // State for available reactions
    const [loading, setLoading] = useState(false); // State for loading status
    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    const [deploymentInfo, setDeploymentInfo] = useState(null); // State for deployment info

    useEffect(() => { // Effect to fetch data when cycle changes
        if (cycle) {
            fetchData();
        }
    }, [cycle]);

    const fetchCycleCount = async () => { // Function to fetch cycle count
        setLoading(true); // Set loading to true
        setErrorMessage(null); // Clear error message
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            const response = await fetch(`/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`); // Fetch cycle count from API
            const result = await response.json(); // Parse JSON response
            if (response.ok) {
                setCycleCount(result.cycle_count); // Set cycle count
                if (result.cycle_count > 0) {
                    setCycle('1'); // Set first cycle as default
                    setDeploymentInfo(result.deployment_info); // Set deployment info
                    fetchData(); // Fetch data after getting cycle count
                } else {
                    setCycle(''); // Clear cycle
                    setData(null); // Clear data
                    setWavelengths([]); // Clear wavelengths
                    setAvailableReactions([]); // Clear available reactions
                    setSelectedReaction(''); // Clear selected reaction
                    setDeploymentInfo(null); // Clear deployment info
                }
            } else {
                throw new Error(result.message || 'Error fetching cycle count.');
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error); // Log error
            setErrorMessage('Error fetching cycle count. Please try again.'); // Set error message
        } finally {
            setLoading(false); // Set loading to false
        }
    };

    const fetchData = async () => { // Function to fetch data
        setLoading(true); // Set loading to true
        setErrorMessage(null); // Clear error message
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            const response = await fetch(`/api/get_only_wavelength_monitored_through_time_in_cycle_full_info?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`); // Fetch data from API
            const result = await response.json(); // Parse JSON response

            if (result.data && result.wavelengths && result.deployment_info) {
                setData(result.data); // Set data
                setWavelengths(result.wavelengths); // Set wavelengths
                const reactions = Object.keys(result.data); // Get reactions from data
                setAvailableReactions(reactions); // Set available reactions
                setSelectedReaction(reactions[0]); // Set first reaction as selected
                setDeploymentInfo(result.deployment_info); // Set deployment info
            }
        } catch (error) {
            console.error('Error fetching data:', error); // Log error
            setErrorMessage('Error fetching data. Please try again.'); // Set error message
        } finally {
            setLoading(false); // Set loading to false
        }
    };

    const handleTimestampChange = (event) => { // Handle timestamp change
        setTimestamp(event.target.value); // Set timestamp
        setErrorMessage(''); // Clear error message
    };

    const handleTimestampSubmit = (event) => { // Handle timestamp submit
        event.preventDefault(); // Prevent default form submission
        fetchCycleCount(); // Fetch cycle count
    };

    const handleCycleChange = (event) => { // Handle cycle change
        setCycle(event.target.value); // Set cycle
    };

    const handleReactionChange = (event) => { // Handle reaction change
        setSelectedReaction(event.target.value); // Set selected reaction
    };

    const handleNextCycle = () => { // Handle next cycle button click
        const nextCycle = Math.min(parseInt(cycle) + 1, cycleCount).toString(); // Calculate next cycle
        handleCycleChange({ target: { value: nextCycle } }); // Change cycle
    };

    const handlePrevCycle = () => { // Handle previous cycle button click
        const prevCycle = Math.max(parseInt(cycle) - 1, 1).toString(); // Calculate previous cycle
        handleCycleChange({ target: { value: prevCycle } }); // Change cycle
    };

    const generateChartData = (spectraData) => { // Function to generate chart data
        if (!spectraData || !wavelengths.length) return { labels: [], datasets: [] }; // Return empty if no data

        const labels = []; // Array for labels
        const datasets = {}; // Object for datasets

        Object.keys(spectraData).forEach(subcycle => { // Iterate over subcycles
            spectraData[subcycle].forEach((spectrum, sIndex) => { // Iterate over spectra
                const spectrumLabel = `Spectrum ${sIndex + 1}`; // Create spectrum label
                if (!labels.includes(spectrumLabel)) {
                    labels.push(spectrumLabel); // Add label if not already included
                }
                spectrum.values.forEach((value, vIndex) => { // Iterate over values
                    const wavelength = wavelengths[vIndex].toFixed(2); // Format wavelength
                    const key = `Wavelength ${wavelength} Subcycle ${subcycle}`; // Create dataset key
                    if (!datasets[key]) {
                        datasets[key] = {
                            label: key, // Set label for dataset
                            data: new Array(labels.length).fill(null), // Initialize data array with null
                            borderColor: generateColor(vIndex), // Set border color
                            fill: false, // Set fill to false
                        };
                    }
                    datasets[key].data[labels.indexOf(spectrumLabel)] = value[1]; // Set data value
                });
            });
        });

        Object.values(datasets).forEach(dataset => { // Clean datasets to remove empty data points
            dataset.data = dataset.data.filter((_, index) => {
                return labels[index] !== undefined; // Return only defined labels
            });
        });

        return { labels, datasets: Object.values(datasets) }; // Return labels and datasets
    };

    const generateColor = (index) => { // Function to generate color based on index
        const colors = [ // Array of colors
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ];
        return colors[index % colors.length]; // Return color based on index
    };

    return (
        <div className="w-full"> {/* Container div with full width */}
            <div className="mb-5"> {/* Margin bottom 5 */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">WAVELENGTH MONITORED CHARTS</h2> {/* Title */}
            </div>
            <div className="flex flex-col md:flex-row font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"> {/* Flex container */}
                <div className="md:w-1/2 mb-5 md:mb-0 pr-5"> {/* Half width for medium devices and up */}
                    <form onSubmit={handleTimestampSubmit} className="mb-5"> {/* Form with onSubmit handler */}
                        <div className="mb-3"> {/* Margin bottom 3 */}
                            <label className="block text-sm font-medium text-gray-700"> {/* Label */}
                                Timestamp:
                                <input
                                    type="datetime-local"
                                    value={timestamp} // Set input value
                                    onChange={handleTimestampChange} // Handle input change
                                    required
                                    disabled={loading} // Disable input if loading
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <button
                            type="submit" // Submit button
                            disabled={loading} // Disable if loading
                            className={`inline-flex w-full mt-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                        >
                            Fetch Deployment
                        </button>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>} {/* Error message */}
                    {data && ( // Conditional rendering if data exists
                        <>
                            <div className="flex flex-row justify-between"> {/* Flex container for cycle selection */}
                                <div className="w-5/12"> {/* Width 5/12 */}
                                    <h3 className="font-bold text-lg mb-3">Cycle</h3> {/* Cycle title */}
                                    <label className="block text-sm font-medium text-gray-700 mb-2"> {/* Label */}
                                        Select Cycle:
                                        <select
                                            onChange={handleCycleChange} // Handle cycle change
                                            value={cycle} // Set selected cycle
                                            disabled={loading} // Disable if loading
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            {[...Array(cycleCount).keys()].map((cycle) => ( // Map over cycle count
                                                <option key={cycle} value={cycle + 1}>
                                                    {cycle + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="flex space-x-2 mt-2"> {/* Flex container for cycle buttons */}
                                        <button
                                            onClick={handlePrevCycle} // Handle previous cycle
                                            disabled={parseInt(cycle) <= 1 || loading} // Disable if first cycle or loading
                                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(cycle) <= 1 || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                        >
                                            Previous Cycle
                                        </button>
                                        <button
                                            onClick={handleNextCycle} // Handle next cycle
                                            disabled={parseInt(cycle) >= cycleCount || loading} // Disable if last cycle or loading
                                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${parseInt(cycle) >= cycleCount || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                        >
                                            Next Cycle
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4"> {/* Margin top 4 */}
                                <h3 className="font-bold text-lg mb-3">Reaction</h3> {/* Reaction title */}
                                <label className="block text-sm font-medium text-gray-700 mb-2"> {/* Label */}
                                    Select Reaction:
                                    <select
                                        onChange={handleReactionChange} // Handle reaction change
                                        value={selectedReaction} // Set selected reaction
                                        disabled={loading} // Disable if loading
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {availableReactions.map((reaction) => ( // Map over available reactions
                                            <option key={reaction} value={reaction}>
                                                {reaction}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </>
                    )}
                    <div className="mt-4"> {/* Margin top 4 */}
                        {deploymentInfo && ( // Conditional rendering if deployment info exists
                            <div className="mb-4"> {/* Margin bottom 4 */}
                                <h3 className="font-bold text-lg mb-3">Deployment Information</h3> {/* Deployment info title */}
                                <div className="bg-gray-100 p-4 rounded-md shadow-sm"> {/* Deployment info container */}
                                    <p className="text-sm"><strong>Deployment ID:</strong> {deploymentInfo.deployment_id}</p>
                                    <p className="text-sm"><strong>Deployment Start Time:</strong> {moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                    <p className="text-sm"><strong>Deployment End Time:</strong> {moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full"> {/* Full width */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Grid container */}
                        {data && selectedReaction && Object.keys(data[selectedReaction]).map((type) => ( // Map over data
                            <div key={type} className="p-2"> {/* Padding 2 */}
                                <h2 className="text-lg font-bold mb-2">{type}</h2> {/* Type title */}
                                <div style={{ height: '300px' }}> {/* Chart container */}
                                    <Line
                                        data={generateChartData(data[selectedReaction][type])} // Generate chart data
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
                                                    radius: 0 // Hide points
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

export default WavelengthMonitoredChart; // Export component
