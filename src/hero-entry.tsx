import { createRoot } from "react-dom/client";
import GGFSpartan from "./GGFSpartan";

const el = document.getElementById("hero-root");
if (el) createRoot(el).render(<GGFSpartan />);
