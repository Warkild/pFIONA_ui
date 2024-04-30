import React, { Component } from "react";
import { render } from "react-dom";
import ValvePort from "./plugins/ValvePort";
import {createRoot} from "react-dom/client";
import Pumps from "./plugins/Pumps";

export default class ManualControlApp extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"flex justify-between"}>
        <ValvePort />
        <Pumps/>
      </div>
    );
  }
}

const appDiv = document.getElementById("app");
const root = createRoot(appDiv); // Créez une racine.
root.render(<ManualControlApp />); // Utilisez root.render pour monter votre composant
