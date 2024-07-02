import React, {Component, useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import Overview from "../plugins/reagents/Overview";
import ReagentsList from "../plugins/reagents/ReagentsList";
import Valve from "../plugins/reagents/Valve";
import ReactionsBuilder from "../plugins/reagents/ReactionsBuilder";
import CurrentReaction from "../plugins/reagents/CurrentReaction";

function ReagentsApp({ip}) {

    // State for connection status
    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        if(sessionStorage.getItem('accessToken') != null) {
            const url = `http://${sensor_ip}:${sensor_port}/sensor/get_state`
            fetch(url, {
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

    useEffect(() => {
        checkStatus();
        const intervalId = setInterval(() => {
            checkStatus();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

  return (
      <div className={"flex flex-col space-y-10"}>
          <Overview reagents={reagents_json}/>
          <ReagentsList reagents={reagents_json} connected={connected}/>
          <Valve reagents={reagents_json}/>
          <ReactionsBuilder reactions={reactions_json}/>
          <CurrentReaction reactions={reactions_json}/>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const ip = reagentsDiv.getAttribute('data-ip');
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp ip={ip}/>);
}
