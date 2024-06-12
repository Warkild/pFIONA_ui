import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import moment from 'moment';

const SpectrumChart = () => {
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

    useEffect(() => {
        fetchCycleCount();
    }, []);

    useEffect(() => {
        if (selectedCycle) {
            fetchSpectrumData(selectedCycle);
        }
    }, [selectedCycle]);

    useEffect(() => {
        if (selectedReaction) {
            setData(allReactionsData[selectedReaction] || {});
        }
    }, [selectedReaction]);

    const fetchCycleCount = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`http://127.0.0.1:8000/api/get_cycle_count?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            if (result.cycle_count > 0) {
                setCycleCount(result.cycle_count);
                setSelectedCycle(result.cycle_count.toString());
            } else {
                setCycleCount(0);
                setSelectedCycle('');
                setData(null);
                setDeploymentInfo(null);
                setErrorMessage('No deployment found before the selected date.');
            }
        } catch (error) {
            console.error('Error fetching cycle count:', error);
            setErrorMessage('Error fetching cycle count. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpectrumData = async (cycle) => {
        setLoading(true);
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`http://127.0.0.1:8000/api/get_spectrums_in_cycle?sensor_id=${sensor_id}&timestamp=${epochTimestamp}&cycle=${cycle}`);
            const result = await response.json();
            if (!result || result.length === 0) {
                throw new Error('Spectrums data is missing');
            }

            const spectrumsData = result['spectrums_data'];
            const reactions = Object.keys(spectrumsData);
            if (reactions.length === 0) {
                throw new Error('No reactions data available');
            }

            setAvailableReactions(reactions);
            setAllReactionsData(spectrumsData);

            const firstReaction = reactions[0];
            setSelectedReaction(firstReaction);
            const firstReactionData = spectrumsData[firstReaction];

            if (firstReactionData && firstReactionData.Blank && firstReactionData.Blank['0'] && firstReactionData.Blank['0'][0] && firstReactionData.Blank['0'][0].values) {
                setWavelengths(firstReactionData.Blank['0'][0].values.map(v => v.wavelength));
            } else {
                throw new Error('Invalid data structure');
            }

            setDeploymentInfo(result.deployment_info);
        } catch (error) {
            console.error('Error fetching spectrum data:', error);
            setErrorMessage('Error fetching spectrum data. Please try again.');
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
    };

    const handleReactionChange = (reaction) => {
        setSelectedReaction(reaction);
    };

    const handleNextCycle = () => {
        const nextCycle = Math.min(parseInt(selectedCycle) + 1, cycleCount).toString();
        handleCycleChange(nextCycle);
    };

    const handlePrevCycle = () => {
        const prevCycle = Math.max(parseInt(selectedCycle) - 1, 1).toString();
        handleCycleChange(prevCycle);
    };

    const colorMap = {
        'Blank_Reference': 'rgb(255, 0, 0)',        // Rouge
        'Blank_Dark': 'rgb(255, 165, 0)',           // Orange
        'Blank': 'rgb(255, 255, 0)',                // Jaune
        'Sample_Reference': 'rgb(211, 211, 211)',   // Gris clair
        'Sample_Dark': 'rgb(0, 0, 0)',              // Noir
        'Sample': 'rgb(169, 169, 169)',             // Gris foncé
        'Standard_Reference': 'rgb(0, 0, 255)',     // Bleu
        'Standard_Dark': 'rgb(0, 0, 139)',          // Bleu foncé
        'Standard': 'rgb(0, 191, 255)',             // Bleu ciel
    };

    const extractType = (spectrumtype) => {
        const parts = spectrumtype.split('_');
        return parts.slice(1).join('_'); // Extract everything after the first underscore
    };

    const generateChartData = (cycleData) => {
        if (!wavelengths || wavelengths.length === 0) {
            return { labels: [], datasets: [] };
        }

        const chartData = { labels: wavelengths.map(w => w.toFixed(2)), datasets: [] };

        for (const [type, subcycles] of Object.entries(cycleData || {})) {
            for (const [subcycle, spectrumList] of Object.entries(subcycles || {})) {
                spectrumList.forEach(spectrum => {
                    if (!spectrum.spectrumtype.includes('wavelength_monitored')) { // Exclude spectra containing 'wavelength_monitored'
                        const typeKey = extractType(spectrum.spectrumtype);
                        chartData.datasets.push({
                            label: `${typeKey} Subcycle ${subcycle}`,
                            data: spectrum.values.map(v => v.value),
                            borderColor: colorMap[typeKey] || 'rgb(0, 0, 0)', // Default to black if not found
                            fill: false,
                            tension: 0.1 // Optional: to smooth the line
                        });
                    }
                });
            }
        }
        return chartData;
    };

    const selectedCycleData = selectedCycle ? generateChartData(data) : null;

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">SPECTRUM CHARTS</h2>
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
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                        >
                            Fetch Deployment
                        </button>
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
                                                    return `Wavelength: ${wavelengths[index].toFixed(2)}`; // round wavelength to 2 decimal places
                                                },
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.parsed.y.toFixed(2); // round intensity to 2 decimal places
                                                    }
                                                    return label;
                                                }
                                            }
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

export default SpectrumChart;
