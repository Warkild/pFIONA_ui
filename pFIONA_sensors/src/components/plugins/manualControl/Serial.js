import React, { useState } from 'react';

function Serial({ inAction, setInAction, isDeployed }) {
    const [inputValue, setInputValue] = useState('');
    const [outputValue, setOutputValue] = useState('');

    const handleSend = () => {
        const url = `http://${sensor_ip}:5000/serial/write_and_read`;

            setInAction(true);

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    "command": inputValue,
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    setInAction(false)
                    setOutputValue(data.message)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setInAction(false)
                    setOutputValue(data.message)
                });
    };

    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>SERIAL</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 justify-between"}>
                <div className={"flex flex-row space-x-6"}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={"mb-4 p-2 w-full border rounded-lg"}
                    />
                    <button
                        onClick={handleSend}
                        className={`mb-4 p-2 px-10 rounded rounded-lg ${inAction || isDeployed ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-400"}`}
                        disabled={inAction || isDeployed}
                    >
                        Send
                    </button>
                </div>
                <input
                    type="text"
                    value={outputValue}
                    readOnly
                    className={"p-2 border rounded bg-gray-200 rounded-lg"}
                />
            </div>
        </div>
    );
}

export default Serial;
