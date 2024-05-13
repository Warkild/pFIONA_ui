import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import ExportSpec from "./plugins/Data/ExportSpec";
function DataApp({  }) {


  return (
      <ExportSpec/>
  );
}

document.querySelectorAll("#data_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DataApp/>);
});