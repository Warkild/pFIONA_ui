import React, {useEffect, useState} from "react";
import { createRoot } from "react-dom/client";
import ExportSpec from "../plugins/data/ExportSpec";
import AbsorbanceChart from "../plugins/data/AbsorbanceChart";
import ConcentrationChart from "../plugins/data/ConcentrationChart";
import MultiStandardChart from "../plugins/data/MultiStandardChart";
import SpectrumChart from "../plugins/data/SpectrumChart";
function DataApp({  }) {


  return (
      <div className={"flex flex-col space-y-10"}>
          <SpectrumChart/>
          <ExportSpec/>
          <AbsorbanceChart/>
          <ConcentrationChart/>
          <MultiStandardChart/>
      </div>
  );
}

document.querySelectorAll("#data_app").forEach(div => {
    const root = createRoot(div);
    root.render(<DataApp/>);
});