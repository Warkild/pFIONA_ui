import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";
import Overview from "./plugins/Reagents/Overview";
import ReagentsList from "./plugins/Reagents/ReagentsList";
import Valve from "./plugins/Reagents/Valve";

function ReagentsApp({ip, accessToken}) {

  return (
      <div className={"flex flex-col space-y-10"}>
          <Overview reagents={reagents_json}/>
          <ReagentsList reagents={reagents_json}/>
          <Valve ip={ip} accessToken={accessToken} reagents={reagents_json}/>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const ip = reagentsDiv.getAttribute('data-ip');
    const accessToken = reagentsDiv.getAttribute('data-access-token');
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp ip={ip} accessToken={accessToken}/>);
}
