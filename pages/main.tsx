import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemeStudio } from "@/components/meme-studio";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing root");

createRoot(root).render(
  <StrictMode>
    <MemeStudio />
  </StrictMode>,
);
