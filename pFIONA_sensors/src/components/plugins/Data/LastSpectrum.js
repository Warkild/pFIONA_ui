import React, { useEffect, useState } from "react";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

function LastSpectrum() {
    const [loading, setLoading] = useState(true);
    const [currentReactionName, setCurrentReactionName] = useState(null);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [error, setError] = useState(null);

    const chartOptions = {
        animation: {
            duration: 0 // Désactiver complètement les animations
        },
        elements: {
            point: {
                radius: 0 // Supprimer les points
            }
        }
    };

    const colors = [
        'rgb(255, 99, 132)',   // rouge
        'rgb(54, 162, 235)',   // bleu
        'rgb(255, 206, 86)',   // jaune
        'rgb(75, 192, 192)',   // vert
        'rgb(153, 102, 255)'   // violet
    ];

    // Fetch current reaction name
    useEffect(() => {
        fetch(`/api/get_current_reaction/${sensor_id}`)
            .then(response => {
                if (!response.ok) {
                    // If the HTTP status indicates an error, throw an error to jump to the catch block
                    return response.json().then(errData => {
                        throw new Error(errData.message);
                    });
                }
                return response.json(); // Proceed with parsing the response body as JSON if status is OK
            })
            .then(data => {
                setCurrentReactionName(data.reaction_name);
            })
            .catch(error => {
                setError(`You have not set the current reaction of sensor`);
                console.error("Error fetching current reaction id:", error);
            });
    }, [sensor_id]);

    // Fetch last 5 spectra data once current reaction name is available
    useEffect(() => {
        if (currentReactionName) {
            const timestamp = new Date().getTime();
            fetch(`/api/get_last_spectrum_all_type_view?reaction_name=${currentReactionName}&timestamp=${timestamp}`)
                .then(response => response.json())
                .then(data => {
                    if (data && JSON.stringify(data.spectra) !== '{}') {
                        const wavelengths = data.wavelengths;
                        const datasets = Object.entries(data.spectra).map(([type, spectrum], index) => {
                            return {
                                label: `${type} - ${new Date(spectrum.Timestamp * 1000).toLocaleString()}`,
                                data: spectrum.Values,
                                borderColor: colors[index % colors.length],
                                backgroundColor: colors[index % colors.length],
                                fill: false
                            };
                        });
                        setChartData({
                            labels: wavelengths,
                            datasets
                        });
                        setLoading(false)
                    } else {
                        setError(`There is no spectrum in database associated with the current reaction of sensor (${currentReactionName})`)
                    }
                })
                .catch(error => console.error("Error fetching spectra data:", error));
        }
    }, [currentReactionName]);

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">LAST SPECTRUM OF CURRENT REACTION</h2>
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                {!error ? (
                    <>
                        {!loading && chartData ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <p>Loading...</p>
                        )}
                    </>
                ) : (
                    <>
                        <p>{error}</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default LastSpectrum;
