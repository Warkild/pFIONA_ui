// Importing React and useEffect, useState hooks from the react library
import React, { useEffect, useState } from 'react';

// Defining the DeployStatesInformation functional component with no props
function DeployStatesInformation({}) {

    // State to store the list of states
    const [states, setStates] = useState([]);

    // Dictionary to map state names to their corresponding numbers
    const stateDict = {
        'Boot': 0,
        'Flush': 1,
        'Mix': 2,
        'Change_Valve': 3,
        'Scan': 4,
        'Pump_Sample_from_ocean': 5,
        'Push_to_flow_cell': 6,
        'Multi_standard_spectrum': 7,
        'Wait': 8,
        'Darkspectrum': 9,
        'Idle': 10,
        'Reference_spectrum': 11,
        'Blank_spectrum': 12,
        'Sample_spectrum': 13,
        'Standard_spectrum': 14,
        'Deployed': 15,
        'Sleep': 16,
        'Shutdown': 17,
        'Stop_deploying_in_progress': 18,
        'Error': 19,
    };

    // Dictionary to map state names to their corresponding CSS classes for background colors
    const stateColors = {
        'Boot': 'bg-green-300',
        'Flush': 'bg-purple-500',
        'Mix': 'bg-purple-500',
        'Change_Valve': 'bg-purple-500',
        'Scan': 'bg-purple-500',
        'Pump_Sample_from_ocean': 'bg-purple-500',
        'Push_to_flow_cell': 'bg-purple-500',
        'Multi_standard_spectrum': 'bg-purple-500',
        'Wait': 'bg-yellow-500',
        'Stop_deploying_in_progress': 'bg-yellow-500',
        'Darkspectrum': 'bg-black',
        'Idle': 'bg-green-500',
        'Reference_spectrum': 'bg-blue-500',
        'Blank_spectrum': 'bg-blue-500',
        'Sample_spectrum': 'bg-blue-500',
        'Standard_spectrum': 'bg-blue-500',
        'Deployed': 'bg-green-500',
        'Sleep': 'bg-gray-500',
        'Shutdown': 'bg-red-500',
        'Error': 'bg-red-500',
    };

    // Function to fetch the last states from the server
    const getSensorLastStates = () => {
        fetch(`/api/get_last_states?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                // Handling unsuccessful response
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handling successful response
            console.log('Success:', data);
            setStates(data.data);
        })
        .catch(error => {
            // Handling fetch errors
            console.error('Error:', error);
        });
    };

    // useEffect to run the getSensorLastStates function on component mount and periodically
    useEffect(() => {
        getSensorLastStates();

        // Setting up an interval to periodically fetch the last states
        const intervalId = setInterval(() => {
            getSensorLastStates();
        }, 1000);

        // Clearing the interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // Mapping the states to a list of JSX elements
    const stateList = states.map(state => {
        // Finding the state name based on the state number
        const stateText = Object.keys(stateDict).find(key => stateDict[key] === state);
        // Getting the corresponding color for the state
        const stateColor = stateColors[stateText];
        return (
            <div className="flex flex-row items-center" key={state}>
                <div className={`w-5 h-5 rounded-full mr-2 ${stateColor}`}></div>
                <p>{stateText}</p>
            </div>
        );
    });

    // Returning the JSX to render the component
    return (
        <div className="w-6/12">
            <div className="mb-5">
                {/* Heading for the Deploy States Information section */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">DEPLOY STATES INFORMATION</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-col space-y-2"}>
                    {stateList}
                </div>
            </div>
        </div>
    );
}

// Exporting the DeployStatesInformation component as default
export default DeployStatesInformation;
