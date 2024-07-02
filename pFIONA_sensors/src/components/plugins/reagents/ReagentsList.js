import React, {useState} from 'react';
import Alert from "../universal/Alert";

function ReagentsList({reagents, connected}) {
    const validReagents = reagents.filter(reagent => reagent.volume_max > 0);

    /** ALERT BOX **/
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alertModalText, setAlertModalText] = useState("");

    const closeModal = () => {
        setIsModalOpen(false);
    };

    /** FULLY FILLED ***/
    const fullyFilled = () => {
        if (sessionStorage.getItem('accessToken')) {
            try {
                fetch(`http://${sensor_ip}:${sensor_port}/sensor/fully_filled`, {
                    method: 'POST',
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
                        window.location.reload();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        setAlertModalText(`Error: ${error.message}`);
                        setIsModalOpen(true);
                    });
            } catch (error) {
                setAlertModalText(`Error: ${error.message}`);
                setIsModalOpen(true);
            }
        }

    };

    const addReagent = () => {
        window.location.href = 'add';
    };

    // Return HTML Code
    return (
        <div className="w-full">
            <div className="mb-5">
                <h2 className="font-poppins font-bold text-gray-500 text-sm">REAGENTS LIST</h2>
            </div>
            <div className="flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8">
                <div className="flex flex-row space-x-2 mb-2">
                    <div className="h-10">
                        <button
                            className="bg-lime-500 text-white font-poppins px-8 py-1 rounded-md hover:bg-lime-300"
                            onClick={addReagent}
                        >
                            Add reagent
                        </button>
                    </div>
                    <div className="h-10">
                        <button
                            className={`font-poppins px-8 py-1 rounded-md ${connected ? "bg-blue-600 text-white hover:bg-blue-400" : "text-gray-600 bg-gray-300"}`}
                            onClick={fullyFilled}
                            disabled={!connected}
                        >
                            Fully Filled
                        </button>
                    </div>
                </div>
                <div className="w-full">
                    <table className="w-full">
                        <thead>
                        <tr className="border border-custom-gray-1 bg-custom-gray-2">
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">Name</th>
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Volume (mL)</th>
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Max Volume
                                (mL)
                            </th>
                            <th className="font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left">Status</th>
                            <th className="w-1/12"></th>
                        </tr>
                        </thead>
                        {validReagents.length > 0 ? (
                            <tbody>
                            {validReagents.sort((a, b) => a.name.localeCompare(b.name)).map((reagent) => (
                                <tr key={reagent.id} className="border border-custom-gray-1">
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.name}</td>
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.volume.toFixed(2)}</td>
                                    <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">{reagent.volume_max.toFixed(2)}</td>
                                    <td className={`pl-5 ${(reagent.name === 'water' || reagent.port != null) ? 'text-lime-500' : 'text-red-600'}`}>{(reagent.name === 'water' || reagent.port != null) ? 'Active' : 'Inactive'}</td>
                                    <td>
                                        <div className="h-full flex flex-row-reverse pl-5">
                                            {(reagent.name !== 'water') && (
                                                <a href={`${reagent.id}/delete`}>
                                                    <img src="/static/img/ico/icons8-delete-90.svg"
                                                         className="w-6 red_icon mr-4" alt="Delete" style={{
                                                        filter: "invert(17%) sepia(64%) saturate(4869%) hue-rotate(351deg) brightness(95%) contrast(88%)"
                                                    }}/>
                                                </a>
                                            )}
                                            <a href={`${reagent.id}/edit`}>
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
                        ) : (
                            <tbody>
                            <tr className="border border-custom-gray-1 text-red-700 font-montserrat">
                                <td className="pb-2 pt-2 pl-5">There are no reagents in the database</td>
                            </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

export default ReagentsList;
