import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";
import Overview from "../plugins/reagents/Overview";
import ReagentsList from "../plugins/reagents/ReagentsList";
import Valve from "../plugins/reagents/Valve";
import ReactionsBuilder from "../plugins/reagents/ReactionsBuilder";
import CurrentReaction from "../plugins/reagents/CurrentReaction";

function ReagentsApp({ip}) {

  return (
      <div className={"flex flex-col space-y-10"}>
          <Overview reagents={reagents_json}/>
          <ReagentsList reagents={reagents_json}/>
          <Valve ip={ip} reagents={reagents_json}/>
          <ReactionsBuilder ip={ip} reactions={reactions_json}/>
          <CurrentReaction reactions={reactions_json}/>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const ip = reagentsDiv.getAttribute('data-ip');
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp ip={ip}/>);
}