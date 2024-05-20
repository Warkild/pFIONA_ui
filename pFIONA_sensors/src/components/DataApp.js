import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import ExportSpec from "./plugins/Data/ExportSpec";
import LastSpectrum from "./plugins/Data/LastSpectrum";
function DataApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <LastSpectrum/>
          <ExportSpec/>
      </div>
  );
}

document.querySelectorAll("#data_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DataApp/>);
});