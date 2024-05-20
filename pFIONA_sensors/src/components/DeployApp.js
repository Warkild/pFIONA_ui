import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import DeployStatus from "./plugins/Deploy/DeployStatus";
import DeployBasicSettings from "./plugins/Deploy/DeployBasicSettings";
function DeployApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <DeployStatus/>
          <DeployBasicSettings/>
      </div>
  );
}

document.querySelectorAll("#deploy_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DeployApp/>);
});