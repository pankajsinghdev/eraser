"use client";

import axios from "axios";
import { useState } from "react";
import { BACKEND_URL } from "../config";
import { useRouter } from "next/navigation";

export function AuthPage({ isSignIn }: { isSignIn: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const route = useRouter();

  const authToken = localStorage.getItem("authToken");
  // if (!!authToken) {
  //   route.push(`/canvas`);
  // }

  const handleClick = async () => {
    const response = await axios.post(`${BACKEND_URL}/signin`, {
      email: email,
      password: password,
    });

    const user = response.data.user;
    const token = response.data.token;
    localStorage.setItem("authToken", token);
    // if(!!token) {
    //       route.push(`/canvas`);

    // }
  };

  return (
    <div className="flex w-full h-full justify-center items-center ">
      <div className="p-2 m-2 flex flex-col gap-2 rounded">
        <input
          type="text"
          placeholder="Email"
          className="p-2 m-2 rounded-b-md focus:outline-2 "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        ></input>
        <input
          type="text"
          placeholder="Password"
          className="p-2 m-2 focus:outline-2 rounded-b-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        ></input>
        <button
          className="p-2 m-2 rounded-md cursor-pointer bg-blue-500"
          onClick={handleClick}
        >
          {isSignIn ? "Sign in" : "Signup"}
        </button>
      </div>
    </div>
  );
}
