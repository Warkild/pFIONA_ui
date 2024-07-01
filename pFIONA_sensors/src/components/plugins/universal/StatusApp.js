import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
function StatusApp({ sensor_ip }) {

    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        if(sessionStorage.getItem('accessToken') != null) {
            fetch(`http://${sensor_ip}:${sensor_port}/sensor/get_state`, {
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
                    setConnected(true)
                })
                .catch(error => {
                    console.error('Error:', error);
                    setConnected(false)
                });
        }
    };

    useEffect(() => {
        checkStatus();

        const intervalId = setInterval(() => {

            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

  return (
      <div className={"flex flex-row items-center"}>
          <div className={` w-5 h-5 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <p className={"ml-3"}>{connected ? 'Connected' : 'Disconnected'}</p>
      </div>
  );
}

document.querySelectorAll("#status_app").forEach(div => {
    const ip = div.getAttribute('data-ip');
    console.log(ip)
    const root = createRoot(div);
    root.render(<StatusApp sensor_ip={ip}/>);
});