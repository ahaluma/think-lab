// The boards of the summit's own families (ideas/gipfel/tasks.js): the shared camp board
// (berg/camp.js), with the number wall of camp 12 for "mauerwaage". Texts: welt/lang under "gipfel".

import { campBoards } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";
import { picture } from "../mauer/boards.js";

export const TOOLS = { zaun: "🪵", stall: "🐔", rueck: "⏪", regel: "🐜", haken: "✔️", paar: "👫", waage: "⚖️", mauer: "🧱", probe: "🧪" };

export const BOARDS = campBoards("gipfel", { TOOLS, DIGITS, picture });
