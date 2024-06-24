import ManualControlApp from "./components/pages/ManualControlApp";
import StatusApp from "./components/plugins/universal/StatusApp";
import ReagentsApp from "./components/pages/ReagentsApp"
import ReactionAddApp from "./components/pages/ReactionAddApp"
import ReactionEditApp from "./components/pages/ReactionEditApp"
import DataApp from "./components/pages/DataApp"
import DeployApp from "./components/pages/DeployApp"
import EmergencyStopAndRestart from "./components/plugins/universal/EmergencyStopAndRestart";
import {useState} from "react";

// Fonction pour obtenir les JWT tokens
function fetchAndStoreJwt() {
  fetch('http://127.0.0.1:8000/jwt/', { // Assurez-vous que l'URL est correcte
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Pour inclure les cookies si l'authentification se fait via des cookies
  })
  .then(response => response.json())
  .then(data => {
    console.log('Access Token:', data.access_token); // Log du token pour le debug
    sessionStorage.setItem('accessToken', data.access_token); // Stockage du token dans le sessionStorage
  })
  .catch(error => console.error('Error fetching JWT tokens:', error));
}

// Appel de la fonction au chargement de l'application
fetchAndStoreJwt();