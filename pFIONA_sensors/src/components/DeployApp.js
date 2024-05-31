import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import DeployStatus from "./plugins/Deploy/DeployStatus";
import DeployBasicSettings from "./plugins/Deploy/DeployBasicSettings";
import DeployStatesInformation from "./plugins/Deploy/DeployStatesInformation";
function DeployApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <DeployStatus/>
          <div className={"flex flex-row justify-between"}>
              <DeployBasicSettings/>
              <DeployStatesInformation/>
          </div>
      </div>
  );
}

document.querySelectorAll("#deploy_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DeployApp/>);
});