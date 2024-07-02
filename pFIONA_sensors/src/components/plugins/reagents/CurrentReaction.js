import React, { useEffect, useState } from 'react'; // Importing React and hooks from 'react'
import Select from 'react-select'; // Importing the Select component from 'react-select'

function CurrentReaction({ reactions }) { // Defining the CurrentReaction component, accepting 'reactions' as a prop
    const [currentReactionNames, setCurrentReactionNames] = useState([]); // State to store current reaction names
    const [selectedReactionIds, setSelectedReactionIds] = useState([]); // State to store selected reaction IDs
    const [verifyConstraint, setVerifyConstraint] = useState(false); // State to verify constraint
    const [reactionValid, setReactionValid] = useState(true); // State to store reaction validity
    const [loading, setLoading] = useState(true); // State to manage loading status
    const [saveSuccess, setSaveSuccess] = useState(false); // State to manage save success status

    const reactionOptions = reactions.map(reaction => ({ value: reaction.id, label: reaction.name })); // Mapping reactions to options format

    function checkReactionValid() { // Function to check if selected reactions are valid
        if (selectedReactionIds && selectedReactionIds.length > 0) { // Check if any reaction is selected
            const queries = selectedReactionIds.map(option => // Mapping selected reactions to fetch their validity
                fetch(`/api/get_validity_reaction_to_set_as_current_reaction?reaction_id=${option.value}&sensor_id=${sensor_id}`).then(response => response.json())
            );

            Promise.all(queries) // Fetching validity for all selected reactions
                .then(results => {
                    const allValid = results.every(result => result.data); // Check if all reactions are valid
                    setReactionValid(allValid); // Update reaction validity state
                    setVerifyConstraint(false); // Reset verify constraint state
                })
                .catch(error => console.error("Error fetching current reaction ids:", error)); // Log any errors
        } else {
            setVerifyConstraint(false); // Reset verify constraint if no reaction is selected
        }
    }

    useEffect(() => { // Effect to run when selectedReactionIds changes
        checkReactionValid(); // Check reaction validity
    }, [selectedReactionIds]);

    useEffect(() => { // Effect to run when component mounts or reactions change
        if (reactions.length > 0) { // If reactions are available
            fetch(`/api/get_current_reaction?sensor_id=${sensor_id}`) // Fetch current reaction from API
                .then(response => response.json()) // Parse the response as JSON
                .then(data => {
                    console.log("Success:", data); // Log the data
                    const reactionNames = data.reaction_names || []; // Extract reaction names from data
                    const selectedReactions = reactionNames.map(name => { // Map reaction names to selected reactions
                        const reaction = reactions.find(r => r.name === name);
                        return reaction ? { value: reaction.id, label: reaction.name } : null;
                    }).filter(r => r !== null); // Filter out null values
                    console.log(reactionNames); // Log reaction names
                    console.log(selectedReactions); // Log selected reactions
                    setCurrentReactionNames(reactionNames); // Set current reaction names state
                    setSelectedReactionIds(selectedReactions); // Set selected reaction IDs state
                    setLoading(false); // Set loading state to false
                })
                .catch(error => {
                    console.error("Error fetching current reaction names:", error); // Log any errors
                    setLoading(false); // Set loading state to false
                });
        }
    }, [sensor_id, reactions]);

    const handleSave = () => { // Function to handle save action
        const payload = { reaction_ids: selectedReactionIds.map(option => option.value), sensor_id:sensor_id }; // Prepare payload

        fetch(`/api/set_current_reaction`, { // Send payload to API
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Parse response as JSON
                } else {
                    throw new Error('Something went wrong on API server!'); // Throw error if response is not ok
                }
            })
            .then(data => {
                console.log("Successfully set current reactions:", data); // Log success message
                setSaveSuccess(true); // Set save success state to true
                setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
            })
            .catch(error => {
                console.error("Error setting current reactions:", error); // Log any errors
            });
    };

    return (
        <div className="w-full"> {/* Main container */}
            <div className="mb-5"> {/* Margin bottom */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">CURRENT REACTION</h2> {/* Title */}
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"> {/* Flex container */}
                {loading ? ( // Conditional rendering based on loading state
                    <>
                        {reactions.length > 0 ? ( // Check if reactions are available
                            <p>Loading...</p> // Show loading message
                        ) : (
                            <p>You have not yet created a reaction</p> // Show no reactions message
                        )}
                    </>
                ) : (
                    <Select
                        isMulti // Enable multi-select
                        value={selectedReactionIds} // Set selected values
                        onChange={(selectedOptions) => { // Handle change in selected options
                            setVerifyConstraint(true); // Set verify constraint state to true
                            setSelectedReactionIds(selectedOptions || []); // Update selected reaction IDs state
                        }}
                        options={reactionOptions} // Set available options
                        className="basic-multi-select" // Set CSS class
                        classNamePrefix="select" // Set CSS class prefix
                    />
                )}
                {verifyConstraint ? ( // Conditional rendering based on verify constraint state
                    <div className="pt-5"> {/* Padding top */}
                        <button className="bg-gray-300 rounded-lg text-gray-600 font-poppins py-2 px-7 text-sm"> {/* Disabled save button */}
                            Save
                        </button>
                    </div>
                ) : (
                    <>
                        {selectedReactionIds.length > 0 && ( // Check if any reaction is selected
                            <>
                                {reactionValid ? ( // Conditional rendering based on reaction validity
                                    <div className="flex flex-row h-min pt-3"> {/* Flex container */}
                                        <img src="/static/img/ico/icons8-checked-512.svg" alt="Checked" className="w-6 h-6 mr-2" /> {/* Checked icon */}
                                        <p>All reagents and standards are active</p> {/* Valid reaction message */}
                                    </div>
                                ) : (
                                    <div className="flex flex-row h-min pt-3"> {/* Flex container */}
                                        <img src="/static/img/ico/icons8-warning-red-512.svg" alt="Warning" className="w-6 h-6 mr-2" /> {/* Warning icon */}
                                        <p>Warning: Some reagents/standards are not loaded. <strong>This can cause errors during execution!</strong></p> {/* Invalid reaction message */}
                                    </div>
                                )}
                            </>
                        )}
                        <div className="pt-5 flex flex-row"> {/* Padding top and flex container */}
                            <div>
                                <button onClick={handleSave} className="bg-blue-600 rounded-lg text-white font-poppins py-2 px-7 text-sm hover:bg-blue-400"> {/* Save button */}
                                    Save
                                </button>
                            </div>
                            <div>
                                {saveSuccess && ( // Conditional rendering based on save success state
                                    <div className="flex flex-row h-min items-center pl-2 mt-3"> {/* Flex container */}
                                    <img src="/static/img/ico/icons8-checked-512.svg" alt="Checked" className="w-6 h-6 mr-2" /> {/* Checked icon */}
                                        <p>Save in database</p> {/* Save success message */}
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

export default CurrentReaction; // Exporting the CurrentReaction component
