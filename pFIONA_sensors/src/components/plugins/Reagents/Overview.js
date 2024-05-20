import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

function Overview({reagents}) {
    const validReagents = reagents.filter(reagent => reagent.port !== null && reagent.volume_max > 0);

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">OVERVIEW</h2>
            </div>
            <div className="flex flex-row flex-wrap font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                {validReagents.length === 0 && <p className={"text-red-700"}>There is no active reagent</p>}
                {validReagents.map(reagent => (
                    <div className="graph-container" key={reagent.id}>
                        <DoughnutChart reagent={reagent} />
                        <p className={"font-montserrat text-center mt-5"}>{reagent.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DoughnutChart({ reagent }) {
    const data = {
        labels: ['Reagent', 'Empty'],
        datasets: [{
            data: [reagent.volume, reagent.volume_max - reagent.volume],
            backgroundColor: ['#2563eb', '#bcdef1'],
            hoverBackgroundColor: ['#4c7eec', '#dfedf8']
        }]
    };

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        }
    };

    return (
        <div>
            <Doughnut data={data} options={options} />
        </div>
    );
}


export default Overview;
