import React, { useState, useEffect } from 'react';
import Alert from "../Alert";

const ValvePort = ({ numberOfPorts = 8, inAction, setInAction, isDeployed }) => {
  // Get value of current valve in sensor
  const [currentVal, setCurrentVal] = useState('-');

  // Alert Box state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selected port state
  const [selectedPort, setSelectedPort] = useState(null);

  const handleClick = (port) => {
    if (inAction || isDeployed) return;
    setSelectedPort(port);
    handleMoveClick(port);
  };

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
        setCurrentVal('Air');
        setSelectedPort('Air');
      } else {
        setCurrentVal(data.message);
        setSelectedPort(data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleMoveClick = (port) => {
    if (port <= 0) {
      setIsModalOpen(true);
    } else {
      const url = `http://${SENSOR_IP}:5000/valve/change_valve`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          "valve_number": parseInt(port)
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        setCurrentVal(port.toString());
        setSelectedPort(port);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
  };

  const handleMoveAirPortClick = () => {
    const url = `http://${SENSOR_IP}:5000/valve/go_air_port`;

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
      setCurrentVal('Air');
      setSelectedPort('Air');
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

  const ports = [8, 7, 6, 5, 4, 3, 2, 1]; // Order for counterclockwise starting from 8

  return (
    <div className={"w-1/6 flex flex-col"}>
      <div className={"mb-5"}>
        <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>VALVE</h2>
      </div>
      <div className={"bg-white shadow-lg rounded-2xl py-5 px-8 h-full"}>
        <div className={"flex flex-col"}>
          <>
            <button
              className={`${!inAction && !isDeployed ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"} rounded-lg font-poppins py-1`}
              onClick={handleMoveAirPortClick}
              disabled={inAction || isDeployed}
            >
              Move to air port
            </button>
          </>
        </div>
        <div className="relative w-40 h-40 flex items-center justify-center mx-auto mt-5">
          {ports.map((port, index) => {
            const angle = (index / numberOfPorts) * 2 * Math.PI - Math.PI / 2; // Adjusted for counterclockwise order starting at 8
            const x = Math.cos(angle) * 65;
            const y = Math.sin(angle) * 65;

            return (
              <div
                key={port}
                onClick={() => handleClick(port)}
                className={`absolute w-7 h-7 rounded-full cursor-pointer flex items-center justify-center
                  ${selectedPort == port ? 'bg-blue-900 text-white' : 'bg-blue-200 text-black'}
                  ${inAction || isDeployed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {port}
              </div>
            );
          })}
        </div>
      </div>
      <Alert isOpen={isModalOpen} onRequestClose={closeModal}/>
    </div>
  );
};

export default ValvePort;
