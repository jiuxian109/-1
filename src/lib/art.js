// 代码内插画生成器：所有「照片/封面」都是同一套扁平图形语言，用主题色绘制。
// 无外部图片依赖（离线可运行）。这是插画，非真实照片。
const P = {
  ink: '#17150F',
  inkSoft: '#2E2A20',
  accent: '#2450E6',
  accentDark: '#1A3AA6',
  paper: '#EDE9DF',
  paper2: '#E1DCCE',
  white: '#FDFCF9'
}

function rnd(seed) {
  let x = 0
  const s = String(seed || 'x')
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0
  return function () {
    x = (x * 1664525 + 1013904223) >>> 0
    return x / 4294967296
  }
}

function rect(x, y, w, h, c, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`
}
function circle(cx, cy, r, c) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`
}
function line(x1, y1, x2, y2, c, w = 6) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`
}
function person(x, y, h, bodyC, headC, armsUp) {
  const hr = h * 0.14
  const headY = y - h + hr
  const bodyH = h - hr
  let s = `<circle cx="${x}" cy="${headY}" r="${hr}" fill="${headC}"/>`
  s += `<rect x="${x - h * 0.2}" y="${headY + hr * 0.4}" width="${h * 0.4}" height="${bodyH}" rx="${h * 0.12}" fill="${bodyC}"/>`
  if (armsUp) {
    s += line(x - h * 0.2, y - h * 0.55, x - h * 0.5, y - h * 0.95, bodyC, h * 0.09)
    s += line(x + h * 0.2, y - h * 0.55, x + h * 0.5, y - h * 0.95, bodyC, h * 0.09)
  }
  return s
}
function stars(seed, n, w, h) {
  const r = rnd(seed)
  let s = ''
  for (let i = 0; i < n; i++) s += circle(8 + r() * (w - 16), 8 + r() * h * 0.5, 1.2 + r() * 1.8, P.white)
  return s
}

const SCENES = {
  dance(r) {
    let s = rect(0, 0, 400, 300, P.paper) + rect(0, 250, 400, 50, P.paper2)
    s += rect(300, 150, 76, 76, P.ink, 8) + circle(338, 188, 18, P.accent) + circle(338, 188, 7, P.ink)
    s += person(110, 262, 120, P.accent, P.ink, true) + person(200, 268, 132, P.ink, P.paper, true)
    s += line(40, 226, 90, 226, P.accent, 7) + line(30, 206, 60, 206, P.ink, 7)
    return s
  },
  music(r) {
    let s = rect(0, 0, 400, 300, P.paper) + rect(0, 252, 400, 48, P.paper2)
    const xs = [70, 120, 170, 220, 270, 320]
    for (let i = 0; i < xs.length; i++) {
      const cy = 160 + Math.sin(i / (xs.length - 1) * Math.PI) * -50
      s += circle(xs[i], cy, 30, i % 2 ? P.ink : P.accent)
      s += rect(xs[i] - 26, cy + 26, 52, 90, i % 2 ? P.accent : P.ink, 12)
    }
    s += circle(360, 80, 14, P.accent) + rect(370, 40, 8, 56, P.accent, 4)
    s += circle(330, 110, 11, P.ink) + rect(338, 76, 6, 42, P.ink, 3)
    return s
  },
  photo(r) {
    let s = rect(0, 0, 400, 300, P.ink)
    s += rect(70, 100, 260, 160, P.white, 14) + rect(110, 60, 120, 50, P.white, 10)
    s += circle(200, 190, 56, P.accent) + circle(200, 190, 34, P.ink) + circle(200, 190, 12, P.white) + circle(150, 210, 8, P.white)
    s += rect(90, 120, 90, 64, P.paper)
    s += `<polygon points="90,184 120,140 145,168 165,146 180,184" fill="${P.accentDark}"/>`
    s += circle(120, 138, 8, P.white)
    return s
  },
  debate(r) {
    let s = rect(0, 0, 400, 300, P.paper) + rect(0, 250, 400, 50, P.paper2)
    s += rect(60, 170, 110, 80, P.ink, 8) + rect(230, 170, 110, 80, P.accent, 8)
    s += rect(80, 140, 70, 30, P.ink, 6) + rect(250, 140, 70, 30, P.accent, 6)
    s += person(115, 200, 90, P.ink, P.paper) + person(285, 200, 90, P.accent, P.paper)
    s += rect(40, 40, 90, 44, P.white, 14) + `<polygon points="60,84 70,96 84,84" fill="${P.white}"/>`
    s += rect(270, 30, 90, 44, P.white, 14) + `<polygon points="330,74 340,86 354,74" fill="${P.white}"/>`
    return s
  },
  basketball(r) {
    let s = rect(0, 0, 400, 300, P.accent) + rect(0, 250, 400, 50, P.paper2)
    s += rect(300, 60, 70, 90, P.white, 6) + circle(335, 165, 22, P.ink) + line(320, 150, 350, 150, P.white, 4)
    s += person(150, 250, 130, P.ink, P.paper, true)
    s += circle(220, 200, 34, '#E9742C')
    s += line(196, 186, 244, 214, P.ink, 4) + line(196, 214, 244, 186, P.ink, 4) + line(220, 168, 220, 232, P.ink, 4)
    s += line(20, 260, 280, 260, P.white, 6)
    return s
  },
  volunteer(r) {
    let s = rect(0, 0, 400, 300, P.paper) + rect(0, 250, 400, 50, P.paper2)
    s += rect(210, 150, 6, 100, P.ink, 3)
    s += `<ellipse cx="213" cy="150" rx="30" ry="14" fill="${P.accent}"/>`
    s += `<ellipse cx="213" cy="118" rx="22" ry="12" fill="${P.accentDark}"/>`
    s += rect(150, 120, 40, 130, P.ink, 16) + circle(150, 120, 20, P.accent)
    s += rect(150, 140, 40, 130, P.accent, 16) + circle(190, 120, 20, P.ink)
    return s
  },
  astronomy(r) {
    let s = rect(0, 0, 400, 300, P.accentDark) + stars('astro' + r(), 40, 400, 300)
    s += circle(320, 70, 44, P.white) + circle(340, 56, 40, P.accentDark)
    s += rect(150, 90, 180, 46, P.ink, 20) + circle(150, 113, 26, P.accent)
    s += line(200, 136, 200, 190, P.ink, 8) + line(160, 190, 240, 190, P.ink, 8)
    s += line(200, 190, 160, 250, P.ink, 8) + line(200, 190, 240, 250, P.ink, 8)
    return s
  },
  hanfu(r) {
    let s = rect(0, 0, 400, 300, P.paper) + rect(0, 250, 400, 50, P.paper2)
    s += `<polygon points="180,120 130,250 230,250" fill="${P.accent}"/>`
    s += `<polygon points="150,150 200,150 210,250 140,250" fill="${P.ink}"/>`
    s += circle(180, 105, 30, P.paper) + rect(150, 60, 60, 34, P.ink, 6)
    s += circle(280, 150, 44, P.white) + line(280, 194, 280, 250, P.ink, 6) + circle(280, 150, 30, P.accent)
    return s
  },
  stage(r) {
    let s = rect(0, 0, 400, 300, P.ink)
    const t = [P.accent, P.ink, P.paper]
    for (let i = 0; i < 8; i++) {
      const x = 10 + i * 50
      s += `<polygon points="${x},40 ${x + 40},40 ${x + 20},78" fill="${t[i % 3]}"/>`
    }
    s += rect(0, 220, 400, 80, P.paper2) + rect(150, 150, 100, 70, P.accent, 8)
    s += rect(168, 168, 64, 12, P.white, 5) + rect(168, 186, 48, 12, P.white, 5)
    return s
  }
}

// 别名：type 字段用 sport/science，映射到对应插画
SCENES.sport = SCENES.basketball
SCENES.science = SCENES.astronomy

function svgWrap(inner, w, h) {
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`
}

export const ART = {
  scene(type, seed, w = 400, h = 300) {
    const fn = SCENES[type] || SCENES.stage
    return svgWrap(fn(rnd(seed)), w, h)
  },
  cover(type, seed) {
    const fn = SCENES[type] || SCENES.stage
    return svgWrap(fn(rnd(seed)), 400, 300)
  },
  palette: P
}
