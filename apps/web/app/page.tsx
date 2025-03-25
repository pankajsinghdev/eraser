"use client";

import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [slug, setSlug] = useState("");
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Room Id"
        type="text"
        style={{
          padding: 10,
        }}
      ></input>
      <button
        style={{
          padding: 10,
        }}
        onClick={() => router.push(`/room/${slug}`)}
      >
        Submit
      </button>
    </div>
  );
}
