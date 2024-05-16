import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import Alert from "./plugins/Alert";

/**
 * Reaction add application
 *
 * @returns {JSX.Element}
 * @constructor
 */
function ReactionAddApp() {

    /**
     * VARIABLES
     */

    /**
     * TODO: 16/05/2024 : Kylian à changer les volumetoadd en steps, code à modifier pour plus de visibilité en lecture
     */

        // List of reagents selected in the UI
    const [reactionReagents, setReactionReagents] = useState([{reagentId: "", volume: ""}]);

    // Reaction name in the UI
    const [reactionName, setReactionName] = useState("");

    // Reaction wait time in the UI
    const [reactionWaitTime, setReactionWaitTime] = useState(0);

    // Reaction standard reagent ID in the UI
    const [standardReagentId, setStandardReagentId] = useState("");

    // Reaction standard concentration in the UI
    const [standardConcentration, setStandardConcentration] = useState(0);

    // Split the list of reagents passed by Django in two lists
    const true_reagents = reagents_json.filter(reagent => reagent.is_standard === false);
    const standard_reagents = reagents_json.filter(reagent => reagent.is_standard === true);


    /**
     * Change the list of reagents for the reaction when user interact with the UI
     *
     * @param index
     * @param field
     * @param value
     */
    const handleChange = (index, field, value) => {
        const newReagents = reactionReagents.map((item, i) => {
            if (i === index) {
                return {...item, [field]: value};
            }
            return item;
        });
        setReactionReagents(newReagents);
    };

    useEffect(() => {
        const lastReagent = reactionReagents[reactionReagents.length - 1];
        if (lastReagent.reagentId && lastReagent.volume) {
            setReactionReagents([...reactionReagents, {reagent_id: "", volume: ""}]);
        }
    }, [reactionReagents]);

    /**
     * Remove the reagent when user click on 'remove' button
     * @param index
     */
    const handleRemoveReagent = (index) => {
        setReactionReagents(reactionReagents.filter((_, i) => i !== index));
    };


    /**
     * Save the data in the database with Django API
     */
    const handleSave = () => {
        const reagentData = reactionReagents.map(reagent => [reagent.reagentId, reagent.volume]);
        reagentData.pop(); // Remove the last placeholder entry
        const reactionData = {
            name: reactionName,
            steps: reagentData,
            wait_time: reactionWaitTime,
            standard_reagent_id: standardReagentId,
            standard_concentration: standardConcentration
        };

        const apiUrl = "/api/add_reaction"; // Your Django API URL

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add other headers here if needed, like authentication tokens
            },
            body: JSON.stringify(reactionData)
        })
            .then(response => response.json().then(data => {
                if (!response.ok) {
                    // Throw an error with the message from the server
                    throw new Error(data.message || 'Unknown error');
                }
                return data;
            }))
            .then(data => {
                if (data.status === 'error') {
                    setAlertModalText(data.message);
                    setIsModalOpen(true);
                } else {
                    console.log("Success:", data);
                    window.location.href = `http://127.0.0.1:8000/sensors/${reagents_json[0]['sensor_id']}/reagents`;
                }
            })
            .catch(error => {
                console.error("Error:", error);
                setAlertModalText(error.message); // Use error.message to show the message from Django
                setIsModalOpen(true);
            });
    };

    /** ALERT BOX **/
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alertModalText, setAlertModalText] = useState("");

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">ADD REACTION</h2>
            </div>
            <div className="flex flex-row flex-wrap font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
                <div className={"pb-8 w-full flex flex-col"}>
                    <label className={"font-montserrat text-sm pb-2"}>Name</label>
                    <input
                        type="text"
                        value={reactionName}
                        onChange={(e) => setReactionName(e.target.value)}
                        placeholder="Reaction Name"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                </div>
                <div className="flex flex-col space-y-4 w-full pb-10">
                    <label className={"font-montserrat text-sm pb-2"}>Actions</label>
                    {reactionReagents.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                            <select
                                value={item.reagentId}
                                onChange={(e) => handleChange(index, "reagentId", e.target.value)}
                                className="mt-1 block w-8/12 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Select a Reagent</option>
                                <option value="w">Wait</option>
                                {true_reagents.map((reagent) => (
                                    <option key={reagent.id} value={reagent.id}>
                                        Add {reagent.name}
                                    </option>
                                ))}
                            </select>
                            <div className={"w-1/12"}></div>
                            <input
                                type="number"
                                value={item.volume}
                                onChange={(e) => handleChange(index, "volume", e.target.value)}
                                placeholder="Volume (μL) / Time (s)"
                                className="mt-1 remove-arrow block w-2/12 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                            {index !== reactionReagents.length - 1 && (
                                <button
                                    onClick={() => handleRemoveReagent(index)}
                                    className="text-red-700 px-4 py-2 w-1/12"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex flex-col space-y-4 w-full pb-10">
                    <div className={"flex flex-row justify-between"}>
                        <div className={"flex flex-col w-8/12"}>
                            <label className={"font-montserrat text-sm pb-2"}>Standard Reagent</label>
                            <select
                                value={standardReagentId}
                                onChange={(e) => setStandardReagentId(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Select Standard Reagent</option>
                                {standard_reagents.map((reagent) => (
                                    <option key={reagent.id} value={reagent.id}>
                                        {reagent.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={"flex flex-col w-3/12"}>
                            <label className={"font-montserrat text-sm pb-2"}>Standard Concentration</label>
                            <input
                                type="number"
                                step="0.001"
                                value={standardConcentration}
                                onChange={(e) => setStandardConcentration(e.target.value)}
                                placeholder="Standard Concentration (molarity)"
                                className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <div className={"pb-8 w-full flex flex-col"}>
                    <label className={"font-montserrat text-sm pb-2"}>Wait Time</label>
                    <input
                        type="number"
                        value={reactionWaitTime}
                        onChange={(e) => setReactionWaitTime(e.target.value)}
                        placeholder="Reaction Wait Time"
                        className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="bg-lime-500 text-white font-poppins px-8 py-2 mb-2 rounded-md hover:bg-lime-300"
                >
                    Save Reaction
                </button>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

const reagentsDiv = document.getElementById("reaction_add_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReactionAddApp/>);
}
