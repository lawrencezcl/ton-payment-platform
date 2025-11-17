import { Buffer } from "buffer/";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Polyfill Buffer for TON SDK
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
