// Privacy policy page. Texts per language in lang/<code>.js, contact details in contact.js.
import { texts, fill, lang, LANGS, DEFAULT_LANG } from "../shared/i18n.js";
import { icons } from "../shared/kit.js";
import { CONTACT, UPDATED } from "./contact.js";

const T = await texts(import.meta.url);
fill(T);
document.title = `${T.title} · AnkaPlay`;
document.getElementById("home").innerHTML = icons.home;

const el = (tag, text) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
};

const [y, m, d] = UPDATED.split("-").map(Number);
const text = document.getElementById("text");
text.append(el("p", T.updated(new Date(y, m - 1, d).toLocaleDateString(LANGS[lang].voice))));
if (lang !== DEFAULT_LANG && T.note) text.append(el("p", T.note));

for (const s of T.sections(CONTACT)) {
  text.append(el("h2", s.h));
  for (const p of s.p || []) text.append(el("p", p));
  if (s.list) {
    const ul = el("ul");
    for (const item of s.list) ul.append(el("li", item));
    text.append(ul);
  }
}
