import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import DeployStatus from "../plugins/deploy/DeployStatus";
import DeployBasicSettings from "../plugins/deploy/DeployBasicSettings";
import DeployStatesInformation from "../plugins/deploy/DeployStatesInformation";
import DeployTransport from "../plugins/deploy/DeployTransport";
function DeployApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <DeployStatus/>
          <div className={"flex flex-row justify-between"}>
              <DeployBasicSettings/>
              <DeployStatesInformation/>
          </div>
          <div className={"flex flex-row justify-between"}>
              <DeployTransport/>
          </div>
      </div>
  );
}

document.querySelectorAll("#deploy_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DeployApp/>);
});