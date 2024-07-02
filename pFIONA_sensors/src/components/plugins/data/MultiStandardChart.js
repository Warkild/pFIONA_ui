import React, { useState, useEffect } from 'react'; // Import React and necessary hooks
import { Line } from 'react-chartjs-2'; // Import Line chart from react-chartjs-2
import Chart from 'chart.js/auto'; // Import Chart.js
import moment from 'moment'; // Import moment for date and time manipulation

const MultiStandardChart = () => { // Define MultiStandardChart component
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm')); // Initialize timestamp state
    const [loading, setLoading] = useState(false); // Initialize loading state
    const [data, setData] = useState(null); // Initialize data state
    const [chartData, setChartData] = useState(null); // Initialize chart data state
    const [regressionEquations, setRegressionEquations] = useState([]); // Initialize regression equations state
    const [errorMessage, setErrorMessage] = useState(''); // Initialize error message state
    const [selectedReaction, setSelectedReaction] = useState(''); // Initialize selected reaction state
    const [selectedCycle, setSelectedCycle] = useState(''); // Initialize selected cycle state
    const [availableReactions, setAvailableReactions] = useState([]); // Initialize available reactions state
    const [availableCycles, setAvailableCycles] = useState([]); // Initialize available cycles state
    const [deploymentInfo, setDeploymentInfo] = useState(null); // Initialize deployment info state
    const [standardDillutionCycleInfo, setStandardDillutionCycleInfo] = useState(''); // Initialize standard dilution cycle info state
    const [cycleStartTime, setCycleStartTime] = useState(''); // Initialize cycle start time state
    const [cycleEndTime, setCycleEndTime] = useState(''); // Initialize cycle end time state
    const [standardConcentration, setStandardConcentration] = useState(null); // Initialize standard concentration state

    useEffect(() => { // Effect to set available reactions when data changes
        if (data) {
            const reactionsWithStandards = Object.keys(data).filter(reaction =>
                Object.keys(data[reaction]).some(cycle =>
                    Object.keys(data[reaction][cycle]).some(key => key.startsWith("Standard_Dillution"))
                )
            );
            setAvailableReactions(reactionsWithStandards);
            if (reactionsWithStandards.length > 0) {
                setSelectedReaction(reactionsWithStandards[0]);
                fetchStandardConcentration(reactionsWithStandards[0]);
                setErrorMessage('');
            } else {
                setErrorMessage(`No multi standard associated for any reaction in deployment ${deploymentInfo.deployment_id}, begin at ${moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')} and end at ${moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}`);
            }
        }
    }, [data, deploymentInfo]);

    useEffect(() => { // Effect to set available cycles when selected reaction changes
        if (selectedReaction) {
            const cycles = Object.keys(data[selectedReaction]);
            setAvailableCycles(cycles);
            if (cycles.length > 0) {
                setSelectedCycle(cycles[0]);
                setErrorMessage('');
            } else {
                setSelectedCycle('');
                setErrorMessage(`No cycles available for the selected reaction in deployment ${deploymentInfo.deployment_id}, begin at ${moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')} and end at ${moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}`);
            }
        }
    }, [selectedReaction, data, deploymentInfo]);

    useEffect(() => { // Effect to set chart data when selected cycle or reaction changes
        if (selectedCycle && selectedReaction) {
            const cycleData = data[selectedReaction][selectedCycle];
            const { standardDillutionData, cycleInfo, cycleStart, cycleEnd } = getLastStandardDillutionData(selectedReaction, selectedCycle);
            setChartData(generateChartData(cycleData, standardDillutionData));
            setStandardDillutionCycleInfo(cycleInfo);

            // Set cycle start and end times
            setCycleStartTime(cycleData.cycle_start_time ? moment.unix(cycleData.cycle_start_time).format('YYYY-MM-DD HH:mm:ss') : '');
            setCycleEndTime(cycleData.cycle_end_time ? moment.unix(cycleData.cycle_end_time).format('YYYY-MM-DD HH:mm:ss') : '');
        }
    }, [selectedCycle, selectedReaction, standardConcentration]);

    const fetchData = async () => { // Function to fetch data
        setLoading(true);
        setErrorMessage('');
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_monitored_wavelength_values_in_deployment?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            setData(result.data);
            setDeploymentInfo(result.deployment_info);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Error fetching data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStandardConcentration = async (reactionName) => { // Function to fetch standard concentration
        try {
            const response = await fetch(`/api/get_standard_concentration?reaction_name=${reactionName}`);
            const result = await response.json();
            setStandardConcentration(result.standard_concentration);
        } catch (error) {
            console.error('Error fetching standard concentration:', error);
        }
    };

    const handleTimestampChange = (event) => { // Function to handle timestamp change
        setTimestamp(event.target.value);
        setErrorMessage('');
    };

    const handleNextCycle = () => { // Function to handle next cycle button click
        const currentIndex = availableCycles.indexOf(selectedCycle);
        if (currentIndex < availableCycles.length - 1) {
            setSelectedCycle(availableCycles[currentIndex + 1]);
        }
    };

    const handlePreviousCycle = () => { // Function to handle previous cycle button click
        const currentIndex = availableCycles.indexOf(selectedCycle);
        if (currentIndex > 0) {
            setSelectedCycle(availableCycles[currentIndex - 1]);
        }
    };

    const calculateRegression = (dataPoints) => { // Function to calculate regression
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
        const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
        const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    };

    const getLastStandardDillutionData = (reaction, cycle) => { // Function to get last standard dilution data
        const cycles = Object.keys(data[reaction]);
        const cycleIndex = cycles.indexOf(cycle);

        for (let i = cycleIndex - 1; i >= 0; i--) {
            const previousCycle = cycles[i];
            if (data[reaction][previousCycle]["Standard_Dillution_0"]) {
                const cycleDetails = data[reaction][previousCycle];
                const cycleInfo = `Standard Dillution from cycle ${previousCycle}, between ${moment.unix(cycleDetails.cycle_start_time).format('YYYY-MM-DD HH:mm:ss')} and ${moment.unix(cycleDetails.cycle_end_time).format('YYYY-MM-DD HH:mm:ss')}`;
                return { standardDillutionData: cycleDetails, cycleInfo, cycleStart: cycleDetails.cycle_start_time, cycleEnd: cycleDetails.cycle_end_time };
            }
        }
        return { standardDillutionData: null, cycleInfo: '', cycleStart: '', cycleEnd: '' };
    };

    const generateChartData = (cycleData, standardDillutionData) => { // Function to generate chart data
        if (standardConcentration === null) {
            return { labels: [], datasets: [] };
        }

        const labels = [];
        const datasetMap = {};
        const dataPointsMap = {};

        const dilutionLabels = {
            "Standard_Dillution_0": 0,
            "Standard_Dillution_1": standardConcentration * 0.25,
            "Standard_Dillution_2": standardConcentration * 0.5,
            "Standard_Dillution_3": standardConcentration * 0.75,
            "Standard_Dillution_4": standardConcentration * 1.0,
        };

        const wavelengths = Object.keys(cycleData["Standard_Dillution_0"] || standardDillutionData["Standard_Dillution_0"] || {});
        const wavelengthsToInclude = wavelengths.slice(0, wavelengths.length - 1); // Exclude the highest wavelength

        const addDataPoints = (data) => {
            for (const [dilution, wavelengths] of Object.entries(data)) {
                if (dilutionLabels.hasOwnProperty(dilution)) {
                    for (const [wavelength, value] of Object.entries(wavelengths)) {
                        if (wavelengthsToInclude.includes(wavelength)) {
                            if (!datasetMap[wavelength]) {
                                datasetMap[wavelength] = {
                                    label: `Wavelength ${wavelength} nm`,
                                    data: [],
                                    borderColor: getColor(wavelength),
                                    backgroundColor: getColor(wavelength),
                                    fill: false,
                                    tension: 0.1,
                                    showLine: false,
                                };
                                dataPointsMap[wavelength] = [];
                            }
                            datasetMap[wavelength].data.push({
                                x: dilutionLabels[dilution],
                                y: value
                            });
                            dataPointsMap[wavelength].push({ x: dilutionLabels[dilution], y: value });
                        }
                    }
                }
            }
        };

        addDataPoints(standardDillutionData || {});
        addDataPoints(cycleData);

        const datasets = Object.values(datasetMap);
        const regressionEquations = [];

        for (const [wavelength, dataPoints] of Object.entries(dataPointsMap)) {
            if (dataPoints.length > 0) {
                const { slope, intercept } = calculateRegression(dataPoints);
                regressionEquations.push(`Wavelength ${wavelength} nm: y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);

                const regressionLine = {
                    label: `Regression Line ${wavelength} nm`,
                    data: dataPoints.map(point => ({
                        x: point.x,
                        y: slope * point.x + intercept,
                    })),
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    showLine: true,
                    pointRadius: 0,
                };
                datasets.push(regressionLine);

                // Add sample points based on the regression line
                if (cycleData.Sample && cycleData.Sample[wavelength] !== undefined) {
                    const sampleValue = cycleData.Sample[wavelength];
                    const sampleDilution = (sampleValue - intercept) / slope;
                    datasets.push({
                        label: `Sample Wavelength ${wavelength} nm`,
                        data: [{ x: sampleDilution, y: sampleValue }],
                        borderColor: 'rgb(0, 128, 0)',
                        backgroundColor: 'rgb(0, 128, 0)',
                        fill: false,
                        tension: 0.1,
                        showLine: false,
                        pointRadius: 5,
                    });
                }
            }
        }

        setRegressionEquations(regressionEquations);

        return { labels, datasets };
    };

    const getColor = (wavelength) => { // Function to get color based on wavelength
        const colors = {
            '810.0': 'rgb(255, 99, 132)',
            '660.0': 'rgb(54, 162, 235)',
            '880.0': 'rgb(75, 192, 192)',
            '1050.0': 'rgb(153, 102, 255)',
        };
        return colors[wavelength] || 'rgb(0, 0, 0)';
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">MULTI STANDARD CHART</h2>
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
                                    disabled={loading}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={fetchData}
                            disabled={loading}
                            className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? 'Fetching...' : 'Fetch Deployment'}
                        </button>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>}
                    {data && availableReactions.length > 0 && (
                        <div className="flex flex-row justify-between">
                            <div className="w-5/12">
                                <h3 className="font-bold text-lg mb-3">Cycle</h3>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Cycle:
                                    <select
                                        onChange={(e) => setSelectedCycle(e.target.value)}
                                        value={selectedCycle}
                                        disabled={loading}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="" disabled>Select a cycle</option>
                                        {availableCycles.map((cycle) => (
                                            <option key={cycle} value={cycle}>
                                                {cycle}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="flex mt-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviousCycle}
                                        disabled={loading || availableCycles.indexOf(selectedCycle) === 0}
                                        className={`mr-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${availableCycles.indexOf(selectedCycle) === 0 ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextCycle}
                                        disabled={loading || availableCycles.indexOf(selectedCycle) === availableCycles.length - 1}
                                        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${availableCycles.indexOf(selectedCycle) === availableCycles.length - 1 ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                            <div className="w-1/2">
                                <h3 className="font-bold text-lg mb-3">Reaction</h3>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Reaction:
                                    <select
                                        onChange={(e) => {
                                            setSelectedReaction(e.target.value);
                                            fetchStandardConcentration(e.target.value);
                                        }}
                                        value={selectedReaction}
                                        disabled={loading}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="" disabled>Select a reaction</option>
                                        {availableReactions.map((reaction) => (
                                            <option key={reaction} value={reaction}>
                                                {reaction}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:w-1/2">
                    {chartData && (
                        <>
                            <div className="text-sm text-gray-500 mb-2">
                                Deployment Start Time: {deploymentInfo && moment.unix(deploymentInfo.deployment_start_time).format('YYYY-MM-DD HH:mm:ss')} - Deployment End Time: {deploymentInfo && moment.unix(deploymentInfo.deployment_end_time).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                                Cycle Start Time: {cycleStartTime} - Cycle End Time: {cycleEndTime}
                            </div>
                            <div className="mt-5" style={{ height: '500px' }}>
                                <Line
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                type: 'linear',
                                                title: {
                                                    display: true,
                                                    text: 'Concentration',
                                                },
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: 'Value',
                                                },
                                            },
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    title: function (context) {
                                                        return context[0].label; // Dilution level
                                                    },
                                                    label: function (context) {
                                                        let label = context.dataset.label || '';
                                                        if (label) {
                                                            label += ': ';
                                                        }
                                                        if (context.parsed.y !== null) {
                                                            label += context.parsed.y.toFixed(2); // round value to 2 decimal places
                                                        }
                                                        return label;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
                <div>
                    {standardDillutionCycleInfo && (
                        <div className="mt-2 text-sm text-gray-700">
                            {standardDillutionCycleInfo}
                        </div>
                    )}
                    {regressionEquations.length > 0 && (
                        <div className="mt-2 text-sm text-gray-700">
                            {regressionEquations.map((equation, index) => (
                                <div key={index}>{equation}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiStandardChart;
