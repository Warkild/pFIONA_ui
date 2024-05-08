import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";
import ValvePort from "./plugins/ManualControl/ValvePort";
import Pumps from "./plugins/ManualControl/Pumps";
import Spectrophotometer from "./plugins/ManualControl/Spectrophotometer";
import AuxPump from "./plugins/ManualControl/AuxPump";
import PreEstablishedScan from "./plugins/ManualControl/PreEstablishedScan";
import Log from "./plugins/ManualControl/Log";

function ManualControlApp() {
  const [logMessages, setLogMessages] = useState([]);

  const addLogMessage = (message) => {
    setLogMessages(prev => [...prev, message]);
  };

  return (
      <div className={"flex flex-col"}>
          <div className={"flex flex-row justify-between pb-12"}>
              <Log messages={logMessages}/>
          </div>
          <div className={"flex flex-row justify-between pb-12"}>
              <ValvePort/>
              <Pumps/>
          </div>
          <div className={"flex flex-row justify-between pb-12"}>
              <Spectrophotometer addLogMessage={addLogMessage}/>
              <AuxPump/>
          </div>
          <div className={"flex flex-row justify-between"}>
              <PreEstablishedScan/>
          </div>
      </div>
  );
}

const manualControlDiv = document.getElementById("manual_control_app");
if (manualControlDiv) {
    const root = createRoot(manualControlDiv);
    root.render(<ManualControlApp />);
}
