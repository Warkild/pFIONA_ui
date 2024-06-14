import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function DeployTransport({ }) {
    const [reagents, setReagents] = useState([]);
    const [selectedReagents, setSelectedReagents] = useState([]);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/get_current_reagents_for_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === "success" && data.reaction_names) {
                    const reagentOptions = data.reaction_names.map(reagent => ({
                        value: reagent,
                        label: reagent
                    }));
                    // Ajoutez "sample" à la liste des réactifs
                    const sampleReagent = { value: "sample", label: "sample" };
                    const updatedReagents = [...reagentOptions, sampleReagent];

                    setReagents(updatedReagents);
                    setSelectedReagents(updatedReagents);  // Preselect all reagents including "sample"
                }
            })
            .catch(error => console.error('Error fetching reagents:', error));
    }, [sensor_id]);

    const handlePrimePorts = () => {
        const selectedReagentNames = selectedReagents.map(reagent => reagent.value);
        const requestBody = {
            reagents: selectedReagentNames
        };

        fetch(`http://${sensor_ip}/sensor/valve_port_priming`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    const handleFlushAllPorts = () => {
        fetch(`http://${sensor_ip}/sensor/flush_all_ports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <div className="w-5/12">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">BASIC TRANSPORT</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-col"}>
                    <Select
                    options={reagents}
                    isMulti
                    value={selectedReagents}
                    onChange={setSelectedReagents}
                    />
                    <button
                        onClick={handlePrimePorts}
                        className="bg-blue-600 mt-5 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400"
                    >
                        Prime Ports
                    </button>
                    <button
                        onClick={handleFlushAllPorts}
                        className="bg-blue-600 mt-5 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400"
                    >
                        Flush All Ports
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeployTransport;
