import React, {Component, useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import {waitFor} from "@babel/core/lib/gensync-utils/async";

function StatusApp({ ip, accessToken   }) {

    const [connected, setConnected] = useState(false);

    const checkStatus = () => {
        fetch(`http://${ip}:5000/sensor/get_state`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            console.log(new Date().toLocaleTimeString())
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
    const accessToken = div.getAttribute('data-access-token');
    const root = createRoot(div);
    root.render(<StatusApp ip={ip} accessToken={accessToken}/>);
});