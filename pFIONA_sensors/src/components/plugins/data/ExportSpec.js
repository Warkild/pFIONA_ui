import React, { useState } from "react";

function ExportSpec() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [dataType, setDataType] = useState("raw");
    const [fileFormat, setFileFormat] = useState("csv");

    const handleStartDateChange = (event) => {
        const date = event.target.value;
        const dateObj = new Date(date);
        const localDateObj = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000));
        const timestamp = localDateObj.getTime();
        setStartDate(timestamp);
    };

    const handleEndDateChange = (event) => {
        const date = event.target.value;
        const dateObj = new Date(date);
        const localDateObj = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000));
        const timestamp = localDateObj.getTime() + 86399999;
        setEndDate(timestamp);
    };

    const handleSubmit = () => {
        if (startDate && endDate && endDate > startDate) {
            window.open(`http://127.0.0.1:8000/api/prepare-export/?start=${startDate}&end=${endDate}&sensor_id=${sensor_id}&data_type=${dataType}&file_format=${fileFormat}`, '_blank');
        } else {
            alert("ERROR: Please ensure that the end date is greater than the start date and that both dates are selected.");
        }
    };

    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>EXPORT SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <div className={"flex flex-row pb-6"}>
                    <div className={"flex flex-col mr-10"}>
                        <label className={"font-montserrat text-sm pb-2"}>Start date</label>
                        <input type={"date"} onChange={handleStartDateChange} />
                    </div>
                    <div className={"flex flex-col mr-5"}>
                        <label className={"font-montserrat text-sm pb-2"}>End date</label>
                        <input type={"date"} onChange={handleEndDateChange} />
                    </div>
                    <div className={"flex flex-col-reverse"}>
                        {startDate && endDate && startDate > endDate && (
                            <div className={"flex flex-row h-min"}>
                                <img src={"/static/img/ico/icons8-warning-yellow-512.svg"} alt="Warning"
                                    className={"w-6 h-6 mr-2"} />
                                <p>Start date must be less or equal than end date</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className={"flex flex-col pb-6"}>
                    <label className={"font-montserrat text-sm pb-2"}>Data Type</label>
                    <select onChange={(e) => setDataType(e.target.value)} value={dataType}>
                        <option value="raw">Raw</option>
                        <option value="absorbance">Absorbance</option>
                        <option value="concentration">Concentration</option>
                    </select>
                </div>
                <div className={"flex flex-col pb-6"}>
                    <label className={"font-montserrat text-sm pb-2"}>File Format</label>
                    <select onChange={(e) => setFileFormat(e.target.value)} value={fileFormat}>
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                <div>
                    {startDate && endDate && endDate > startDate ? (
                        <button onClick={handleSubmit} className={"bg-lime-500 text-white font-poppins px-8 py-1 mb-2 rounded-md hover:bg-lime-300"}>Export</button>
                    ) : (
                        <button className={"bg-gray-300 font-poppins px-8 py-1 mb-2 rounded-md"}>Export</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExportSpec;
