import React, { useState, useEffect } from "react";
import Alert from "../Alert";

function Valve({ ip, accessToken, reagents }) {
    const [nbPort, setNbPort] = useState(8);
    // Initialise les ports sélectionnés basés sur les réactifs reçus
    const [selectedPorts, setSelectedPorts] = useState(() =>
        Array.from({length: 8}, (_, index) => {
            // Trouve le réactif qui correspond au port (index + 1), sinon retourne 'none'
            const foundReagent = reagents.find(reagent => reagent.port === index + 1);
            return foundReagent ? foundReagent.id : "none";
        })
    );

    const getNbPorts = () => {
        fetch(`http://${ip}:5000/valve/get_numbers_valves`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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
            setNbPort(data.message);
            setSelectedPorts(Array.from({length: data.message}, (_, index) => {
                const foundReagent = reagents.find(reagent => reagent.port === index + 1);
                return foundReagent ? foundReagent.id : "none";
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    useEffect(() => {
        getNbPorts();
        console.log(reagents);
    }, [reagents]); // Ajouter reagents comme dépendance pour réinitialiser les ports quand les réactifs changent

    const handleSelectChange = (value, index) => {
        const newSelectedPorts = [...selectedPorts];
        newSelectedPorts[index] = value;
        setSelectedPorts(newSelectedPorts);
    };

    const handleSave = () => {

        if(checkForDuplicates(selectedPorts)) {
            fetch(`http://127.0.0.1:8000/sensors/${reagents[0].sensor_id}/reagents/update_valve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(selectedPorts)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                sensorUpdateReagent()
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            setIsModalOpen(true);
        }
    };

    function checkForDuplicates(array) {
        const counts = {};

        for (const item of array) {
            if (item !== "none") {
                if (counts[item]) {
                    return false;
                }
                counts[item] = 1;
            }
        }

        return true;
    }

    /** UPDATE REAGENTS **/

    function sensorUpdateReagent() {
         fetch(`http://${ip}:5000/sensor/reloading_reagents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    /** ALERT BOX **/

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false);

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">VALVE</h2>
            </div>
            <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
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
                <button onClick={handleSave} className="mt-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700">Save</button>

            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} />
        </div>
    );
}

export default Valve;
