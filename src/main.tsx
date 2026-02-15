import React from "react";
import ReactDOM from "react-dom/client";
import "./lib/i18n";
import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
