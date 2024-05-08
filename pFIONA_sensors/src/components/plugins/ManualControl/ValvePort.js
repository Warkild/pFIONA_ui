import React, {useEffect, useState} from 'react';
import Alert from "../Alert";

function ValvePort() {
    // Get value of current valve in sensor
    const [currentVal, setCurrentVal] = useState('-');

    // Value of selected port
    const [moveToPortValue, setMoveToPortValue] = useState(1);

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Set the value of selected port in moveToPortValue variable (use in onChange of the input)
    const handleMoveToPortChange = (e) => {
        setMoveToPortValue(e.target.value);
    };

    // Alert box close
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const getCurrentPort = () => {
        fetch(`http://${SENSOR_IP}:5000/valve/get_valve`, {
            method: 'GET',
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
            if(data.message === 0) {
                setCurrentVal('Air')
            } else {
                setCurrentVal(data.message)
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    const handleMoveClick = () => {

        if (moveToPortValue <= 0) {
            setIsModalOpen(true);
        } else {
            // Define the URL for the POST request
            const url = `http://${SENSOR_IP}:5000/valve/change_valve`;

            // Make a POST request to the specified URL
            fetch(url, {
                method: 'POST', // Specify the request method as POST
                headers: {
                    'Content-Type': 'application/json', // Set the content type header
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    "valve_number": parseInt(moveToPortValue)
                }) // Convert the object to a JSON string
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the response as JSON
            })
            .then(data => {
                console.log('Success:', data);
                setCurrentVal(moveToPortValue.toString())
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    const handleMoveAirPortClick = () => {
        // Define the URL for the POST request
        const url = `http://${SENSOR_IP}:5000/valve/go_air_port`;

        // Make a POST request to the specified URL
        fetch(url, {
            method: 'POST', // Specify the request method as POST
            headers: {
                'Content-Type': 'application/json', // Set the content type header
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response as JSON
        })
        .then(data => {
            console.log('Success:', data);
            setCurrentVal('Air')
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    useEffect(() => {
        getCurrentPort();

        const intervalId = setInterval(() => {

            getCurrentPort();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    // Return HTML Code
    return (
        <div className={"w-1/6 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>VALVE</h2>
            </div>
            <div className={"bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col pb-5"}>
                    <p className={"font-montserrat text-sm pb-2"}>Current Port</p>
                    <input className={"text-center remove-arrow rounded-lg bg-gray-200"} value={currentVal} readOnly={true}></input>
                </div>
                <div className={"flex flex-col pb-5"}>
                    <p className={"font-montserrat text-sm pb-2"}>Move to port</p>
                    <input type="number" className={"text-center remove-arrow rounded-lg"} value={moveToPortValue} onChange={handleMoveToPortChange}></input>
                </div>
                <div className={"flex flex-col"}>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"} onClick={handleMoveClick}>Move</button>
                    <button className={"bg-blue-600 rounded-lg text-white font-poppins py-1"} onClick={handleMoveAirPortClick}>Move to air port</button>
                </div>
                <div className={"h-5"}></div>
            </div>
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} />
        </div>

    );
}

export default ValvePort;
