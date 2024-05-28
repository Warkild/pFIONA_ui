import React, { useState } from 'react';
import Alert from "../Alert";

function AuxPump({inAction, setInAction, isDeployed}) {
    const [auxPumpRunning, setAuxPumpRunning] = useState(false);

    const turnOnAuxPump = () => {
        const url = `http://${SENSOR_IP}:5000/auxpump/turn_on`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
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
        setAuxPumpRunning(true);
        setInAction(true);
      })
      .catch(error => {
        console.error('Error:', error);
        setAuxPumpRunning(false);
        setInAction(false);
      });
    };

    const turnOffAuxPump = () => {
        const url = `http://${SENSOR_IP}:5000/auxpump/turn_off`;

          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
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
            setAuxPumpRunning(false);
            setInAction(false);
          })
          .catch(error => {
            console.error('Error:', error);
            setAuxPumpRunning(false);
            setInAction(false);
          });
    };

    // Return HTML Code
    return (
        <div className={"w-2/12 flex flex-col"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>AUX PUMP</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
                <div className={"flex flex-col"}>
                    <p className={"text-sm mb-2"}>Current status :</p>
                    <div className={"flex flex-row items-center mb-5"}>
                        <div className={`w-5 h-5 rounded-full ${auxPumpRunning ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <p className={"ml-3"}>{auxPumpRunning ? 'ON' : 'OFF'}</p>
                    </div>
                    {!auxPumpRunning ? (
                        <button
                            className={`rounded-lg font-poppins py-2 mb-5 ${inAction || isDeployed ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'}`}
                            onClick={turnOnAuxPump}
                            disabled={inAction || isDeployed}
                        >
                            Turn ON
                        </button>
                    ) : (
                        <button
                            className="bg-blue-600 rounded-lg text-white font-poppins py-2 mb-5"
                            onClick={turnOffAuxPump}
                        >
                            Turn OFF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuxPump;
