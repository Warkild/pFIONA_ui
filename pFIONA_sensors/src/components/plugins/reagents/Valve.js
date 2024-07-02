import React, { useState, useEffect } from "react";
import Alert from "../universal/Alert";


function Valve({ reagents }) { // Define Valve component with ip and reagents as props
    const [connected, setConnected] = useState(false); // State to track connection status
    const [nbPort, setNbPort] = useState(0); // State to track number of ports
    // Initialise les ports sélectionnés basés sur les réactifs reçus
    const [selectedPorts, setSelectedPorts] = useState(() => // State for selected ports
        Array.from({ length: 8 }, (_, index) => { // Initialize array with 8 elements
            // Trouve le réactif qui correspond au port (index + 1), sinon retourne 'none'
            const foundReagent = reagents.find(reagent => reagent.port === index + 1); // Find reagent by port
            return foundReagent ? foundReagent.id : "none"; // Return reagent id or 'none'
        })
    );
    const [error, setError] = useState(-1); // State to handle errors
    const [saveText, setSaveText] = useState("Save"); // State for save button text

    const getNbPorts = () => { // Function to get number of ports
        const url = `http://${sensor_ip}:${sensor_port}/valve/get_numbers_valves`; // URL to fetch number of valves
        fetch(url, {
            method: 'GET', // HTTP method
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`, // Authorization header
                'Content-Type': 'application/json', // Content type
            },
        })
        .then(response => { // Handle response
            if (!response.ok) { // Check if response is not ok
                throw new Error('Network response was not ok'); // Throw error
            }
            return response.json(); // Parse response JSON
        })
        .then(data => { // Handle data
            console.log('Success:', data); // Log success message
            setNbPort(data.message); // Set number of ports
            setSelectedPorts(Array.from({ length: data.message }, (_, index) => { // Initialize selected ports
                const foundReagent = reagents.find(reagent => reagent.port === index + 1); // Find reagent by port
                return foundReagent ? foundReagent.id : "none"; // Return reagent id or 'none'
            }));
            setError(null); // Reset error state
        })
        .catch(error => { // Handle error
            console.error('Error:', error); // Log error
            setError('Unable to connect. Please check your connection and try again.'); // Update error state
        });
    };

    useEffect(() => { // Effect to fetch number of ports
        getNbPorts(); // Fetch number of ports
        console.log(reagents); // Log reagents
    }, [reagents]); // Add reagents as dependency

    const handleSelectChange = (value, index) => { // Function to handle select change
        const newSelectedPorts = [...selectedPorts]; // Copy selected ports array
        newSelectedPorts[index] = value; // Update selected port value
        setSelectedPorts(newSelectedPorts); // Set new selected ports
    };

    const handleSave = () => { // Function to handle save
        if (checkForDuplicates(selectedPorts)) { // Check for duplicates
            setSaveText("Saving..."); // Update save button text
            fetch(`/sensors/${reagents[0].sensor_id}/reagents/update_valve`, { // Fetch to update valve
                method: 'POST', // HTTP method
                headers: {
                    'Content-Type': 'application/json', // Content type
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`, // Authorization header
                },
                body: JSON.stringify(selectedPorts) // Request body
            })
            .then(response => response.json()) // Parse response JSON
            .then(data => { // Handle data
                console.log('Success:', data); // Log success message
                sensorUpdateReagent(); // Update reagent
            })
            .catch(error => { // Handle error
                console.error('Error:', error); // Log error
            });
        } else { // If duplicates found
            setIsModalOpen(true); // Open modal
        }
    };

    function checkForDuplicates(array) { // Function to check for duplicates
        const counts = {}; // Object to count occurrences

        for (const item of array) { // Loop through array
            if (item !== "none") { // Check if item is not 'none'
                if (counts[item]) { // Check if item already counted
                    return false; // Return false if duplicate found
                }
                counts[item] = 1; // Count item
            }
        }

        return true; // Return true if no duplicates
    }

    /** UPDATE REAGENTS **/

    function sensorUpdateReagent() { // Function to update reagents
        const url = `http://${sensor_ip}:${sensor_port}/sensor/reload_reagents`; // URL to reload reagents
        fetch(url, {
            method: 'POST', // HTTP method
            headers: {
                'Content-Type': 'application/json', // Content type
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`, // Authorization header
            },
        })
        .then(response => response.json()) // Parse response JSON
        .then(data => { // Handle data
            console.log('Success:', data); // Log success message
            window.location.reload(); // Reload window
        })
        .catch(error => { // Handle error
            console.error('Error:', error); // Log error
        });
    }

    /** ALERT BOX **/

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

    const closeModal = () => { // Function to close modal
        setIsModalOpen(false); // Set modal state to closed
    };

    /** AUTOMATION **/

    const checkStatus = () => { // Function to check status
        if (sessionStorage.getItem('accessToken') != null) { // Check if access token is available
            const url = `http://${sensor_ip}:${sensor_port}/sensor/get_state`; // URL to get state
            fetch(url, {
                method: 'GET', // HTTP method
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`, // Authorization header
                    'Content-Type': 'application/json', // Content type
                },
            })
                .then(response => { // Handle response
                    if (!response.ok) { // Check if response is not ok
                        throw new Error('Network response was not ok'); // Throw error
                    }
                    return response.json(); // Parse response JSON
                })
                .then(data => { // Handle data
                    console.log('Success:', data); // Log success message
                    setConnected(true); // Set connected state to true
                    setError(null); // Reset error state
                })
                .catch(error => { // Handle error
                    console.error('Error:', error); // Log error
                    setConnected(false); // Set connected state to false
                    setError(-1); // Set error state
                });
        }
    };

    useEffect(() => { // Effect to check status on mount
        checkStatus(); // Check status

        const intervalId = setInterval(() => { // Set interval to check status
            checkStatus(); // Check status
        }, 5000); // Every 5 seconds

        return () => clearInterval(intervalId); // Clear interval on unmount
    }, []);

    useEffect(() => { // Effect to get number of ports when connected changes
        getNbPorts(); // Get number of ports
    }, [connected]); // Dependency array

    return (
    <div className="w-full">
        <div className="mb-5">
            <h2 className="font-poppins font-bold text-gray-500 text-sm">VALVE</h2>
        </div>
        <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
            {connected ? (
                <>
                    <div className="flex flex-row flex-wrap justify-between">
                        {Array.from({length: nbPort}, (_, index) => (
                            <div key={index} className="w-5/12 pb-5">
                                <label htmlFor={`port-select-${index}`} className="block text-sm font-medium text-gray-700">
                                    Port {index + 1}
                                </label>
                                <select id={`port-select-${index}`}
                                        value={selectedPorts[index]}
                                        onChange={(e) => handleSelectChange(e.target.value, index)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                    <option value="none">-- nothing --</option>
                                    {reagents.map((reagent) => (
                                        <option key={reagent.id} value={reagent.id}>
                                            {reagent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-400 rounded-lg text-white font-poppins py-2 px-7 text-sm">{saveText}</button>
                </>
            ) : (
                <p>You must be connected to the sensor to modify the ports</p>
            )}
        </div>
        <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={"The same reagent is present in two different ports."}/>
    </div>
);

}

export default Valve;
