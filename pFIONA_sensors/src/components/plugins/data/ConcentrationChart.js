import React, {useEffect, useState} from 'react';
import {Line} from 'react-chartjs-2';
import moment from 'moment';

const ConcentrationChart = ({}) => {
    const [timestamp, setTimestamp] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [selectedReaction, setSelectedReaction] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [availableReactions, setAvailableReactions] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchConcentrationData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const epochTimestamp = moment(timestamp).unix();
            const response = await fetch(`/api/get_concentration_for_deployment?sensor_id=${sensor_id}&timestamp=${epochTimestamp}`);
            const result = await response.json();
            setData(result);
            const reactions = Object.keys(result.spectrums_data);
            setAvailableReactions(reactions);
            if (reactions.length > 0) {
                setSelectedReaction(reactions[0]);
            }
        } catch (error) {
            console.error('Error fetching concentration data:', error);
            setErrorMessage('Error fetching concentration data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTimestampChange = (event) => {
        setTimestamp(event.target.value);
        setErrorMessage('');
    };

    const handleReactionChange = (event) => {
        setSelectedReaction(event.target.value);
    };

    useEffect(() => {
        if (selectedReaction && data && data.spectrums_data[selectedReaction]) {
            setChartData(generateChartData(data.spectrums_data[selectedReaction]));
        }
    }, [selectedReaction, data]);

    const generateChartData = (reactionData) => {
    if (!reactionData) {
        return { labels: [], datasets: [] };
    }

    const labels = [];
    const datasetMap = {};

    for (const [cycle, values] of Object.entries(reactionData)) {
        if (values.concentration) {
            const cycleStartTime = moment.unix(values.cycle_start_time).format('YYYY-MM-DD HH:mm:ss');
            labels.push(cycleStartTime);

            for (const [wavelength, concentration] of Object.entries(values.concentration)) {
                if (!datasetMap[wavelength]) {
                    datasetMap[wavelength] = {
                        label: `Wavelength ${wavelength} nm`,
                        data: [],
                        borderColor: getColor(wavelength),
                        fill: false,
                        tension: 0.1,
                    };
                }
                datasetMap[wavelength].data.push(concentration);
            }
        }
    }

    const datasets = Object.values(datasetMap);

    return { labels, datasets };
};

    const getColor = (wavelength) => {
        const colors = {
            '810.0': 'rgb(255, 99, 132)',
            '660.0': 'rgb(54, 162, 235)',
            '880.0': 'rgb(75, 192, 192)',
        };
        return colors[wavelength] || 'rgb(0, 0, 0)';
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">CONCENTRATION CHART</h2>
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
                            onClick={fetchConcentrationData}
                            disabled={loading}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Fetch Deployment
                        </button>
                    </form>
                    {!loading && errorMessage && <div className="text-red-500 mb-5">{errorMessage}</div>}
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
                </div>
                <div>
                    {chartData && (
                        <div className="mt-5" style={{height: '500px'}}>
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
                                                    return context[0].label;
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

export default ConcentrationChart;
