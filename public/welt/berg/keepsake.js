// The keepsake of the thinking mountain: when a child reaches a new camp, a picture to save (PNG).
// It shows the mountain as far as the child has climbed (the rest in fog), the new camp with a flag,
// the child's animal, and in a few words what it has done. Nothing is sent anywhere: the picture is
// drawn here on a canvas and saved on this device.
//
//   keepsake({ title, headline, camp, lines, date, brand, animal, camps: [[x, y], …] }) → <canvas>
//   camps: the places of the camps reached (map coordinates, 360 × 450), the last one is new.

const W = 1080;
const H = 1350;
const S = W / 360; // the map is drawn 3 times as big
const INK = "#1b2140";
const PATH = [[70, 448], [100, 404], [228, 386], [270, 348], [150, 326], [112, 296], [220, 282], [246, 242], [152, 226], [132, 196], [206, 172], [214, 138], [166, 116], [180, 70]];

function wrap(g, text, x, y, width, lineHeight, draw = true) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) {
      if (draw) g.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else line = next;
  }
  if (line && draw) g.fillText(line, x, y);
  return y + lineHeight;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function keepsake({ title, headline, camp, lines, date, brand, animal, camps }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const font = (size, weight = 800) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const P = (x, y) => [x * S, y * S];

  // The sky and the mountain in four heights (as on the map).
  g.fillStyle = "#cfeaff";
  g.fillRect(0, 0, W, H);
  // The new camp sits low in the picture, under the words; the map moves up for that.
  const [nx, ny] = camps.at(-1);
  const shift = Math.min(0, H * 0.74 - ny * S);
  g.save();
  g.translate(0, shift);
  g.fillStyle = "#ffc83a";
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.beginPath();
  g.arc(306 * S, 52 * S, 66, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.save();
  g.beginPath();
  g.moveTo(...P(-20, 450));
  g.lineTo(...P(180, 36));
  g.lineTo(...P(380, 450));
  g.closePath();
  g.clip();
  for (const [y, color] of [[0, "#fff"], [150, "#9aa5b4"], [262, "#a7d68c"], [352, "#b9e5a0"]]) {
    g.fillStyle = color;
    g.fillRect(0, y * S, W, H);
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(...P(-20, 450));
  g.lineTo(...P(180, 36));
  g.lineTo(...P(380, 450));
  g.stroke();

  // Below the map: more meadow (the picture shows the map moved up).
  g.fillStyle = "#b9e5a0";
  g.fillRect(0, 450 * S - 2, W, -shift + 4);
  // The path, as far as the new camp.
  const upTo = PATH.findIndex(([x, y]) => x === nx && y === ny);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "#e3c79a";
  g.lineWidth = 27;
  g.beginPath();
  PATH.slice(0, upTo + 1).forEach(([x, y], i) => (i ? g.lineTo(...P(x, y)) : g.moveTo(...P(x, y))));
  g.stroke();

  // The fog above.
  const fogY = (ny - 34) * S;
  g.fillStyle = "rgba(238, 242, 246, 0.82)";
  g.fillRect(0, -shift, W, fogY + shift);
  g.fillStyle = "#eef2f6";
  for (let x = -30; x <= W + 30; x += 100) {
    g.beginPath();
    g.ellipse(x, fogY, 78, 38, 0, 0, Math.PI * 2);
    g.fill();
  }

  // The camps: tents, a flag on the new one, the animal next to it.
  camps.forEach(([x, y], i) => {
    const [cx, cy] = P(x, y);
    g.fillStyle = "#ff5a36";
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(cx - 39, cy + 6);
    g.lineTo(cx, cy - 60);
    g.lineTo(cx + 39, cy + 6);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.moveTo(cx, cy - 60);
    g.lineTo(cx - 12, cy + 6);
    g.lineTo(cx + 12, cy + 6);
    g.closePath();
    g.fill();
    if (i === camps.length - 1) {
      g.font = font(84, 400);
      g.textAlign = "center";
      g.fillText("🚩", cx + 10, cy - 70);
      g.fillText(animal, cx + 110, cy + 20);
    } else {
      g.font = font(48, 400);
      g.textAlign = "center";
      g.fillText("🏮", cx + 50, cy - 40);
    }
  });

  g.restore();

  // The card with the words, at the top (in the fog, where there is room).
  const top = 50;
  const words = (draw) => {
    g.textAlign = "left";
    g.fillStyle = "#e8488a";
    g.font = font(34);
    if (draw) g.fillText(title.toUpperCase(), 110, top + 76);
    g.fillStyle = INK;
    g.font = font(60);
    let y = wrap(g, headline, 110, top + 150, W - 220, 66, draw);
    g.font = font(44, 700);
    y = wrap(g, camp, 110, y + 4, W - 220, 52, draw);
    g.font = font(36, 600);
    for (const line of lines) y = wrap(g, line, 110, y + 6, W - 220, 46, draw);
    return y;
  };
  const cardH = words(false) - top - 10;
  roundRect(g, 60, top, W - 120, cardH, 36);
  g.fillStyle = "#fff";
  g.fill();
  g.lineWidth = 9;
  g.strokeStyle = INK;
  g.stroke();
  words(true);

  // At the bottom: the date and where it is from.
  roundRect(g, 60, H - 130, W - 120, 84, 30);
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fill();
  g.fillStyle = INK;
  g.font = font(34, 700);
  g.textAlign = "left";
  g.fillText(date, 100, H - 76);
  g.textAlign = "right";
  g.fillText(brand, W - 100, H - 76);
  return canvas;
}
