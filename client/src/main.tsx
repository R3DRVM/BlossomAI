import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/dev/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
