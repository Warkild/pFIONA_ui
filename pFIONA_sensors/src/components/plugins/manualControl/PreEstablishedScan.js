import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import Alert from "../universal/Alert";

function PreEstablishedScan({ inAction, setInAction, handleSpecFinish }) {
    const [reactionNames, setReactionNames] = useState([]);
    const [selectedReaction, setSelectedReaction] = useState(null);

    // Fetch the reaction names from the API
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/get_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => setReactionNames(data.reaction_names))
            .catch(error => console.error('Error fetching reaction names:', error));
    }, [sensor_id]);

    const handleReactionChange = (selectedOption) => {
        setSelectedReaction(selectedOption);
    };

    const launchScan = (scanType) => {
        const url = `http://${SENSOR_IP}:5000/sensor/save_${scanType}_spectrum`;
        setInAction(true);
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
                "sample": 1,
                "reaction_to_do": selectedReaction,
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                setInAction(false); // Reset inAction after success
                handleSpecFinish();
            })
            .catch(error => {
                console.error('Error:', error);
                handleSpecFinish();
                setInAction(false);
            });
    };

    // Transform reactionNames to options for react-select
    const reactionOptions = reactionNames.map(name => ({
        value: name,
        label: name
    }));

    // Return HTML Code
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>PRE-ESTABLISHED SCAN</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 justify-between"}>
                <div className={"mb-5"}>
                    <Select
                        options={reactionOptions}
                        onChange={handleReactionChange}
                        value={selectedReaction}
                        placeholder="Select a reaction"
                    />
                </div>
                <div className={"flex flex-row space-x-8"}>
                    {["blank", "sample", "standard"].map(scanType => (
                        <button
                            key={scanType}
                            onClick={() => launchScan(scanType)}
                            disabled={inAction || !selectedReaction}
                            className={`rounded-lg font-poppins py-2 w-full ${inAction || !selectedReaction ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}>
                            {`Launch ${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PreEstablishedScan;
