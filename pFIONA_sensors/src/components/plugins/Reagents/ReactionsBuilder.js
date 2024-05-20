import React from 'react';

function ReactionsBuilder({reactions}) {


    // Return HTML Code
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>REACTIONS BUILDER</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <div className={"h-10"}>
                    <a href={`reaction/add`}
                       className={"bg-lime-500 text-white font-poppins px-8 py-1 mb-2 rounded-md hover:bg-lime-300"}>Add
                        reaction</a>
                </div>
                <div className={"w-full"}>
                    <table className={"w-full"}>
                        <thead>
                        <tr className={"border border-custom-gray-1 bg-custom-gray-2"}>
                            <th className={"font-montserrat font-medium pt-8 pb-2 pl-5 text-left"}>Name</th>
                            <th className={"w-1/12"}></th>
                        </tr>
                        </thead>
                        {reactions.length > 0 ? (
                            <tbody>
                            {reactions.map((reaction) => (
                                <tr key={reaction.id} className={"border border-custom-gray-1"}>
                                    <td className={"font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5"}>{reaction.name}</td>
                                    <td>
                                        <div className={"h-full flex flex-row-reverse pl-5"}>
                                            <a href={`reaction/${reaction.id}/delete`}>
                                                <img src={"/static/img/ico/icons8-delete-90.svg"}
                                                     className={"w-6 red_icon mr-4"}
                                                     alt="Delete" style={{
                                                    filter: "invert(17%) sepia(64%) saturate(4869%) hue-rotate(351deg) brightness(95%) contrast(88%)"
                                                }}/>
                                            </a>
                                            <a href={`reaction/${reaction.id}/edit`}>
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
                        ) : (
                            <tbody>
                            <tr className={"border border-custom-gray-1 text-red-700 font-montserrat"}>
                                <td className={"pb-2 pt-2 pl-5"}>There is no reactions in database</td>
                            </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReactionsBuilder;
