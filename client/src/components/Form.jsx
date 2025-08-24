import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

function Form() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");

  const { username } = useParams();

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID & username is required");
      return;
    }

    // Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const str = "DevNest";
  const alphabetArray = str.split("");

  return (
    <div className="bg-[#1d1a19] text-white p-6 rounded-lg">
      <div className="flex items-center justify-center cursor-pointer pb-2">
        <img src="/logo.png" alt=" Logo" className="size-8 hover:scale-125" />
        {alphabetArray.map((char, index) => (
          <span
            className="text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-bold hover:scale-125"
            key={index}
          >
            {char}
          </span>
        ))}
      </div>
      <h4 className="mb-2">Generate new room or paste invitation ROOM ID</h4>
      <div className="inputGroup">
        <input
          type="text"
          className="inputBox"
          placeholder="ROOM ID"
          onChange={(e) => setRoomId(e.target.value)}
          value={roomId}
          onKeyUp={handleInputEnter}
        />
        <button className="btn joinBtn" onClick={joinRoom}>
          Join
        </button>
        <span className="createInfo">
          If you don't have an invite then create &nbsp;
          <Link onClick={createNewRoom} href="" className="createNewBtn">
            new room
          </Link>
        </span>
      </div>
    </div>
  );
}

export default Form;
