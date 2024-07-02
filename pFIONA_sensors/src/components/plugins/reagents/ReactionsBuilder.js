import React from 'react'; // Import React library

function ReactionsBuilder({ reactions }) { // Define ReactionsBuilder component accepting 'reactions' as a prop

    // Return HTML Code
    return (
        <div className={"w-full"}> {/* Main container */}
            <div className={"mb-5"}> {/* Margin bottom */}
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>REACTIONS BUILDER</h2> {/* Title */}
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}> {/* Flex container */}
                <div className={"h-10"}> {/* Height */}
                    <a href={`reaction/add`}
                       className={"bg-lime-500 text-white font-poppins px-8 py-1 mb-2 rounded-md hover:bg-lime-300"}>Add
                        reaction</a> {/* Link to add reaction */}
                </div>
                <div className={"w-full"}> {/* Full width container */}
                    <table className={"w-full"}> {/* Table */}
                        <thead> {/* Table header */}
                        <tr className={"border border-custom-gray-1 bg-custom-gray-2"}> {/* Table row */}
                            <th className={"font-montserrat font-medium pt-8 pb-2 pl-5 text-left"}>Name</th> {/* Table header cell */}
                            <th className={"w-1/12"}></th> {/* Empty table header cell for actions */}
                        </tr>
                        </thead>
                        {reactions.length > 0 ? ( // Check if there are reactions
                            <tbody> {/* Table body */}
                            {reactions.map((reaction) => ( // Map through reactions
                                <tr key={reaction.id} className={"border border-custom-gray-1"}> {/* Table row */}
                                    <td className={"font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5"}>{reaction.name}</td> {/* Reaction name */}
                                    <td>
                                        <div className={"h-full flex flex-row-reverse pl-5"}> {/* Flex container for actions */}
                                            <a href={`reaction/${reaction.id}/delete`}> {/* Link to delete reaction */}
                                                <img src={"/static/img/ico/icons8-delete-90.svg"}
                                                     className={"w-6 red_icon mr-4"}
                                                     alt="Delete" style={{
                                                    filter: "invert(17%) sepia(64%) saturate(4869%) hue-rotate(351deg) brightness(95%) contrast(88%)"
                                                }}/>
                                            </a>
                                            <a href={`reaction/${reaction.id}/edit`}> {/* Link to edit reaction */}
                                                <img src={"/static/img/ico/icons8-edit-384.svg"}
                                                     className={"w-6 blue_icon mr-4"}
                                                     alt="Edit" style={{
                                                    filter: "filter: invert(27%) sepia(99%) saturate(1791%) hue-rotate(214deg) brightness(94%) contrast(96%)"
                                                }}/>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        ) : ( // If no reactions, display message
                            <tbody> {/* Table body */}
                            <tr className={"border border-custom-gray-1 text-red-700 font-montserrat"}> {/* Table row */}
                                <td className={"pb-2 pt-2 pl-5"}>There is no reactions in database</td> {/* Message */}
                            </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReactionsBuilder; // Export ReactionsBuilder component
