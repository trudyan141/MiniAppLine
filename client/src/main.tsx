import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeLINE } from "./lib/line";

// Get base path from Vite config
const BASE_PATH = import.meta.env.BASE_URL || "/MiniAppLine/";
console.log("Base path:", BASE_PATH);

// Initialize LINE LIFF SDK
async function start() {
  try {
    const liffId = import.meta.env.VITE_LIFF_ID;
    if (!liffId) {
      console.error("Missing VITE_LIFF_ID environment variable");
    }
    
    const liff = await initializeLINE(liffId);
    
    createRoot(document.getElementById("root")!).render(
      <App liff={liff} basePath={BASE_PATH} />
    );
  } catch (error) {
    console.error("Failed to initialize application:", error);
    
    // Render the app even if LIFF fails to initialize
    createRoot(document.getElementById("root")!).render(
      <App liff={null} basePath={BASE_PATH} />
    );
  }
}

start();
