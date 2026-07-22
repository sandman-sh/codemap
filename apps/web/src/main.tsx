import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@codemapai/api-client";
import { getApiBaseUrl } from "./lib/api-url";

setBaseUrl(getApiBaseUrl() || null);

createRoot(document.getElementById("root")!).render(<App />);
