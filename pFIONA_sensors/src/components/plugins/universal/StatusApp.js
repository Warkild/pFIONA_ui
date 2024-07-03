import React, {useEffect, useState} from "react"; // Import React and necessary hooks
import { createRoot } from "react-dom/client"; // Import createRoot from react-dom

function StatusApp({ sensor_ip }) { // Define StatusApp component accepting sensor_ip as a prop
    const [connected, setConnected] = useState(false); // State to track connection status

    const checkStatus = () => { // Function to check the status of the sensor
        if(sessionStorage.getItem('accessToken') != null) { // Check if accessToken is present in sessionStorage
            const url = `http://${sensor_ip}:${sensor_port}/sensor/get_state`; // Construct the URL for the sensor API
            fetch(url, {
                method: 'GET', // HTTP GET method
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`, // Set authorization header
                    'Content-Type': 'application/json', // Set content type to JSON
                },
            })
                .then(response => {
                    if (!response.ok) { // Check if the response is not ok
                        throw new Error('Network response was not ok'); // Throw an error if response is not ok
                    }
                    return response.json(); // Parse the JSON from the response
                })
                .then(data => { // Handle the parsed data
                    console.log('Success:', data); // Log success data
                    setConnected(true); // Set connected state to true
                })
                .catch(error => { // Handle errors
                    console.error('Error:', error); // Log the error
                    setConnected(false); // Set connected state to false
                });
        }
    };

    useEffect(() => { // useEffect hook to perform side effects
        checkStatus(); // Check status immediately on mount

        const intervalId = setInterval(() => { // Set an interval to check status periodically
            checkStatus(); // Check status every 5 seconds
        }, 5000);

        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []); // Empty dependency array to run only on mount and unmount

  return ( // JSX to render the component
      <div className={"flex flex-row items-center"}>
          <div className={` w-5 h-5 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`}></div> {/* Indicator for connection status */}
          <p className={"ml-3"}>{connected ? 'Connected' : 'Disconnected'}</p> {/* Text indicating connection status */}
      </div>
  );
}

document.querySelectorAll("#status_app").forEach(div => { // Find all elements with id "status_app"
    const ip = div.getAttribute('data-ip'); // Get the sensor IP from data-ip attribute
    console.log(ip); // Log the IP
    const root = createRoot(div); // Create a root for React rendering
    root.render(<StatusApp sensor_ip={ip}/>); // Render StatusApp component with sensor_ip prop
});
