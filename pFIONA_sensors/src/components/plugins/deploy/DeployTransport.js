import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function DeployTransport({ connected, isDeployed}) {
    // State for reagents options in the select dropdown
    const [reagents, setReagents] = useState([]);
    // State for selected reagents in the select dropdown
    const [selectedReagents, setSelectedReagents] = useState([]);
    // State for tracking if prime ports button is clicked
    const [primePortsClicked, setPrimePortsClicked] = useState(false);
    // State for tracking if flush ports button is clicked
    const [flushPortsClicked, setFlushPortsClicked] = useState(false);
    // State for tracking if prime ports operation is ongoing
    const [isPrimePort, setIsPrimePort] = useState(false);
    // State for tracking if flush ports operation is ongoing
    const [isFlushPort, setIsFlushPort] = useState(false);

    // useEffect to fetch reagents when component mounts or sensor_id changes
    useEffect(() => {
        async function fetchReagents() {
            try {
                // Fetch current reagents for the current reaction
                const currentReagentsResponse = await fetch(`/api/get_current_reagents_for_current_reaction/${sensor_id}`);
                const currentReagentsData = await currentReagentsResponse.json();

                // Fetch active ports names
                const activePortsResponse = await fetch(`/api/get_active_ports_names?sensor_id=${sensor_id}`);
                const activePortsData = await activePortsResponse.json();

                // Check if both API calls were successful
                if (currentReagentsData.status === "success" && activePortsData.status === "success") {
                    // Map current reagents to the format required by react-select
                    const currentReagents = currentReagentsData.reaction_names.map(reagent => ({
                        value: reagent,
                        label: reagent
                    }));

                    // Map active ports to the format required by react-select
                    const activePorts = activePortsData.data.map(reagent => ({
                        value: reagent,
                        label: reagent
                    }));

                    // Combine current reagents and active ports, excluding duplicates
                    const combinedReagents = [
                        ...activePorts.filter(activeReagent => !currentReagents.some(currentReagent => currentReagent.value === activeReagent.value)),
                        ...currentReagents
                    ];

                    // Check if "waste" is in the active ports and add it to the selected reagents if present
                    if (activePortsData.data.includes("waste")) {
                        const wasteReagent = { value: "waste", label: "waste" };
                        combinedReagents.push(wasteReagent);
                        setSelectedReagents([...currentReagents, wasteReagent]);
                    } else {
                        // Otherwise, just set the current reagents as selected
                        setSelectedReagents(currentReagents);
                    }

                    // Update the reagents state with the combined reagents
                    setReagents(combinedReagents);
                }
            } catch (error) {
                console.error('Error fetching reagents or active ports:', error);
            }
        }

        // Call the fetchReagents function
        fetchReagents();
    }, [sensor_id]);

    // Function to handle prime ports button click
    const handlePrimePorts = () => {
        // Check if button is clicked for the first time
        if (!primePortsClicked) {
            // Set primePortsClicked state to true
            setPrimePortsClicked(true);
            // Reset state after 3 seconds
            setTimeout(() => setPrimePortsClicked(false), 3000);
            return;
        }

        // Get selected reagent names from selectedReagents state
        const selectedReagentNames = selectedReagents.map(reagent => reagent.value);
        const requestBody = {
            reagents: selectedReagentNames
        };

        // Set isPrimePort state to true
        setIsPrimePort(true);
        // Send POST request to prime ports
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
            // Reset primePortsClicked and isPrimePort states
            setPrimePortsClicked(false);
            setIsPrimePort(false);
        })
        .catch(error => {
            console.error('Error:', error);
            // Reset primePortsClicked and isPrimePort states
            setPrimePortsClicked(false);
            setIsPrimePort(false);
        });
    };

    // Function to handle flush all ports button click
    const handleFlushAllPorts = () => {
        // Check if button is clicked for the first time
        if (!flushPortsClicked) {
            // Set flushPortsClicked state to true
            setFlushPortsClicked(true);
            // Reset state after 3 seconds
            setTimeout(() => setFlushPortsClicked(false), 3000);
            return;
        }

        // Get selected reagent names from selectedReagents state
        const selectedReagentNames = selectedReagents.map(reagent => reagent.value);
        const requestBody = {
            reagents: selectedReagentNames
        };

        // Set isFlushPort state to true
        setIsFlushPort(true);
        // Send POST request to flush ports
        fetch(`http://${sensor_ip}:5000/sensor/valve_port_flushing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // Reset flushPortsClicked and isFlushPort states
            setFlushPortsClicked(false);
            setIsFlushPort(false);
        })
        .catch(error => {
            console.error('Error:', error);
            // Reset flushPortsClicked and isFlushPort states
            setFlushPortsClicked(false);
            setIsFlushPort(false);
        });
    };

    return (
        <div className="w-5/12">
            <div className="mb-5">
                {/* Section title */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">TRANSPORT</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"flex flex-col"}>
                    {/* React-select dropdown for reagents */}
                    <Select
                        options={reagents} // Set options for react-select
                        isMulti // Allow multiple selections
                        value={selectedReagents} // Set selected options
                        onChange={setSelectedReagents} // Handle changes
                    />
                    {/* Prime ports button */}
                    <button
                        onClick={handlePrimePorts} // Handle prime ports button click
                        className={`mt-5 rounded-lg font-poppins py-2 px-7 text-sm ${
                            !connected || isDeployed || isFlushPort 
                                ? "text-gray-600 bg-gray-300" // Disabled state styles
                                : isPrimePort 
                                    ? "bg-lime-500 text-white" // Active state styles
                                    : "bg-blue-600 hover:bg-blue-400 text-white" // Default state styles
                        }`}
                        disabled={!connected || isDeployed || isFlushPort || isPrimePort } // Disable button based on conditions
                    >
                        {isPrimePort ? 'Priming port' : primePortsClicked ? 'Click again to confirm' : 'Prime Ports'}
                    </button>
                    {/* Flush all ports button */}
                    <button
                        onClick={handleFlushAllPorts} // Handle flush all ports button click
                        className={`mt-5 rounded-lg font-poppins py-2 px-7 text-sm ${
                            !connected || isDeployed || isPrimePort 
                                ? "text-gray-600 bg-gray-300" // Disabled state styles
                                : isFlushPort 
                                    ? "bg-lime-500 text-white" // Active state styles
                                    : "bg-blue-600 hover:bg-blue-400 text-white" // Default state styles
                        }`}
                        disabled={!connected || isDeployed || isFlushPort || isPrimePort } // Disable button based on conditions
                    >
                        {isFlushPort ? 'Flushing Port' : flushPortsClicked ? 'Click again to confirm' : 'Flush All Ports'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeployTransport;
