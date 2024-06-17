import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import Alert from "../plugins/universal/Alert";

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
    const [reactionReagents, setReactionReagents] = useState([{reagent_id: "", number: ""}]);

    // Reaction name in the UI
    const [reactionName, setReactionName] = useState("");

    // Reaction standard reagent ID in the UI
    const [standardReagentId, setStandardReagentId] = useState("");

    // Reaction standard concentration in the UI
    const [standardConcentration, setStandardConcentration] = useState(0);

    // Split the list of reagents passed by Django in two lists
    const true_reagents = reagents_json.filter(reagent => reagent.is_standard === false);
    const standard_reagents = reagents_json.filter(reagent => reagent.is_standard === true);

    // Volumes
    const [volumeOfMixture, setVolumeOfMixture] = useState(0);
    const [volumeToPushToFlowCell, setVolumeToPushToFlowCell] = useState(0);

    // Monitored Wavelength
    const [wavelengthMonitored, setWavelengthMonitored] = useState("");

    // CYCLE ANALYSIS
    const [numberOfBlank, setNumberOfBlank] = useState(0);
    const [numberOfSample, setNumberOfSample] = useState(0);
    const [numberOfStandard, setNumberOfStandard] = useState(0);
    const [multiStandard, setMultiStandard] = useState(false);
    const [multiStandardTime, setMultiStandardTime] = useState(0);

    // REACTION TIME
    const [reactionTime, setReactionTime] = useState(0);


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
        if (lastReagent.reagent_id && lastReagent.number) {
            setReactionReagents([...reactionReagents, {reagent_id: "", number: ""}]);
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
        const reagentData = reactionReagents.map(reagent => [reagent.reagent_id, reagent.number]);
        reagentData.pop(); // Remove the last placeholder entry
        const reactionData = {
            id: reaction_json['id'],
            name: reactionName,
            steps: reagentData,
            standard_reagent_id: standardReagentId,
            standard_concentration: standardConcentration,
            volume_of_mixture: volumeOfMixture,
            volume_to_push_to_flow_cell: volumeToPushToFlowCell,
            monitored_wavelength: wavelengthMonitored,
            number_of_blank: numberOfBlank,
            number_of_sample: numberOfSample,
            number_of_standard: numberOfStandard,
            multi_standard: multiStandard,
            multi_standard_time: multiStandardTime,
            reaction_time: reactionTime
        };

        const apiUrl = "/api/edit_reaction"; // Your Django API URL

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

    useEffect(() => {
        console.log(reaction_json)
        setReactionName(reaction_json['name'])
        setStandardConcentration(reaction_json['standard_concentration'])
        setStandardReagentId(reaction_json['standard_id'])
        setReactionReagents(reaction_json['actions'].map(action => ({
            reagent_id: action.reagent_id || "w",
            number: action.number
        })));
        setVolumeOfMixture(reaction_json['volume_of_mixture'])
        setVolumeToPushToFlowCell(reaction_json['volume_to_push_to_flow_cell'])
        setWavelengthMonitored(reaction_json['monitored_wavelengths'].join(';'))
        setNumberOfStandard(reaction_json['number_of_standard'])
        setNumberOfBlank(reaction_json['number_of_blank'])
        setNumberOfSample(reaction_json['number_of_sample'])
        setMultiStandard(reaction_json['multi_standard'])
        setMultiStandardTime(reaction_json['multi_standard_time'])
        setReactionTime(reaction_json['reaction_time'])
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
                                value={item.number}
                                onChange={(e) => handleChange(index, "number", e.target.value)}
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
                <div className="flex flex-col space-y-4 w-full pb-10">
                    <div className={"flex flex-row justify-between"}>
                        <div className={"flex flex-col w-5/12"}>
                            <label className={"font-montserrat text-sm pb-2"}>Volume of mixture (μL)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={volumeOfMixture}
                                onChange={(e) => setVolumeOfMixture(e.target.value)}
                                placeholder="Standard Concentration (molarity)"
                                className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                        <div className={"flex flex-col w-5/12"}>
                            <label className={"font-montserrat text-sm pb-2"}>Volume to push to flow cell (μL)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={volumeToPushToFlowCell}
                                onChange={(e) => setVolumeToPushToFlowCell(e.target.value)}
                                placeholder="Standard Concentration (molarity)"
                                className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-4 w-full pb-10">
                    <div className={"flex flex-row justify-between"}>
                        <div className={"flex flex-col w-full"}>
                            <label className={"font-montserrat text-sm pb-2"}>Reaction Time (s)</label>
                            <input
                                type="number"
                                value={reactionTime}
                                onChange={(e) => setReactionTime(e.target.value)}
                                placeholder="Reaction Time (s)"
                                className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-4 w-full pb-10">
                    <div className={"flex flex-row justify-between"}>
                        <div className={"flex flex-col w-full"}>
                            <label className={"font-montserrat text-sm pb-2"}>Monitored wavelength (nm) (separated by "
                                ; " (exemple : 880;1050))</label>
                            <input
                                type="text"
                                value={wavelengthMonitored}
                                onChange={(e) => setWavelengthMonitored(e.target.value)}
                                placeholder="Monitored wavelength (nm) (separated by ' ; ' (exemple : 880;1050))"
                                className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <div className={"flex flex-row justify-between w-full pb-10"}>
                    <div className={"flex flex-col w-3/12"}>
                        <label className={"font-montserrat text-sm pb-2"}>Number Of Blank</label>
                        <input
                            type="number"
                            value={numberOfBlank}
                            onChange={(e) => setNumberOfBlank(e.target.value)}
                            placeholder="Standard Concentration (molarity)"
                            className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                    <div className={"flex flex-col w-3/12"}>
                        <label className={"font-montserrat text-sm pb-2"}>Number Of Sample</label>
                        <input
                            type="number"
                            value={numberOfSample}
                            onChange={(e) => setNumberOfSample(e.target.value)}
                            placeholder="Standard Concentration (molarity)"
                            className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                    <div className={"flex flex-col w-3/12"}>
                        <label className={"font-montserrat text-sm pb-2"}>Number Of Standard</label>
                        <input
                            type="number"
                            value={numberOfStandard}
                            onChange={(e) => setNumberOfStandard(e.target.value)}
                            placeholder="Standard Concentration (molarity)"
                            className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
                <div className={"flex flex-row space-x-10 w-full pb-10"}>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                className={"form-checkbox focus:outline-none rounded-lg mr-3"}
                                checked={multiStandard}
                                onChange={(e) => setMultiStandard(e.target.checked)}
                            />
                            Multi Standard
                        </label>
                    </div>
                    <div className={"flex flex-col w-3/12"}>
                        <label className={"font-montserrat text-sm pb-2"}>Multi Standard Time</label>
                        <input
                            type="number"
                            value={multiStandardTime}
                            onChange={(e) => setMultiStandardTime(e.target.value)}
                            placeholder="Multi Standard Time"
                            className="mt-1 remove-arrow block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
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
