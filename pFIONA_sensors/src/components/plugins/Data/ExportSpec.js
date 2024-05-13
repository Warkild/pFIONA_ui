import React, { useState } from "react";
import { createRoot } from "react-dom/client";


function ExportSpec() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const handleStartDateChange = (event) => {
        const date = event.target.value;
        const timestamp = Date.parse(date);
        setStartDate(timestamp);
    };

    const handleEndDateChange = (event) => {
        const date = event.target.value;
        const timestamp = Date.parse(date);
        setEndDate(timestamp);
    };

    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>EXPORT SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <div className={"flex flex-row"}>
                    <div className={"flex flex-col mr-10"}>
                        <label className={"font-montserrat text-sm pb-2"}>Start date</label>
                        <input type={"date"} onChange={handleStartDateChange}/>
                    </div>
                    <div className={"flex flex-col mr-5"}>
                        <label className={"font-montserrat text-sm pb-2"}>End date</label>
                        <input type={"date"} onChange={handleEndDateChange}/>
                    </div>
                    <div className={"flex flex-col-reverse"}>
                        {startDate && endDate && startDate > endDate && (
                            <div className={"flex flex-row h-min"}>
                                <img src={"/static/img/ico/icons8-warning-512.svg"} alt="Warning" className={"w-6 h-6 mr-2"} />
                                <p>Start date must be less or equal than end date</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportSpec;
