import React, {useState} from "react";


function ExportSpec() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

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
        console.log("***")
        console.log(startDate)
        console.log(endDate)
        console.log(endDate > startDate)
        if (startDate && endDate && endDate > startDate) {
            window.location.href = `http://127.0.0.1:8000/sensors/export-spectra/?start=${startDate}&end=${endDate}`;
        } else {
            alert("ERROR");
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
                        <input type={"date"} onChange={handleStartDateChange}/>
                    </div>
                    <div className={"flex flex-col mr-5"}>
                        <label className={"font-montserrat text-sm pb-2"}>End date</label>
                        <input type={"date"} onChange={handleEndDateChange}/>
                    </div>
                    <div className={"flex flex-col-reverse"}>
                        {startDate && endDate && startDate > endDate && (
                            <div className={"flex flex-row h-min"}>
                                <img src={"/static/img/ico/icons8-warning-yellow-512.svg"} alt="Warning"
                                     className={"w-6 h-6 mr-2"}/>
                                <p>Start date must be less or equal than end date</p>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    {startDate && endDate && endDate > startDate ? (
                        <button onClick={handleSubmit} className={"bg-lime-500 text-white font-poppins px-8 py-1 mb-2 rounded-md hover:bg-lime-300"}>Valider</button>
                    ): (
                        <button className={"bg-gray-300 font-poppins px-8 py-1 mb-2 rounded-md"}>Valider</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExportSpec;
