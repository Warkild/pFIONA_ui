import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import ExportSpec from "../plugins/data/ExportSpec";
import LastSpectrum from "../plugins/data/LastSpectrum";
import AbsorbanceChart from "../plugins/data/AbsorbanceChart";
function DataApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <LastSpectrum/>
          <ExportSpec/>
          <AbsorbanceChart/>
      </div>
  );
}

document.querySelectorAll("#data_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DataApp/>);
});