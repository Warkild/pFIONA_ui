import ManualControlApp from "./components/pages/ManualControlApp";
import StatusApp from "./components/plugins/universal/StatusApp";
import ReagentsApp from "./components/pages/ReagentsApp";
import ReactionAddApp from "./components/pages/ReactionAddApp";
import ReactionEditApp from "./components/pages/ReactionEditApp";
import DataApp from "./components/pages/DataApp";
import DeployApp from "./components/pages/DeployApp";
import LogAndDatabase from "./components/plugins/universal/LogAndDatabase";
import EmergencyStopAndRestart from "./components/plugins/universal/EmergencyStopAndRestart";
import { useState } from "react";

// Function to fetch and store JWT tokens
function fetchAndStoreJwt() {
  fetch('/jwt/', { // Make sure the URL is correct
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Include cookies if authentication is done via cookies
  })
  .then(response => response.json())
  .then(data => {
    console.log('Access Token:', data.access_token); // Log the token for debugging
    sessionStorage.setItem('accessToken', data.access_token); // Store the token in sessionStorage
  })
  .catch(error => console.error('Error fetching JWT tokens:', error)); // Log any errors during the fetch process
}

// Call the function when the application loads
fetchAndStoreJwt();
