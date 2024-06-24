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
        if(sessionStorage.getItem('accessToken') != null) {
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
        }
    };

    // State for connection status
    const [isDeployed, setIsDeployed] = useState(false);
    const [isLoadingDeployed, setIsLoadingDeployed] = useState(true);
    const [isErrorDeployed, setIsErrorDeployed] = useState(false);
    const [errorMessageDeployed, setErrorMessageDeployed] = useState('');


    const checkDeployedStatus = () => {
        fetch(`/api/is_deployed?sensor_id=${sensor_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    setErrorMessageDeployed("Unable to connect");
                    setIsErrorDeployed(true);
                    setIsLoadingDeployed(false);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setIsDeployed(data.data);
                setIsLoadingDeployed(false);
                console.log('Success:', data);
            })
            .catch(error => {
                setErrorMessageDeployed(`There is an error : ${error.message}`);
                setIsErrorDeployed(true);
                setIsLoadingDeployed(false);
                console.error('Error:', error);
            });
    };

    useEffect(() => {
        checkStatus();
        checkDeployedStatus();
        const intervalId = setInterval(() => {
            checkStatus();
            checkDeployedStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);




  return (
      <div className={"flex flex-col space-y-10"}>
          <DeployStatus connected={connected} isDeployed={isDeployed} setIsDeployed={setIsDeployed} errorMessageDeployed={errorMessageDeployed} isErrorDeployed={isErrorDeployed} isLoadingDeployed={isLoadingDeployed}/>
          <div className={"flex flex-row justify-between"}>
              <DeployBasicSettings/>
              <DeployStatesInformation/>
          </div>
          <div className={"flex flex-row justify-between"}>
              <DeployTransport connected={connected} isDeployed={isDeployed}/>
          </div>
      </div>
  );
}

document.querySelectorAll("#deploy_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DeployApp/>);
});