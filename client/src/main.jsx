import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ⬅️ import BrowserRouter
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter> {/* ⬅️ wrap App inside BrowserRouter */}
    <App />
  </BrowserRouter>
);
