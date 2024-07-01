import React, { useEffect, useState } from 'react'; // Import necessary modules from React
import { Line } from 'react-chartjs-2'; // Import Line component from react-chartjs-2 for chart rendering
import moment from 'moment'; // Import moment for date manipulation

const SpectrumChart = ({  }) => { // Define SpectrumChart component accepting sensor_id as prop
    const [cycleCount, setCycleCount] = useState(0); // State to store the count of cycles
    const [selectedCycle, setSelectedCycle] = useState(''); // State to store the selected cycle
    const [selectedReaction, setSelectedReaction] = useState(''); // State to store the selected reaction
    const [loading, setLoading] = useState(false); // State to manage loading state
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm')); // State to store timestamp
    const [data, setData] = useState(null); // State to store data
    const [chartData, setChartData] = useState(null); // State to store chart data
    const [wavelengths, setWavelengths] = useState([]); // State to store wavelengths
    const [errorMessage, setErrorMessage] = useState(''); // State to store error messages
    const [deploymentInfo, setDeploymentInfo] = useState(null); // State to store deployment information
    const [availableReactions, setAvailableReactions] = useState([]); // State to store available reactions
    const [allReactionsData, setAllReactionsData] = useState({}); // State to store all reactions data
    const [deployments, setDeployments] = useState([]); // State to store deployments list
    const [currentDeploymentIndex, setCurrentDeploymentIndex] = useState(null); // State to store the index of current deployment
    const [shouldFetch, setShouldFetch] = useState(false); // State to trigger fetch action
    const [shouldFetchSpectrum, setShouldFetchSpectrum] = useState(false); // State to trigger fetch spectrum action

    useEffect(() => {
        fetchCycleCount(); // Fetch cycle count on component mount
    }, []);

    useEffect(() => {
        fetchDeploymentList(); // Fetch deployment list on component mount
    }, []);

    useEffect(() => {
        if (selectedCycle && shouldFetchSpectrum) { // Fetch spectrum data if a cycle is selected and shouldFetchSpectrum is true
            fetchSpectrumData(selectedCycle);
            setShouldFetchSpectrum(false); // Reset the flag after fetching spectrum data
        }
    }, [selectedCycle, shouldFetchSpectrum]);

    useEffect(() => {
        if (selectedReaction) { // Update data and chart data when a reaction is selected
            const reactionData = allReactionsData[selectedReaction] || {};
            setData(reactionData);
            setChartData(generateChartData(reactionData));
        }
    }, [selectedReaction, allReactionsData]);

    useEffect(() => {
        if (shouldFetch) { // Fetch cycle count if shouldFetch is true
            fetchCycleCount();
            setShouldFetch(false); // Reset the flag after fetching cycle count
        }
    }, [timestamp, shouldFetch]);

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

    const fetchCycleCount = async () => { // Fetch the cycle count from API
        setLoading(true); // Set loading state to true
        setErrorMessage(''); // Reset error message
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            const response = await fetch(`/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            if (result.cycle_count > 0) { // Check if cycle count is greater than zero
                setCycleCount(result.cycle_count); // Set the cycle count state
                setSelectedCycle(result.cycle_count.toString()); // Set the selected cycle state
                setShouldFetchSpectrum(true); // Set the flag to fetch spectrum data
            } else {
                setCycleCount(0); // Set cycle count to zero if no cycles found
                setSelectedCycle(''); // Reset selected cycle
                setData(null); // Reset data
                setDeploymentInfo(null); // Reset deployment info
                setErrorMessage('No deployment found before the selected date.');
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error);
            setErrorMessage('Error fetching cycle count. Please try again.');
        }
    };

    const fetchSpectrumData = async (cycle) => { // Fetch spectrum data for the selected cycle
        try {
            const epochTimestamp = moment(timestamp).unix(); // Convert timestamp to epoch time
            const response = await fetch(`/api/get_spectrums_in_cycle_full_info?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`);
            const result = await response.json();

            if (!result || !result.data) {
                throw new Error('Spectrums data is missing or invalid');
            }

            const spectrumsData = result.data; // Store fetched spectrums data
            const reactions = Object.keys(spectrumsData); // Extract reactions from spectrums data
            if (reactions.length === 0) {
                throw new Error('No reactions data available');
            }

            setAvailableReactions(reactions); // Set available reactions state
            setAllReactionsData(spectrumsData); // Set all reactions data state

            const firstReaction = reactions[0]; // Get the first reaction
            setSelectedReaction(firstReaction); // Set selected reaction state
            setData(spectrumsData[firstReaction] || {}); // Set data state

            let wavelengths = [];
            let validValuesFound = false;

            for (const [reaction, types] of Object.entries(spectrumsData)) {
                for (const [typeKey, subcycles] of Object.entries(types)) {
                    for (const [subcycle, spectrumList] of Object.entries(subcycles)) {
                        if (spectrumList.length > 0 && spectrumList[0].values.length > 0) {
                            wavelengths = spectrumList[0].values.map(v => v[0]).filter(w => w !== null);
                            if (wavelengths.length > 0) {
                                validValuesFound = true;
                                break;
                            }
                        }
                    }
                    if (validValuesFound) break;
                }
                if (validValuesFound) break;
            }

            setDeploymentInfo(result.deployment_info); // Set deployment information state

            const deploymentId = result.deployment_info.deployment_id;
            const deploymentIndex = deployments.findIndex(deployment => deployment.deployment === deploymentId);
            setCurrentDeploymentIndex(deploymentIndex); // Set current deployment index state

            if (!validValuesFound) {
                throw new Error('Invalid data structure: No valid values found in Sample or Standard or Blank');
            }

            setWavelengths(wavelengths); // Set wavelengths state
        } catch (error) {
            console.error('Error fetching spectrum data:', error);
            setErrorMessage(`Error fetching spectrum data: ${error.message}. Please try again.`);
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    const handleTimestampChange = (event) => {
        setTimestamp(event.target.value); // Update timestamp state on change
        setErrorMessage(''); // Reset error message
    };

    const handleCycleChange = (cycle) => {
        setSelectedCycle(cycle); // Update selected cycle state on change
        setShouldFetchSpectrum(true); // Set the flag to fetch spectrum data
    };

    const handleReactionChange = (reaction) => {
        setSelectedReaction(reaction); // Update selected reaction state on change
    };

    const handleNextCycle = () => {
        const nextCycle = Math.min(parseInt(selectedCycle) + 1, cycleCount).toString(); // Calculate the next cycle
        setErrorMessage("");
        handleCycleChange(nextCycle); // Change to the next cycle
    };

    const handlePrevCycle = () => {
        const prevCycle = Math.max(parseInt(selectedCycle) - 1, 1).toString(); // Calculate the previous cycle
        setErrorMessage("");
        handleCycleChange(prevCycle); // Change to the previous cycle
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

    const colorMap = { // Define a map for spectrum types to their respective colors
        'Blank_Reference': 'rgb(255, 0, 0)',
        'Blank_Dark': 'rgb(0, 0, 0)',
        'Blank': 'rgb(255, 150, 0)',
        'Sample_Reference': 'rgb(6,159,6)',
        'Sample_Dark': 'rgb(0, 0, 0)',
        'Sample': 'rgb(70,218,29)',
        'Standard_Reference': 'rgb(0, 0, 255)',
        'Standard_Dark': 'rgb(0, 0, 0)',
        'Standard': 'rgb(0, 191, 255)',
        'CRM_Reference': 'rgb(136,22,165)',
        'CRM_Dark': 'rgb(0, 0, 0)',
        'CRM': 'rgb(186,86,211)',
        'Standard_Dillution_0_Dark': 'rgb(0, 0, 0)',
        'Standard_Dillution_1_Dark': 'rgb(0, 0, 0)',
        'Standard_Dillution_2_Dark': 'rgb(0, 0, 0)',
        'Standard_Dillution_3_Dark': 'rgb(0, 0, 0)',
        'Standard_Dillution_4_Dark': 'rgb(0, 0, 0)',
        'Standard_Dillution_0_Reference': 'rgb(191,9,9)',
        'Standard_Dillution_0': 'rgb(191,9,9)',
        'Standard_Dillution_1_Reference': 'rgb(255, 0, 0)',
        'Standard_Dillution_1': 'rgb(255, 0, 0)',
        'Standard_Dillution_2_Reference': 'rgb(255, 100, 0)',
        'Standard_Dillution_2': 'rgb(255, 100, 0)',
        'Standard_Dillution_3_Reference': 'rgb(255, 175, 0)',
        'Standard_Dillution_3': 'rgb(255, 175, 0)',
        'Standard_Dillution_4_Reference': 'rgb(255, 255, 0)',
        'Standard_Dillution_4': 'rgb(255, 255, 0)',
    };

    const getRandomColor = () => { // Function to generate a random color
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const extractType = (spectrumtype) => { // Function to extract type from spectrumtype string
        const parts = spectrumtype.split('_');
        return parts.slice(1).join('_');
    };

    const generateChartData = (cycleData) => { // Function to generate chart data from cycle data
        if (!wavelengths || wavelengths.length === 0) { // Return empty data if no wavelengths available
            return { labels: [], datasets: [] };
        }

        const chartData = { labels: wavelengths.map(w => w.toFixed(2)), datasets: [] }; // Initialize chart data structure

        for (const [type, subcycles] of Object.entries(cycleData || {})) { // Iterate over cycle data
            for (const [subcycle, spectrumList] of Object.entries(subcycles || {})) { // Iterate over subcycles
                spectrumList.forEach(spectrum => { // Iterate over spectrum list
                    if (!spectrum.spectrumtype.includes('wavelength_monitored') && spectrum.values && spectrum.values[0] && spectrum.values[0][0] !== null) {
                        const typeKey = extractType(spectrum.spectrumtype); // Extract type key
                        chartData.datasets.push({
                            label: `${typeKey} Subcycle ${subcycle}`, // Set dataset label
                            data: spectrum.values.map(v => v[1]).filter(val => val !== null), // Set dataset data
                            borderColor: colorMap[typeKey] || getRandomColor(), // Set dataset border color
                            fill: false,
                            tension: 0.1,
                            time: spectrum.time // Set dataset time
                        });
                    }
                });
            }
        }
        return chartData;
    };

    return (
        <div className="w-full"> {/* Container div */}
            <div className="mb-5"> {/* Margin bottom */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">SPECTRUM CHARTS</h2> {/* Header */}
            </div>
            <div className="flex flex-col md:flex-row font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"> {/* Main content container */}
                <div className="md:w-1/2 mb-5 md:mb-0 pr-5"> {/* Left column */}
                    <form className="mb-5"> {/* Form for timestamp and buttons */}
                        <div className="mb-3"> {/* Margin bottom */}
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
                                type="button"
                                onClick={() => setShouldFetch(true)}
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
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>} {/* Display error message if any */}
                    <div className="flex flex-row justify-between"> {/* Cycle and Deployment Info container */}
                        <div className="w-5/12"> {/* Cycle selection container */}
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
                            <div className="flex space-x-2 mt-2"> {/* Cycle navigation buttons */}
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
                        <div className="w-1/2"> {/* Deployment Information container */}
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
                    <div className="mt-4"> {/* Reaction selection container */}
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
                    {selectedCycle && chartData && ( // Display chart if a cycle is selected and chart data is available
                        <div className="mt-5" style={{ height: '500px' }}>
                            <h2 className="text-lg font-bold mb-2">Cycle {selectedCycle}</h2>
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    animation: false,
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
                                                text: 'Intensity',
                                            },
                                        },
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                title: function (context) {
                                                    const index = context[0].dataIndex;
                                                    return `Wavelength: ${wavelengths[index] ? wavelengths[index].toFixed(2) : 'N/A'}`;
                                                },
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.parsed.y.toFixed(2);
                                                    }
                                                    return label;
                                                },
                                                afterLabel: function (context) {
                                                    const time = context.dataset.time;
                                                    return `Time: ${moment.unix(time).format('YYYY-MM-DD HH:mm:ss')}`;
                                                },
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpectrumChart; // Export the SpectrumChart component as default
