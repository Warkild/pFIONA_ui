import React, { useState } from 'react';

function HomePage() {
    const [isOn, setIsOn] = useState(false);

    const toggleButton = () => {
        setIsOn(!isOn);
        console.log(isOn);
    };

    const sendPostRequest = async () => {
        try {
            const response = await fetch('https://www.toptal.com/developers/postbin/1713912855313-3393995284568', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Hello from React!' })
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <button onClick={toggleButton}>
                {isOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={sendPostRequest}>
                API
            </button>
        </div>
    );
}

export default HomePage;
