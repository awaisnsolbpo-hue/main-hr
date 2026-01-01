import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validate environment variables before starting the app
import "./config/env";

createRoot(document.getElementById("root")!).render(<App />);
