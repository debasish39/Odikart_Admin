import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import App from "./App";

import {
  AdminAuthProvider,
} from "./context/AdminAuthContext";

import {
  Toaster,
} from "react-hot-toast";

import "./index.css";


createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <AdminAuthProvider>

      <App />

      <Toaster
        position="top-right"
      />

    </AdminAuthProvider>

  </StrictMode>

);