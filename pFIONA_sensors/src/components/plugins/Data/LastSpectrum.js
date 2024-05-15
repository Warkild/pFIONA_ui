import React, { useEffect, useState } from "react";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

function LastSpectrum() {
    const [loading, setLoading] = useState(true);
    const [sensorId, setSensorId] = useState(1); // Mettre à jour en fonction de vos besoins
    const [currentReactionName, setCurrentReactionName] = useState(null);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

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
        fetch(`/api/get_current_reaction/${sensorId}`)
            .then(response => response.json())
            .then(data => {
                setCurrentReactionName(data.reaction_name);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching current reaction id:", error);
                setLoading(false);
            });
    }, [sensorId]);

    // Fetch last 5 spectra data once current reaction name is available
    useEffect(() => {
        if (!loading && currentReactionName) {
            const timestamp = new Date().getTime();
            fetch(`/api/get_last_spectrum_all_type_view?reaction_name=${currentReactionName}&timestamp=${timestamp}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.spectra) {
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
                    }
                })
                .catch(error => console.error("Error fetching spectra data:", error));
        }
    }, [currentReactionName, loading]);

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">LAST SPECTRUM</h2>
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                {!loading && chartData ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

export default LastSpectrum;
