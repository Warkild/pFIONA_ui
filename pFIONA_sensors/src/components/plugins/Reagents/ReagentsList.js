import React, { useState } from 'react';
import Alert from "../Alert";

function ReagentsList({reagents}) {


    // Return HTML Code
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>REAGENTS LIST</h2>
            </div>
            <div className={"flex flex-row font-montserrat bg-white shadow-lg rounded-2xl py-5 space-x-8 px-8 justify-between"}>
                <div className={"w-full"}>
                    <table className={"w-full"}>
                        <tr className={"border border-custom-gray-1 bg-custom-gray-2"}>
                            <th className={"font-montserrat font-medium pt-8 pb-2 pl-5 text-left"}>Name</th>
                            <th className={"font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left"}>Volume</th>
                            <th className={"font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left"}>Max Volume</th>
                            <th className={"font-montserrat w-2/12 font-medium pt-8 pb-2 pl-5 text-left"}>Status</th>
                            <th className={"w-1/12"}></th>
                        </tr>
                        {reagents.map((reagent) => (
                            <tr className={"border border-custom-gray-1"}>
                                <td className={"font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5"}>{reagent.name}</td>
                                <td className={"font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5"}>{reagent.volume}</td>
                                <td className={"font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5"}>{reagent.max_volume}</td>
                                <td className={`pl-5 ${reagent.port != null ? 'text-lime-500' : 'text-red-600'}`}>{reagent.port != null ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <div className={"h-full flex flex-row-reverse pr-5"}>
                                        <a href="#">
                                            <img src={"/static/img/ico/icons8-delete-90.svg"} className={"w-6 red_icon"}
                                                 alt="Delete" style={{
                                                    filter: "invert(17%) sepia(64%) saturate(4869%) hue-rotate(351deg) brightness(95%) contrast(88%)"
                                                 }}/>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReagentsList;
