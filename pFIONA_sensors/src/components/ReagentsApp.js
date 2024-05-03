import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";
import Overview from "./plugins/Reagents/Overview";
import ReagentsList from "./plugins/Reagents/ReagentsList";

function ReagentsApp() {

  return (
      <div className={"flex flex-col space-y-10"}>
          <Overview reagents={reagents_json}/>
          <ReagentsList reagents={reagents_json}/>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp />);
}
