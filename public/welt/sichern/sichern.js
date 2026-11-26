// For parents: save everything AnkaPlay keeps on this device (children, progress, the world) to a
// file, and load such a file again, for example on a new phone. The family moves the file; the app
// sends nothing anywhere. Also asks the browser to keep its storage for good.
//
// The file: { app: "AnkaPlay", v: 1, saved: "2026-11-26", data: { "thinklab:profiles": "…", … } }
// data holds every localStorage entry whose key starts with "thinklab:", exactly as stored.

import { icons } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";

const T = await texts(new URL("../map.js", import.meta.url).href);
fill(T);
const B = T.backup;
const $ = (id) => document.getElementById(id);
const PREFIX = "thinklab:";

document.title = `${B.title} · AnkaPlay`;
$("home").innerHTML = icons.home;
$("title").textContent = B.title;
$("note").textContent = B.note;
$("save").textContent = B.save;
$("load").textContent = B.load;
$("keepNote").textContent = B.keepNote;
$("keep").textContent = B.keep;

function today() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

$("save").addEventListener("click", () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) data[key] = localStorage.getItem(key);
  }
  const file = new Blob([JSON.stringify({ app: "AnkaPlay", v: 1, saved: today(), data }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = `ankaplay-${today()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $("status").textContent = B.saved;
});

/** Only a file this page made: the right marker, and every entry a "thinklab:" key with JSON text. */
function valid(file) {
  if (!file || file.app !== "AnkaPlay" || file.v !== 1 || typeof file.data !== "object" || file.data === null) return false;
  return Object.entries(file.data).every(([key, value]) => {
    if (!key.startsWith(PREFIX) || typeof value !== "string") return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  });
}

$("load").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", async () => {
  const chosen = $("file").files[0];
  $("file").value = "";
  if (!chosen) return;
  let file = null;
  try {
    file = JSON.parse(await chosen.text());
  } catch {
    /* not JSON: handled below */
  }
  if (!valid(file)) return void ($("status").textContent = B.bad);
  if (!confirm(B.confirm)) return;
  const old = [];
  for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i).startsWith(PREFIX)) old.push(localStorage.key(i));
  for (const key of old) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(file.data)) localStorage.setItem(key, value);
  $("status").textContent = B.loaded;
});

$("keep").addEventListener("click", async () => {
  const kept = (await navigator.storage?.persist?.()) === true;
  $("keepStatus").textContent = kept ? B.kept : B.notKept;
});
