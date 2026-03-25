import React from "react";
import ReactDOM from "react-dom/client";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./features/editor/workers/monacoWorker";
import App from "./app/App";
import ErrorBoundary from "./shared/ui/ErrorBoundary";
import "./styles/index.css";

// Use locally bundled Monaco instead of CDN (avoids corporate network issues)
loader.config({ monaco });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
