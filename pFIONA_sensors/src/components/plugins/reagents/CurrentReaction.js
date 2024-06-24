import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function CurrentReaction({ reactions }) {
    const [currentReactionNames, setCurrentReactionNames] = useState([]);
    const [selectedReactionIds, setSelectedReactionIds] = useState([]);
    const [verifyConstraint, setVerifyConstraint] = useState(false);
    const [reactionValid, setReactionValid] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const reactionOptions = reactions.map(reaction => ({ value: reaction.id, label: reaction.name }));

    function checkReactionValid() {
        if (selectedReactionIds && selectedReactionIds.length > 0) {
            const queries = selectedReactionIds.map(option =>
                fetch(`/api/get_validity_reaction_to_set_as_current_reaction?reaction_id=${option.value}&sensor_id=${sensor_id}`).then(response => response.json())
            );

            Promise.all(queries)
                .then(results => {
                    const allValid = results.every(result => result.data);
                    setReactionValid(allValid);
                    setVerifyConstraint(false);
                })
                .catch(error => console.error("Error fetching current reaction ids:", error));
        } else {
            setVerifyConstraint(false);
        }
    }

    useEffect(() => {
        checkReactionValid();
    }, [selectedReactionIds]);

    useEffect(() => {
        if (reactions.length > 0) {
            fetch(`/api/get_current_reaction/${sensor_id}`)
                .then(response => response.json())
                .then(data => {
                    console.log("Success:", data);
                    const reactionNames = data.reaction_names || []; // assuming the API returns a list of reaction names
                    const selectedReactions = reactionNames.map(name => {
                        const reaction = reactions.find(r => r.name === name);
                        return reaction ? { value: reaction.id, label: reaction.name } : null;
                    }).filter(r => r !== null);
                    console.log(reactionNames);
                    console.log(selectedReactions);
                    setCurrentReactionNames(reactionNames);
                    setSelectedReactionIds(selectedReactions);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching current reaction names:", error);
                    setLoading(false);
                });
        }
    }, [sensor_id, reactions]);

    const handleSave = () => {
        const payload = { reaction_ids: selectedReactionIds.map(option => option.value) };

        fetch(`/api/set_current_reaction/${sensor_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Something went wrong on API server!');
                }
            })
            .then(data => {
                console.log("Successfully set current reactions:", data);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000); // Hide the message after 5 seconds
            })
            .catch(error => {
                console.error("Error setting current reactions:", error);
            });
    };

    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">CURRENT REACTION</h2>
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <Select
                        isMulti
                        value={selectedReactionIds}
                        onChange={(selectedOptions) => {
                            setVerifyConstraint(true);
                            setSelectedReactionIds(selectedOptions || []);
                        }}
                        options={reactionOptions}
                        className="basic-multi-select"
                        classNamePrefix="select"
                    />
                )}
                {verifyConstraint ? (
                    <div className="pt-5">
                        <button className="bg-gray-300 rounded-lg text-gray-600 font-poppins py-2 px-7 text-sm">
                            Save
                        </button>
                    </div>
                ) : (
                    <>
                        {selectedReactionIds.length > 0 && (
                            <>
                                {reactionValid ? (
                                    <div className="flex flex-row h-min pt-3">
                                        <img src="/static/img/ico/icons8-checked-512.svg" alt="Checked"
                                            className="w-6 h-6 mr-2" />
                                        <p>All reagents and standards are active</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-row h-min pt-3">
                                        <img src="/static/img/ico/icons8-warning-red-512.svg" alt="Warning"
                                            className="w-6 h-6 mr-2" />
                                        <p>Warning: Some reagents/standards are not loaded. <strong>This can cause errors during execution!</strong></p>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="pt-5 flex flex-row">
                            <div>
                                <button onClick={handleSave}
                                        className="bg-blue-600 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400">
                                    Save
                                </button>
                            </div>
                            <div>
                                {saveSuccess && (
                                    <div className="flex flex-row h-min items-center pl-2 mt-3">
                                    <img src="/static/img/ico/icons8-checked-512.svg" alt="Checked"
                                            className="w-6 h-6 mr-2" />
                                        <p>Save in database</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CurrentReaction;
