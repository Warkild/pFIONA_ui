import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import DeployStatus from "../plugins/deploy/DeployStatus";
import DeployBasicSettings from "../plugins/deploy/DeployBasicSettings";
import DeployStatesInformation from "../plugins/deploy/DeployStatesInformation";
import DeployTransport from "../plugins/deploy/DeployTransport";
function DeployApp({  }) {

    // State for connection status
    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        fetch(`http://${sensor_ip}:5000/sensor/get_state`, {
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
                setConnected(true);
            })
            .catch(error => {
                console.error('Error:', error);
                setConnected(false);
            });
    };

    useEffect(() => {
        checkStatus();
        const intervalId = setInterval(() => {
            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);


  return (
      <div className={"flex flex-col space-y-10"}>
          <DeployStatus/>
          <div className={"flex flex-row justify-between"}>
              <DeployBasicSettings/>
              <DeployStatesInformation/>
          </div>
          <div className={"flex flex-row justify-between"}>
              <DeployTransport connected={connected}/>
          </div>
      </div>
  );
}

document.querySelectorAll("#deploy_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DeployApp/>);
});