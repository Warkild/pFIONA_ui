// Importing React and useState hook from the react library
import React, { useState } from 'react';
// Importing the Alert component from the universal directory
import Alert from "../universal/Alert";

// Defining the Serial functional component with props: inAction, setInAction, isDeployed
function Serial({ inAction, setInAction, isDeployed }) {

    /**
     * ALERT MESSAGE
     */

    // State to manage the visibility of the alert modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State to store the text message for the alert modal
    const [alertModalText, setAlertModalText] = useState("");

    // Function to close the alert modal by setting isModalOpen to false
    const closeModal = () => {
        setIsModalOpen(false);
    };

    /** SERIAL COMP **/

    // State to store the value of the input field
    const [inputValue, setInputValue] = useState('');
    // State to store the value of the output field
    const [outputValue, setOutputValue] = useState('');

    // Function to handle sending the command to the server
    const handleSend = () => {
        try {
            // URL for the API endpoint
            const url = `http://${sensor_ip}:${sensor_port}/serial/write_and_read`;

            // Setting the inAction state to true to indicate the action is in progress
            setInAction(true);

            // Fetch API call to the server with POST method
            fetch(url, {
                method: 'POST',
                headers: {
                    // Setting the content type and authorization headers
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
                // Sending the command in the body of the request
                body: JSON.stringify({
                    "command": inputValue,
                })
            })
                // Handling the response from the server
                .then(response => {
                    if (!response.ok) {
                        // If the response is not OK, throwing an error with the message from the server
                        return response.json().then(errorData => {
                            throw new Error(`Network response was not ok: ${errorData.message}`);
                        });
                    }
                    // If the response is OK, returning the JSON data
                    return response.json();
                })
                // Handling the success case
                .then(data => {
                    console.log('Success:', data);
                    // Setting inAction to false
                    setInAction(false);
                    // Setting the output value to the message from the server
                    setOutputValue(data.message);
                })
                // Handling any errors during the fetch call
                .catch(error => {
                    console.error('Error:', error);
                    // Setting inAction to false
                    setInAction(false);
                    // Setting the alert modal text to the error message
                    setAlertModalText(error.message);
                    // Opening the alert modal
                    setIsModalOpen(true);
                });
        } catch (error) {
            // Handling any errors that occur outside the fetch call
            setAlertModalText(error.message);
            // Opening the alert modal
            setIsModalOpen(true);
        }
    };

    // Returning the JSX to render the component
    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                {/* Heading for the Serial section */}
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>SERIAL</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 justify-between"}>
                <div className={"flex flex-row space-x-6"}>
                    {/* Input field for entering the command */}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={"mb-4 p-2 w-full border rounded-lg"}
                    />
                    {/* Button to send the command */}
                    <button
                        onClick={handleSend}
                        className={`mb-4 p-2 px-10 rounded rounded-lg ${inAction || isDeployed ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-400"}`}
                        disabled={inAction || isDeployed}
                    >
                        Send
                    </button>
                </div>
                {/* Output field to display the response from the server */}
                <input
                    type="text"
                    value={outputValue}
                    readOnly
                    className={"p-2 border rounded bg-gray-200 rounded-lg"}
                />
            </div>
            {/* Alert component to display error messages */}
            <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText}/>
        </div>
    );
}

// Exporting the Serial component as default
export default Serial;
