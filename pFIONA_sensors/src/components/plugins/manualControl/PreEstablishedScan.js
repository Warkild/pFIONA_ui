import React, {useEffect, useState} from 'react';
import Select from 'react-select';
import Alert from "../universal/Alert";

function PreEstablishedScan({inAction, setInAction, handleSpecFinish}) {

    // This component is used to manage pre-established scan (blank / sample / standard) for a selected reaction


    /**
     * ALERT MESSAGE
     */

        // Alert box state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Alert box error message

    const [alertModalText, setAlertModalText] = useState("");

    // Alert box close
    const closeModal = () => {
        setIsModalOpen(false);
    };


    /** PREESTABLISHED SCAN COMP **/

        // List of reactions from database
    const [reactionNames, setReactionNames] = useState([]);

    // Selected reaction by user
    const [selectedReaction, setSelectedReaction] = useState(null);

    // Fetch the reaction names from the Django's API
    useEffect(() => {
        fetch(`/api/get_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => setReactionNames(data.reaction_names))
            .catch(error => console.error('Error fetching reaction names:', error));
    }, [sensor_id]);

    // Function do change selected reaction when new reaction is selected
    const handleReactionChange = (selectedOption) => {
        setSelectedReaction(selectedOption);
    };

    // Launch scan in sensor
    const launchScan = (scanType) => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                const url = `http://${sensor_ip}:${sensor_port}/sensor/save_${scanType}_spectrum`;
                setInAction(true);
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        "reaction_to_do": selectedReaction.value,
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(errorData => {
                                throw new Error(`Network response was not ok: ${errorData.message}`);
                            });
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
                        setInAction(false);
                        setAlertModalText(error.message);
                        setIsModalOpen(true);
                    });
            } catch (error) {
                setAlertModalText(error.message);
                setIsModalOpen(true);
            }
        }

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
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

export default PreEstablishedScan;
