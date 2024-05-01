import React, { Component } from "react";
import { render } from "react-dom";
import ValvePort from "./plugins/ValvePort";
import {createRoot} from "react-dom/client";
import Pumps from "./plugins/Pumps";
import Spectrophotometer from "./plugins/Spectrophotometer";

export default class ManualControlApp extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div className={"flex flex-col"}>
            <div className={"flex flex-row justify-between pb-12"}>
                <ValvePort/>
                <Pumps/>
            </div>
            <div className={"flex flex-row justify-between"}>
                <Spectrophotometer/>
            </div>
        </div>


    );
  }
}

const appDiv = document.getElementById("app");
const root = createRoot(appDiv); // Créez une racine.
root.render(<ManualControlApp />); // Utilisez root.render pour monter votre composant
