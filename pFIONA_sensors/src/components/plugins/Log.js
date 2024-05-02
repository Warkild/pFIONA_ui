import React, { useState } from 'react';
import Alert from "./Alert";

function Log({ messages }) {
  return (
    <div className={"w-full"}>
        <div className={"mb-5"}>
            <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>LOG</h2>
        </div>
        <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-5 px-8"}>
            {messages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
    </div>
  );
}


export default Log;
