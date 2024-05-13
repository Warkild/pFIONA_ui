import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Alert from "./plugins/Alert";

/**
 * Reaction add application
 *
 * @returns {JSX.Element}
 * @constructor
 */
function ReactionEditApp() {

    /**
     * VARIABLES
     */

    // List of reagents selected in the UI
    const [reactionReagents, setReactionReagents] = useState([{ reagent_id: "", volume: "" }]);

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
                return { ...item, [field]: value };
            }
            return item;
        });
        setReactionReagents(newReagents);
    };

    useEffect(() => {
        const lastReagent = reactionReagents[reactionReagents.length - 1];
        if (lastReagent.reagent_id && lastReagent.volume) {
            setReactionReagents([...reactionReagents, { reagent_id: "", volume: "" }]);
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
        const reagentData = reactionReagents.map(reagent => [reagent.reagent_id, reagent.volume]);
        reagentData.pop(); // Remove the last placeholder entry
        const reactionData = {
            id: reaction_json['id'],
            name: reactionName,
            reagents: reagentData,
            wait_time: reactionWaitTime,
            standard_reagent_id: standardReagentId,
            standard_concentration: standardConcentration
        };

        if (reactionName === "") {
            setAlertModalText("The reaction must have a name");
            setIsModalOpen(true);
        } else if (reagentData.length === 0 || reagentData[0].volume === "" || reagentData[0].reagent_id === "") {
            setAlertModalText("At least one reagent must be correctly entered.");
            setIsModalOpen(true);
        } else if (reactionData.standard_reagent_id === "")  {
            setAlertModalText("Standard Reagent must be selected")
            setIsModalOpen(true)
        } else {
            const apiUrl = `/sensors/api/edit_reaction`; // Your Django API URL

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add other headers here if needed, like authentication tokens
                },
                body: JSON.stringify(reactionData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Success:", data)
                    window.location.href = `http://127.0.0.1:8000/sensors/${reagents_json[0]['sensor_id']}/reagents`;
                })
                .catch(error => console.error("Error:", error));
        }
    };

    /** ALERT BOX **/
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alertModalText, setAlertModalText] = useState("");

    const closeModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        console.log(reaction_json)
        setReactionName(reaction_json['name'])
        setReactionWaitTime(reaction_json['wait'])
        setStandardConcentration(reaction_json['standard_concentration'])
        setStandardReagentId(reaction_json['standard_id'])
        setReactionReagents(reaction_json['actions'].map(action => ({
            reagent_id: action.reagent_id,
                volume: action.volume
        })));
    }, []);


    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">EDIT REACTION</h2>
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
                                value={item.reagent_id}
                                onChange={(e) => handleChange(index, "reagent_id", e.target.value)}
                                className="mt-1 block w-8/12 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Select a Reagent</option>
                                {true_reagents.map((reagent) => (
                                    <option key={reagent.id} value={reagent.id}>
                                        {reagent.name}
                                    </option>
                                ))}
                            </select>
                            <div className={"w-1/12"}></div>
                            <input
                                type="number"
                                value={item.volume}
                                onChange={(e) => handleChange(index, "volume", e.target.value)}
                                placeholder="Volume (μL)"
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

const reagentsDiv = document.getElementById("reaction_edit_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReactionEditApp/>);
}
