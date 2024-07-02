import React from "react"; // Importing React library
import { Doughnut } from "react-chartjs-2"; // Importing Doughnut chart from react-chartjs-2
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'; // Importing necessary elements from chart.js

Chart.register(ArcElement, Tooltip, Legend); // Registering chart elements

function Overview({ reagents }) { // Defining Overview component that accepts 'reagents' as a prop
    const validReagents = reagents.filter(reagent => reagent.port !== null && reagent.volume_max > 0 || reagent.name === 'water'); // Filtering valid reagents

    return (
        <div className="w-full"> {/* Main container */}
            <div className="mb-5"> {/* Margin bottom */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">OVERVIEW</h2> {/* Title */}
            </div>
            <div className="flex flex-row flex-wrap font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"> {/* Flex container */}
                {validReagents.length === 0 && <p className={"text-red-700"}>There is no active reagent</p>} {/* Display message if no valid reagents */}
                {validReagents.map(reagent => ( // Mapping valid reagents to display Doughnut charts
                    <div className="graph-container" key={reagent.id}> {/* Graph container */}
                        <DoughnutChart reagent={reagent} /> {/* DoughnutChart component */}
                        <p className={"font-montserrat text-center mt-5"}>{reagent.name}</p> {/* Reagent name */}
                    </div>
                ))}
            </div>
        </div>
    );
}

function DoughnutChart({ reagent }) { // Defining DoughnutChart component that accepts 'reagent' as a prop
    const data = { // Data for Doughnut chart
        labels: ['Reagent', 'Empty'], // Labels for chart segments
        datasets: [{
            data: [reagent.volume, reagent.volume_max - reagent.volume], // Data values
            backgroundColor: ['#2563eb', '#bcdef1'], // Colors for chart segments
            hoverBackgroundColor: ['#4c7eec', '#dfedf8'] // Colors on hover
        }]
    };

    const options = { // Options for Doughnut chart
        maintainAspectRatio: false, // Disable maintaining aspect ratio
        responsive: true, // Enable responsiveness
        plugins: {
            legend: {
                display: false // Disable legend display
            }
        }
    };

    return (
        <div>
            <Doughnut data={data} options={options} /> {/* Rendering Doughnut chart with data and options */}
        </div>
    );
}

export default Overview; // Exporting Overview component
