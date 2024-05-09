import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Alert from "./plugins/Alert";

function ReactionAddApp() {
  const [reagents, setReagents] = useState([{ reagentId: "", volume: "" }]);
  const [reactionName, setReactionName] = useState(""); // État pour le nom de la réaction

  const handleChange = (index, field, value) => {
    const newReagents = reagents.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setReagents(newReagents);
  };

  useEffect(() => {
    const lastReagent = reagents[reagents.length - 1];
    if (lastReagent.reagentId && lastReagent.volume) {
      setReagents([...reagents, { reagentId: "", volume: "" }]);
    }
  }, [reagents]);

  const handleRemoveReagent = (index) => {
    setReagents(reagents.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const reagentData = reagents.map(reagent => [reagent.reagentId, reagent.volume]);
    const reactionData = {
      name: reactionName,
      reagents: reagentData
    };
    if (reactionName === "") {
        setAlertModalText("The reaction must have a name")
        setIsModalOpen(true)
    } else if (reagentData.length === 1 || reagentData[0].volume === "" || reagentData[0].reagentId === "") {
        setAlertModalText("At least one reagent must be correctly entered.")
        setIsModalOpen(true)
    } else {
        console.log(reactionData);
    }
  };

    /** ALERT BOX **/

    // Alert Box state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alertModalText, setAlertModalText] = useState("");

    // Alert box close
    const closeModal = () => {
        setIsModalOpen(false);
    };

  return (
      <div className="w-full">
          <div className="mb-5">
              <h2 className="font-poppins font-bold text-gray-500 text-sm">ADD REACTION</h2>
          </div>
          <div className="flex flex-row flex-wrap font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8">
              <div className={"pb-8 w-full"}>
                  <label>Name</label>
                  <input
                      type="text"
                      value={reactionName}
                      onChange={(e) => setReactionName(e.target.value)}
                      placeholder="Reaction Name"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  />
              </div>
              <div className="flex flex-col space-y-4 w-full pb-10">
                  <label>Actions</label>
                  {reagents.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                          <select
                              value={item.reagentId}
                              onChange={(e) => handleChange(index, "reagentId", e.target.value)}
                              className="mt-1 block w-8/12 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                              <option value="">Select a Reagent</option>
                              {reagents_json.map((reagent) => (
                                  <option key={reagent.id} value={reagent.id}>
                                      {'Add ' + reagent.name}
                                  </option>
                              ))}
                          </select>
                          <div className={"w-1/12"}></div>
                          <input
                              type="number"
                              value={item.volume}
                              onChange={(e) => handleChange(index, "volume", e.target.value)}
                              placeholder="Volume (μL)"
                              className="mt-1 block w-2/12 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          />
                          {index !== reagents.length - 1 && (
                              <button
                                  onClick={() => handleRemoveReagent(index)}
                                  className="text-red-700 px-4 py-2 w-1/12"
                              >
                                  Remove
                              </button>
                          )}
                      </div>
                  ))}
              </div>
              <button
                  onClick={handleSave}
                  className="bg-lime-500 text-white font-poppins px-8 py-2 mb-2 rounded-md hover:bg-lime-300"
              >
                  Save Reaction
              </button>
          </div>
          <Alert isOpen={isModalOpen} onRequestClose={closeModal} text={alertModalText} />
      </div>
  );
}

const reagentsDiv = document.getElementById("reaction_add_app");
if (reagentsDiv) {
    const root = createRoot(reagentsDiv);
    root.render(<ReactionAddApp/>);
}
