import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter"; // ⬅️ import Router from wouter
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <Router> {/* ⬅️ wrap App inside Router */}
    <App />
  </Router>
);
