import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function DeployTransport({connected}) {
    const [reagents, setReagents] = useState([]);
    const [selectedReagents, setSelectedReagents] = useState([]);
    const [primePortsClicked, setPrimePortsClicked] = useState(false);
    const [flushPortsClicked, setFlushPortsClicked] = useState(false);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/get_current_reagents_for_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === "success" && data.reaction_names) {
                    const reagentOptions = data.reaction_names.map(reagent => ({
                        value: reagent,
                        label: reagent
                    }));
                    const sampleReagent = { value: "sample", label: "sample" };
                    const updatedReagents = [...reagentOptions, sampleReagent];

                    setReagents(updatedReagents);
                    setSelectedReagents(updatedReagents);
                }
            })
            .catch(error => console.error('Error fetching reagents:', error));
    }, [sensor_id]);

    const handlePrimePorts = () => {
        if (!primePortsClicked) {
            setPrimePortsClicked(true);
            setTimeout(() => setPrimePortsClicked(false), 3000); // Reset after 3 seconds
            return;
        }

        const selectedReagentNames = selectedReagents.map(reagent => reagent.value);
        const requestBody = {
            reagents: selectedReagentNames
        };

        fetch(`http://${sensor_ip}:5000/sensor/valve_port_priming`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            setPrimePortsClicked(false);
        })
        .catch(error => {
            console.error('Error:', error);
            setPrimePortsClicked(false);
        });
    };

    const handleFlushAllPorts = () => {
        if (!flushPortsClicked) {
            setFlushPortsClicked(true);
            setTimeout(() => setFlushPortsClicked(false), 3000); // Reset after 3 seconds
            return;
        }

        fetch(`http://${sensor_ip}/sensor/flush_all_ports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            setFlushPortsClicked(false);
        })
        .catch(error => {
            console.error('Error:', error);
            setFlushPortsClicked(false);
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
                        className={`mt-5 rounded-lg font-poppins py-2 px-7 text-sm ${connected ? "bg-blue-600 hover:bg-blue-400 text-white" : "text-gray-600 bg-gray-300"}`}
                        disabled={!connected}
                    >
                        {primePortsClicked ? 'Click again to confirm' : 'Prime Ports'}
                    </button>
                    <button
                        onClick={handleFlushAllPorts}
                        className={`mt-5 rounded-lg font-poppins py-2 px-7 text-sm ${connected ? "bg-blue-600 hover:bg-blue-400 text-white" : "text-gray-600 bg-gray-300"}`}
                    >
                        {flushPortsClicked ? 'Click again to confirm' : 'Flush All Ports'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeployTransport;
