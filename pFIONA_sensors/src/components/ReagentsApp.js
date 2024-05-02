import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";
import Overview from "./plugins/Reagents/Overview";

function ReagentsApp() {

  return (
      <div className={"flex flex-col"}>
          <Overview/>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp />);
}
