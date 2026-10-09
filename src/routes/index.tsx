import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import reactLogo from "../assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "../App.css";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [name, setName] = useState("");

  const greet = useMutation({
    mutationFn: (name: string) => invoke<string>("greet", { name }),
  });

  return (
    <main className="container">
      <h1>Welcome to Tauri + React + Vite</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet.mutate(name);
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greet.data}</p>
    </main>
  );
}
