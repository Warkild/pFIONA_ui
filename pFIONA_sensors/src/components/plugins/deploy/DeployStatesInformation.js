import React, { useEffect, useState } from 'react';

function DeployStatesInformation({}) {

    const [states, setStates] = useState([]);

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
        'Error': 18,
    };

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

    const getSensorLastStates = () => {
        fetch(`/api/get_last_states?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            setStates(data.data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    useEffect(() => {
        getSensorLastStates();

        const intervalId = setInterval(() => {
            getSensorLastStates();
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const stateList = states.map(state => {
        const stateText = Object.keys(stateDict).find(key => stateDict[key] === state);
        const stateColor = stateColors[stateText];
        return (
                <div className="flex flex-row items-center">
                    <div className={`w-5 h-5 rounded-full mr-2 ${stateColor}`}></div>
                    <p>{stateText}</p>
                </div>
        );
    });

    return (
        <div className="w-6/12">
            <div className="mb-5">
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

export default DeployStatesInformation;