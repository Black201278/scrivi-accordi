import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// all’inizio del file main.tsx o App.tsx
window.onerror = (message, source, lineno, colno, error) => {
  const msg = `Errore: ${message}\nFile: ${source}:${lineno}:${colno}\n${error?.stack}`;
  alert(msg);
  // oppure per stamparlo in pagina:
  const pre = document.createElement("pre");
  pre.style.position = "fixed";
  pre.style.top = "0";
  pre.style.left = "0";
  pre.style.right = "0";
  pre.style.background = "rgba(0,0,0,0.85)";
  pre.style.color = "white";
  pre.style.padding = "8px";
  pre.style.zIndex = "9999";
  pre.textContent = msg;
  document.body.append(pre);
  return false;
};
