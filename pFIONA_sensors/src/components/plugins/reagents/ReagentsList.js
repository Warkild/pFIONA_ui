import React, { useState } from 'react'; // Import React and useState hook
import Alert from "../universal/Alert"; // Import Alert component

function ReagentsList({ reagents, connected }) { // Define ReagentsList component with reagents and connected as props
    const validReagents = reagents.filter(reagent => reagent.volume_max > 0); // Filter valid reagents

    /** ALERT BOX **/
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [alertModalText, setAlertModalText] = useState(""); // State for modal text

    const closeModal = () => { // Function to close the modal
        setIsModalOpen(false); // Set modal state to closed
    };

    /** FULLY FILLED ***/
    const fullyFilled = () => { // Function to handle fully filled action
        if (sessionStorage.getItem('accessToken')) { // Check if access token is available
            try {
                const url = `http://${sensor_ip}:${sensor_port}/sensor/fully_filled` // Construct URL
                fetch(url, {
                    method: 'POST', // HTTP method
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
                        window.location.reload(); // Reload page
                    })
                    .catch(error => { // Handle error
                        console.error('Error:', error); // Log error
                        setAlertModalText(`Error: ${error.message}`); // Set error message
                        setIsModalOpen(true); // Open modal
                    });
            } catch (error) { // Handle error
                setAlertModalText(`Error: ${error.message}`); // Set error message
                setIsModalOpen(true); // Open modal
            }
        }
    };

    const addReagent = () => { // Function to handle adding reagent
        window.location.href = 'add'; // Redirect to add reagent page
    };

    // Return HTML Code
    return (
        <div className="w-full"> {/* Main container */}
            <div className="mb-5"> {/* Margin bottom */}
                <h2 className="font-poppins font-bold text-gray-500 text-sm">REAGENTS LIST</h2> {/* Title */}
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"> {/* Flex container */}
                <div className="flex flex-row space-x-2 mb-2"> {/* Flex row */}
                    <div className="h-10"> {/* Height */}
                        <button
                            className="bg-lime-500 text-white font-poppins px-8 py-1 rounded-md hover:bg-lime-300"
                            onClick={addReagent} // Add reagent on click
                        >
                            Add reagent
                        </button>
                    </div>
                    <div className="h-10"> {/* Height */}
                        <button
                            className={`font-poppins px-8 py-1 rounded-md ${connected ? "bg-blue-600 text-white hover:bg-blue-400" : "text-gray-600 bg-gray-300"}`}
                            onClick={fullyFilled} // Fully filled on click
                            disabled={!connected} // Disable button if not connected
                        >
                            Fully Filled
                        </button>
                    </div>
                </div>
                <div className="w-full"> {/* Full width container */}
                    <table className="w-full"> {/* Table */}
                        <thead> {/* Table header */}
                        <tr className="border border-custom-gray-1 bg-custom-gray-2"> {/* Table row */}
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">Name</th> {/* Table header cell */}
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Volume (mL)</th> {/* Table header cell */}
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Max Volume (mL)</th> {/* Table header cell */}
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Status</th> {/* Table header cell */}
                            <th className="w-1/12"></th> {/* Empty table header cell */}
                        </tr>
                        </thead>
                        {validReagents.length > 0 ? ( // Check if there are valid reagents
                            <tbody> {/* Table body */}
                            {validReagents.sort((a, b) => a.name.localeCompare(b.name)).map((reagent) => ( // Sort and map through valid reagents
                                <tr key={reagent.id} className="border border-custom-gray-1"> {/* Table row */}
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.name}</td> {/* Reagent name */}
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.volume.toFixed(2)}</td> {/* Reagent volume */}
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.volume_max.toFixed(2)}</td> {/* Reagent max volume */}
                                    <td className={`pl-5 ${(reagent.name === 'water' || reagent.port != null) ? 'text-lime-500' : 'text-red-600'}`}>{(reagent.name === 'water' || reagent.port != null) ? 'Active' : 'Inactive'}</td> {/* Reagent status */}
                                    <td>
                                        <div className="h-full flex flex-row-reverse pl-5"> {/* Flex container for actions */}
                                            {(reagent.name !== 'water') && (
                                                <a href={`${reagent.id}/delete`}> {/* Link to delete reagent */}
                                                    <img src="/static/img/ico/icons8-delete-90.svg"
                                                         className="w-6 red_icon mr-4" alt="Delete" style={{
                                                        filter: "invert(17%) sepia(64%) saturate(4869%) hue-rotate(351deg) brightness(95%) contrast(88%)"
                                                    }}/>
                                                </a>
                                            )}
                                            <a href={`${reagent.id}/edit`}> {/* Link to edit reagent */}
                                                <img src="/static/img/ico/icons8-edit-384.svg"
                                                     className="w-6 blue_icon mr-4" alt="Edit" style={{
                                                    filter: "invert(27%) sepia(99%) saturate(1791%) hue-rotate(214deg) brightness(94%) contrast(96%)"
                                                }}/>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        ) : ( // If no valid reagents, display message
                            <tbody> {/* Table body */}
                            <tr className="border border-custom-gray-1 text-red-700 font-montserrat"> {/* Table row */}
                                <td className="pb-2 pt-2 pl-5">There are no reagents in the database</td> {/* Message */}
                            </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText} /> {/* Alert modal */}
        </div>
    );
}

export default ReagentsList; // Export ReagentsList component
