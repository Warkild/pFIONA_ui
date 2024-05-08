import React, { useState, useEffect } from "react";
import Alert from "../Alert";

function Valve({ ip, reagents }) {
    const [nbPort, setNbPort] = useState(0);
    // Initialise les ports sélectionnés basés sur les réactifs reçus
    const [selectedPorts, setSelectedPorts] = useState(() =>
        Array.from({length: 8}, (_, index) => {
            // Trouve le réactif qui correspond au port (index + 1), sinon retourne 'none'
            const foundReagent = reagents.find(reagent => reagent.port === index + 1);
            return foundReagent ? foundReagent.id : "none";
        })
    );
    const [error, setError] = useState(-1);  // Ajout d'un état pour gérer les erreurs

    const getNbPorts = () => {
        fetch(`http://${ip}:5000/valve/get_numbers_valves`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
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
            setError(null);  // Réinitialiser l'erreur en cas de succès
        })
        .catch(error => {
            console.error('Error:', error);
            setError('Unable to connect. Please check your connection and try again.');  // Mettre à jour l'état d'erreur
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
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
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
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
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

    /** AUTOMATION **/

    useEffect(() => {
        getNbPorts();

        const intervalId = setInterval(() => {

            getNbPorts();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return (
    <div className="w-full">
        <div className="mb-5">
            <h2 className="font-poppins font-bold text-gray-500 text-sm">VALVE</h2>
        </div>
        <div className="font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
            {error ? (
                <p>You must be connected to the sensor to modify the ports</p>
            ) : (
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
                    <button onClick={handleSave} className="bg-blue-600 rounded-lg text-white font-poppins py-2 px-7 text-sm">Save</button>
                </>
            )}
        </div>
        <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={"The same reagent is present in two different ports."}/>
    </div>
);

}

export default Valve;
