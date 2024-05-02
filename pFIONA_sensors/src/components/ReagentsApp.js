import React, { Component, useState } from "react";
import { createRoot } from "react-dom/client";

function ReagentsApp() {

  return (
      <div className={"flex flex-col"}>
          <p>Reagents app</p>
      </div>
  );
}

const reagentsDiv = document.getElementById("reagents_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReagentsApp />);
}
