import React, {useEffect, useState} from 'react';

function CurrentReaction({reactions}) {  // Assume sensor_id is passed as a prop
    const [currentReactionId, setCurrentReactionId] = useState(null);
    const [selectedReactionId, setSelectedReactionId] = useState("");
    const [verifyConstraint, setVerifyConstraint] = useState(false);
    const [reactionValid, setReactionValid] = useState(true);

    function checkReactionValid() {
        if (selectedReactionId) {
            fetch(`/api/get_validity_reaction_to_set_as_current_reaction?reaction_id=${selectedReactionId}`)
                .then(response => response.json())
                .then(data => {
                    setReactionValid(data.data);
                    setVerifyConstraint(false);
                })
                .catch(error => console.error("Error fetching current reaction id:", error));
        } else {
            setVerifyConstraint(false)
        }
    }

    useEffect(() => {
        checkReactionValid();
    }, [selectedReactionId]);

    useEffect(() => {
        fetch(`/api/get_current_reaction/${sensor_id}`)
            .then(response => response.json())
            .then(data => {
                setCurrentReactionId(data.reaction_id);
                setSelectedReactionId(data.reaction_id);
            })
            .catch(error => console.error("Error fetching current reaction id:", error));
    }, [sensor_id]);

    const handleSave = () => {
        // Préparer l'ID de la réaction ou null si rien n'est sélectionné
        const payload = {reaction_id: selectedReactionId || null};

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
                console.log("Successfully set current reaction:", data);
                window.location.reload();
            })
            .catch(error => {
                console.error("Error setting current reaction:", error);
            });
    };


    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>CURRENT REACTION</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <select
                    value={selectedReactionId}
                    onChange={(e) => {
                        setVerifyConstraint(true);  // Assurez-vous que cette instruction est terminée correctement.
                        setSelectedReactionId(e.target.value);
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="">-- nothing --</option>
                    {reactions.map((reaction) => (
                        <option key={reaction.id} value={reaction.id}>
                            {reaction.name}
                        </option>
                    ))}
                </select>
                {verifyConstraint ? (
                    <div className="pt-5">
                        <button className="bg-gray-300 rounded-lg text-gray-600 font-poppins py-2 px-7 text-sm">
                            Save
                        </button>
                    </div>
                ) : (
                    <>
                        {selectedReactionId && (
                            <>
                                {reactionValid ? (
                                    <div className={"flex flex-row h-min pt-3"}>
                                        <img src={"/static/img/ico/icons8-checked-512.svg"} alt="Checked"
                                             className={"w-6 h-6 mr-2"}/>
                                        <p>All reagents and standard are active</p>
                                    </div>
                                ) : (
                                    <div className={"flex flex-row h-min pt-3"}>
                                        <img src={"/static/img/ico/icons8-warning-red-512.svg"} alt="Warning"
                                             className={"w-6 h-6 mr-2"}/>
                                        <p>Warning : Some reagents/standard are not loaded. <strong>This can make error on execution !</strong></p>
                                    </div>
                                )}
                            </>

                        )}
                        <div className="pt-5">
                            <button onClick={handleSave}
                                    className="bg-blue-600 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400">
                                Save
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default CurrentReaction;
