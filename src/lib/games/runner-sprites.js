/**
 * Ollie the skate frog — editable pixel sprites for the skate runner on /games (runner-game.js).
 *
 * HOW TO EDIT
 * Each frame is an array of equal-length strings; one character = one pixel.
 * Characters map to colours in PALETTE ('.' = transparent). Change a letter,
 * reload, done. A 1px outline is added automatically around every shape when
 * drawn (set OUTLINE to null to turn it off), so only draw the fills.
 * runner-sprites.test.js checks every row is the same width and every letter
 * has a colour, so a typo shows up as a failing test rather than a magenta pixel.
 *
 * USAGE
 *   import { drawSprite, CHARACTERS, OBSTACLES, PALETTE } from './runner-sprites.js';
 *   const skater = CHARACTERS.kit; // ollie, pip, kit, mochi, cappy, nori
 *   drawSprite(ctx, skater.frames.ride[tick % 2], x, y, 3, skater.palette); // 72px tall
 *   drawSprite(ctx, OBSTACLES.cone[0], ox, oy, 3, PALETTE);
 */

export const PALETTE = {
  g: "#6cc04a", // body green
  d: "#3f8a3a", // shadow green
  l: "#e8f2b6", // belly
  w: "#ffffff", // eye white
  k: "#1b1b2a", // pupil / mouth
  p: "#f29bb0", // cheek
  b: "#3a7bd5", // deck top
  e: "#24508f", // deck underside
  t: "#9aa3ad", // truck
  y: "#ffcc33", // wheel
  h: "#c98a00", // wheel hub
  r: "#ff7a3d", // cone orange
  s: "#f4f4f4", // cone stripe / pigeon light
  n: "#8b93a6", // pigeon body
  q: "#5d6478", // pigeon wing
  z: "#f2a93b", // beak / feet
  x: "#e04848", // crash stars / trolley handle
  // Street obstacles
  A: "#f2c230", // bollard band
  C: "#d7dbe2", // steel highlight
  D: "#8a93a3", // steel
  E: "#4e5666", // dark steel
  F: "#4a4a58", // cast iron
  G: "#7a7888", // iron
  L: "#8d8178", // rat fur
  M: "#2e7d5b", // bin green
  N: "#1f5a41", // bin shadow
  O: "#2f6db5", // newspaper box blue
  P: "#1e4a80", // newspaper box shadow
  Q: "#d8322e", // post box / hydrant red
  R: "#9a1f1c", // post box / hydrant shadow
  S: "#a8743f", // wood
  T: "#6e4a2a", // wood shadow
  V: "#a8cff5", // glass
  W: "#eef1f5", // seagull white
  X: "#b9c0cc", // seagull grey
  Y: "#5f5650", // rat belly
  a: "#cfd5de", // steam / flies
};

export const OUTLINE = "#1b1b2a";

/* ---------- Ollie (24 x 24, facing right) ---------- */

const RIDE_A = [
  "........................",
  "........................",
  "........................",
  "...........www..www.....",
  "..........wwwkwwwwkw....",
  "..........wwwkwwwwkw....",
  "..........gwwwgggwwwg...",
  ".......gggggggggggggggg.",
  "......ggggggggggggggggg.",
  ".....dgggggggggggggggpg.",
  ".....dgggggggggggkkkkkk.",
  "....ddgggggggggllllllll.",
  "....ddggggggggllllllll..",
  "....dddggggggllllllll...",
  "....dddggggggglllllg....",
  "...ddddddgggggglllgg....",
  "...ddgg.ddggggg.ggggg...",
  "..dggg...dgg.....gggg...",
  "..ggggg.gggg....ggggg...",
  ".b...................b..",
  "..bbbbbbbbbbbbbbbbbbbb..",
  "...eeeettteeeeeetttee...",
  ".....yyhy.......yyhy....",
  ".....yyyy.......yyyy....",
];

// Second ride frame: wheels spin, body bobs down 1px.
const RIDE_B = [
  "........................",
  "........................",
  "........................",
  "........................",
  "...........www..www.....",
  "..........wwwkwwwwkw....",
  "..........wwwkwwwwkw....",
  "..........gwwwgggwwwg...",
  ".......gggggggggggggggg.",
  "......ggggggggggggggggg.",
  ".....dgggggggggggggggpg.",
  ".....dgggggggggggkkkkkk.",
  "....ddgggggggggllllllll.",
  "....ddggggggggllllllll..",
  "....dddggggggllllllll...",
  "...ddddddgggggllllllg...",
  "...ddgggddgggggggggggg..",
  "..ggggg.ggggg...ggggg...",
  ".b...................b..",
  "..bbbbbbbbbbbbbbbbbbbb..",
  "...eeeettteeeeeetttee...",
  ".....yhyy.......yhyy....",
  ".....yyyy.......yyyy....",
  "........................",
];

// Jump: legs tucked, arms up, board stuck to feet.
const JUMP = [
  "..........www..www......",
  ".........wwwkwwwwkw.....",
  ".........wwwkwwwwkw.....",
  ".........gwwwgggwwwg....",
  "......gggggggggggggggg..",
  ".....ggggggggggggggggg..",
  "....dgggggggggggggggpg..",
  "....dgggggggggggkkkkkk..",
  "...ddgggggggggllllllll..",
  "...ddggggggggllllllll...",
  "...dddggggggllllllll....",
  "...dddgggggggllllllg....",
  "..ddddddggggglllgg......",
  "..ddggggggggggggggg.....",
  "..gggggg....ggggggg.....",
  "b....................b..",
  ".bbbbbbbbbbbbbbbbbbbbb..",
  "..eeeettteeeeeetttee....",
  "....yyhy.......yyhy.....",
  "....yyyy.......yyyy.....",
  "........................",
  "........................",
  "........................",
  "........................",
];

// Duck: squashed flat, eyes peeking (wider, lower hitbox).
const DUCK = [
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "...............www.www..",
  "..............wwwkwwwkw.",
  ".....ggggggggggwwgggwwg.",
  "...dggggggggggggggggggpg",
  "..ddgggggggggggggkkkkkkk",
  "..ddddgggggggggllllllll.",
  "..dddddggggggggllllllg..",
  "..ggggggg.gggggggggggg..",
  ".b...................b..",
  "..bbbbbbbbbbbbbbbbbbbb..",
  "...eeeettteeeeeetttee...",
  ".....yyhy.......yyhy....",
  ".....yyyy.......yyyy....",
  "........................",
];

// Crash: dizzy X-eyes, board flipped, stars.
const CRASH = [
  ".......x................",
  "......xxx...x...........",
  ".......x...xxx..........",
  "...........wwx...www....",
  "..........wkwkw.wkwkw...",
  "..........wwkww.wwkww...",
  "..........wkwkwgwkwkwg..",
  ".......gggggggggggggggg.",
  "......ggggggggggggggggg.",
  ".....dgggggggggggggggpg.",
  ".....dgggggggggggggkkkg.",
  "....ddgggggggggglllkkkl.",
  "....ddggggggggllllllll..",
  "....dddggggggllllllll...",
  "....dddggggggglllllg....",
  "...ddddddgggggglllgg....",
  "...ddggggggggggggggg....",
  "..gggg.gggg....gggggg...",
  "..........yyyy....yyyy..",
  "..........yhyy....yyhy..",
  "...........tt......tt...",
  "........eeeeeeeeeeeeeeee",
  ".......bbbbbbbbbbbbbbbbb",
  "......b.................",
];

export const FRAMES = {
  ride: [RIDE_A, RIDE_B],
  jump: [JUMP],
  duck: [DUCK],
  crash: [CRASH],
};

/* ---------- The rest of the crew ----------
 * Each character only draws its body (19 rows, 24 wide, feet on the last row).
 * The shared skateboard is added underneath by makeFrames(). The second ride
 * frame is generated by "squashing" out one body row (squashRow) so the head
 * bobs while the feet stay planted. Each character has its own palette, merged
 * over the shared one (k, w, x and the board colours).
 */

const SHARED = {
  k: PALETTE.k,
  w: PALETTE.w,
  x: PALETTE.x,
  b: PALETTE.b,
  e: PALETTE.e,
  t: PALETTE.t,
  y: PALETTE.y,
  h: PALETTE.h,
};

const BOARD_A = [
  ".b...................b..",
  "..bbbbbbbbbbbbbbbbbbbb..",
  "...eeeettteeeeeetttee...",
  ".....yyhy.......yyhy....",
  ".....yyyy.......yyyy....",
];
const BOARD_B = [
  ".b...................b..",
  "..bbbbbbbbbbbbbbbbbbbb..",
  "...eeeettteeeeeetttee...",
  ".....yhyy.......yhyy....",
  ".....yyyy.......yyyy....",
];
const BOARD_FLIPPED = [
  ".....yyyy.......yyyy....",
  ".....yhyy.......yyhy....",
  "...eeeettteeeeeetttee...",
  "..bbbbbbbbbbbbbbbbbbbb..",
  ".b...................b..",
];

const pad = (rows) => rows.map((r) => r.padEnd(24, ".").slice(0, 24));
const EMPTY = "........................";

function makeFrames({ ride, jump, duck, crash, squashRow }) {
  const bob = [EMPTY, ...ride.slice(0, squashRow), ...ride.slice(squashRow + 1)];
  return {
    ride: [pad([...ride, ...BOARD_A]), pad([...bob, ...BOARD_B])],
    jump: [pad([...jump, ...BOARD_A])],
    duck: [pad([...duck, ...BOARD_A])],
    crash: [pad([...crash, ...BOARD_FLIPPED])],
  };
}

const blank = (n) => Array(n).fill(EMPTY);

/* Pip the hedge-mouse */
const PIP = makeFrames({
  squashRow: 11,
  ride: [
    EMPTY,
    EMPTY,
    ".........ggg............",
    "........gpppg...........",
    "........gpppg...........",
    "........gpppgrrrr.......",
    ".......RRggrrrrrrr......",
    "......RRRgrrrrrrrr......",
    ".........ggggggggg......",
    "........ggggggwkggg.....",
    "........gggggggkgggggp..",
    "........gggggggggggggg..",
    ".......ddgggggcccccc....",
    "......dddggggcccccc.....",
    "p.....dddgggggccccc.....",
    "pp...ddddggggggcccg.....",
    ".pp.dddddggggggggg......",
    "..ppddggg.gggg..ggg.....",
    "....gggg.ggggg.gggg.....",
  ],
  jump: [
    EMPTY,
    ".........ggg............",
    "........gpppg...........",
    "........gpppg...........",
    "........gpppgrrrr.......",
    ".......RRggrrrrrrr......",
    "......RRRgrrrrrrrr......",
    ".........ggggggggg......",
    "........ggggggwkggg.....",
    "........gggggggkgggggp..",
    "........gggggggggggggg..",
    "p......ddgggggcccccc....",
    "pp....dddggggcccccc.....",
    ".pp...dddgggggccccc.....",
    "..pp.ddddggggggcccg.....",
    "...ppdddddgggggggggg....",
    ".....ddggggggggggggg....",
    ".....gggggg...gggggg....",
    "......ggg......ggg......",
  ],
  duck: [
    ...blank(11),
    "......ggppg.............",
    ".....gpppgrrrrrr........",
    "...RRRgggrrrrrrrrgg.....",
    "....ggggggggggwkggggp...",
    "p.ddgggggggggggggggggg..",
    "ppdddgggggggcccccccc....",
    ".pddddggggggcccccccg....",
    "..gggggg.ggggg.ggggg....",
  ],
  crash: [
    "......x.......rrrr......",
    ".....xxx....RRrrrrr.....",
    "......x.................",
    ".........ggg.......x....",
    "........gpppg.....xxx...",
    "........gpppg......x....",
    "........gpppg...........",
    ".........gggggggg.......",
    "........gggggkwkgg......",
    "........gggggwkwggggp...",
    "........gggggkwkgggggg..",
    "........ggggggggggggg...",
    ".......ddgggggccccc.....",
    "......dddggggcccccc.....",
    "p.....dddgggggccccc.....",
    "pp...ddddggggggcccg.....",
    ".pp.dddddggggggggg......",
    "..ppddggggggggggggg.....",
    "....gggggg...ggggggg....",
  ],
});

/* Kit the robot */
const KIT = makeFrames({
  squashRow: 10,
  ride: [
    EMPTY,
    "...........a............",
    "...........V............",
    "...........V............",
    "......mmmmmmmmmm........",
    ".....mmmmmmmmmmmm.......",
    ".....mvAAAAAAAAvm.......",
    ".....mvAaAAAAaAvm.......",
    ".....mvAaAAAAaAvm.......",
    ".....mvAAAaaAAAvm.......",
    ".....mvAAAAAAAAvm.......",
    ".....MmmmmmmmmmmM.......",
    "......MMMMMMMMMM........",
    ".......VvvvvvvV.........",
    "......mmmmmmmmmm........",
    ".....vmmmmmmmmmmv.......",
    ".....vMMMMMMMMMMv.......",
    ".......VV....VV.........",
    "......VVV....VVV........",
  ],
  jump: [
    "............a...........",
    "...........V............",
    "...........V............",
    "......mmmmmmmmmm........",
    ".....mmmmmmmmmmmm.......",
    ".....mvAAAAAAAAvm.......",
    ".....mvAaaAAaaAvm.......",
    ".....mvAAAAAAAAvm.......",
    ".....mvAAaaaaAAvm.......",
    ".....mvAAAAAAAAvm.......",
    ".....MmmmmmmmmmmM.......",
    "..v...MMMMMMMMMM...v....",
    "..v....VvvvvvvV....v....",
    "..vv..mmmmmmmmmm..vv....",
    "...vvvmmmmmmmmmmvvv.....",
    "......MMMMMMMMMM........",
    ".......VV....VV.........",
    ".......VV....VV.........",
    "......VVV....VVV........",
  ],
  duck: [
    ...blank(10),
    "...........a............",
    "...........V............",
    "......mmmmmmmmmm........",
    ".....mvAAAAAAAAvm.......",
    ".....mvAaaAAaaAvm.......",
    ".....MmmmmmmmmmmM.......",
    "....vmmmmmmmmmmmmv......",
    "....vMMMMMMMMMMMMv......",
    "......VVV....VVV........",
  ],
  crash: [
    "........x.....x.........",
    ".........x...x..........",
    "...........a............",
    "..........V.............",
    ".........V..............",
    "......mmmmmmmmmm........",
    ".....mmmmmmmmmmmm.......",
    ".....mvavAvaAvavm.......",
    ".....mvAvavAvAvvm.......",
    ".....mvaAvAavaAvm.......",
    ".....mvvAavAvavAm.......",
    ".....mvAAAAAAAAvm.......",
    ".....MmmmmmmmmmmM.......",
    "......MMMMMMMMMM........",
    ".......VvvvvvvV.........",
    "......mmmmmmmmmm........",
    ".....vmmmmmmmmmmv.......",
    "....vvMMMMMMMMMMvv......",
    "...VVV..........VVV.....",
  ],
});

/* Mochi the snail */
const MOCHI = makeFrames({
  squashRow: 14,
  ride: [
    ...blank(3),
    ".................wk..wk.",
    "..................o...o.",
    "..................o..o..",
    "......LLLLLL.......oo...",
    "....LLLLLLLLLL....oooo..",
    "...LLLDDDDDLLLL..oooooo.",
    "..LLLDLLLLLDLLLL.oooopo.",
    "..LLDLLsssLLDLLL.ookoo..",
    "..LLDLsLLLsLDLLLooooo...",
    "..LLDLsLsLsLDLLLoooo....",
    "..LLDLLsLLLDLLLLooo.....",
    "...LLDLLLLDLLLLooo......",
    "....LLDDDDLLLLoooo......",
    ".....LLLLLLLLooooo......",
    "..oooooooooooooooo......",
    ".OOOOOOOOOOOOOOOOO......",
  ],
  jump: [
    ".................wk..wk.",
    "..................o...o.",
    "..................o...o.",
    "..................o..o..",
    "......LLLLLL.......oo...",
    "....LLLLLLLLLL....oooo..",
    "...LLLDDDDDLLLL..oooooo.",
    "..LLLDLLLLLDLLLL.oooopo.",
    "..LLDLLsssLLDLLL.ookko..",
    "..LLDLsLLLsLDLLLooooo...",
    "..LLDLsLsLsLDLLLoooo....",
    "..LLDLLsLLLDLLLLooo.....",
    "...LLDLLLLDLLLLooo......",
    "....LLDDDDLLLLoooo......",
    ".....LLLLLLLLooooo......",
    "...oooooooooooooo.......",
    "..OOOOOOOOOOOOOOO.......",
    ".oo.....................",
    "oo......................",
  ],
  duck: [
    ...blank(10),
    "........LLLLLL..........",
    "......LLLLLLLLLL........",
    ".....LLLDDDDDLLLL.......",
    "....LLLDLLLLLDLLLL......",
    "....LLDLLsssLLDLLL......",
    "....LLDLsLLLsLDLLL......",
    "....LLDLLsLLLDLLLL......",
    ".....LLDDDDDDLLLL.......",
    "......LLLLLLLLLL........",
  ],
  crash: [
    "..........x.............",
    ".........xxx.......x....",
    "..........x.......xxx...",
    "...................x....",
    EMPTY,
    EMPTY,
    "......LLLLLL............",
    "....LLLLLLLLLL..........",
    "...LLLDDDDDLLLL..oooo...",
    "..LLLDLLLLLDLLLL.ooooooo",
    "..LLDLLsssLLDLLL.oooooo.",
    "..LLDLsLLLsLDLLLoookkoo.",
    "..LLDLsLsLsLDLLLoooo..o.",
    "..LLDLLsLLLDLLLLooo...o.",
    "...LLDLLLLDLLLLooo....k.",
    "....LLDDDDLLLLoooo......",
    ".....LLLLLLLLooooo......",
    "..oooooooooooooooo......",
    ".OOOOOOOOOOOOOOOOO......",
  ],
});

/* Cappy the mushroom */
const CAPPY = makeFrames({
  squashRow: 13,
  ride: [
    EMPTY,
    EMPTY,
    "........cccccc..........",
    "......ccssccccss........",
    "....ccccssccccsscc......",
    "...ccsscccccccccccc.....",
    "..ccssscccccsscccccc....",
    ".ccccccccccssscccsscc...",
    ".CCCCCCCCCCCCCCCCCCCC...",
    ".....jjjjjjjjjjjj.......",
    "....Jjjjjjjjjkjjjkj.....",
    "....Jjjjjjjjjkjjjkj.....",
    "....JJjjjjjjpjjkjjpj....",
    ".....JJjjjjjjjjjjjj.....",
    "......JJjjjjjjjjjj......",
    ".......JJJjjjjjjj.......",
    "........JJJJJjjj........",
    "........jj.....jj.......",
    ".......jjj....jjj.......",
  ],
  jump: [
    "..........cccccc........",
    "........ccssccccss......",
    "......ccccssccccsscc....",
    "....ccsscccccccccccc....",
    "..ccssscccccsscccccc....",
    ".ccccccccccssscccssc....",
    "CCCCCCCCCCCCCCCCCCCC....",
    ".CCCC.jjjjjjjjjjjj......",
    "....Jjjjjjjjjjjjjjj.....",
    "....Jjjjjjjjjkjjjkj.....",
    "....Jjjjjjjjjkjjjkj.....",
    "....JJjjjjjjpjkkjjpj....",
    ".....JJjjjjjjjjjjjj.....",
    "..j...JJjjjjjjjjjj..j...",
    "..jj...JJJjjjjjjj..jj...",
    "...jjjj.JJJJJjjjjjj.....",
    "........jj.....jj.......",
    "........jj.....jj.......",
    ".......jjj....jjj.......",
  ],
  duck: [
    ...blank(10),
    "........cccccc..........",
    "......ccssccccss........",
    "....ccccssccccsscc......",
    "..ccsscccccccccccccc....",
    ".ccccccccccssscccsscc...",
    ".CCCCCCCCCCCCCCCCCCCC...",
    "....JjjjjjjjjkjjjkjJ....",
    ".....JJjjjjjpjjkjjpJ....",
    ".......jjj....jjj.......",
  ],
  crash: [
    ".............cccccc.....",
    "...........ccssccccss...",
    "..........cccsscccccsc..",
    "..........CCCCCCCCCCCC..",
    "....x...................",
    "...xxx.....x............",
    "....x.....xxx...........",
    "...........x............",
    ".....jjjjjjjjjjjj.......",
    ".....jjjjjjjjjjjj.......",
    "....Jjjjjjjjkjkjkjkj....",
    "....Jjjjjjjjjkjjjkj.....",
    "....JJjjjjjjkjkjkjkj....",
    ".....JJjjjjjjjkkjjjj....",
    "......JJjjjjjjjjjj......",
    ".......JJJjjjjjjj.......",
    "........JJJJJjjj........",
    ".......jjj.....jjj......",
    "......jjj.......jjj.....",
  ],
});

/* Nori the penguin */
const NORI = makeFrames({
  squashRow: 12,
  ride: [
    EMPTY,
    EMPTY,
    "..........vvvvv.........",
    "........vvvvvvvvv.......",
    ".......vvvvvvwwvvv......",
    ".......vvvvvwwkwwvz.....",
    "......vvvvvvwwwwwzzz....",
    "......vvvvvvwwwwwvz.....",
    "....fffffffffffff.......",
    "..ffFffFFFFFFFFFF.......",
    ".ffF..vvvvvwwwwwv.......",
    "..f..vvvvvwwwwwwvv......",
    ".....vvvvwwwwwwwwv......",
    "....Vvvvvwwwwwwwwvv.....",
    "....VVvvvwwwwwwwwvv.....",
    "....VVvvvwwwwwwwwv......",
    ".....VVvvvwwwwwwv.......",
    ".......VVVVVVVVV........",
    ".......zzz....zzz.......",
  ],
  jump: [
    EMPTY,
    EMPTY,
    "..........vvvvv.........",
    "........vvvvvvvvv.......",
    ".......vvvvvvwwvvv......",
    ".......vvvvvwwkwwvz.....",
    "......vvvvvvwwwwwzzz....",
    "......vvvvvvwwwwwvz.....",
    "....fffffffffffff.......",
    "..ffFffFFFFFFFFFF.......",
    "ffF...vvvvvwwwwwv.......",
    "f..v.vvvvvwwwwwwvv.v....",
    "...vvvvvvwwwwwwwwvvv....",
    "....Vvvvvwwwwwwwwvv.....",
    "....VVvvvwwwwwwwwvv.....",
    "....VVvvvwwwwwwwwv......",
    ".....VVvvvwwwwwwv.......",
    ".......VVVVVVVVV........",
    ".......zzz....zzz.......",
  ],
  duck: [
    ...blank(13),
    "...ffF..................",
    "..fFfffffffff...........",
    ".zz.VVvvvvvvvvvvvvvvv...",
    ".zzVVvvvvvvvvvvvvwwkwvz.",
    "...VVwwwwwwwwwwwwwwwwzzz",
    "....wwwwwwwwwwwwwwwwwv..",
  ],
  crash: [
    "........x...............",
    ".......xxx......x.......",
    "........x......xxx......",
    "................x.......",
    "..........vvvvv.........",
    "........vvvvvvvvv.......",
    ".......vvvvvvkwkvv......",
    ".......vvvvvvwkwwvz.....",
    "......vvvvvvvkwkwzzz....",
    "......vvvvvvwwwwwvz.....",
    "....fffffffffffff.......",
    "...fFffFFFFFFFFFF.......",
    "....F.vvvvvwwwwwv.......",
    ".....vvvvwwwwwwwwv......",
    "...vVvvvvwwwwwwwwvv.v...",
    "...vVVvvvwwwwwwwwvvvv...",
    ".....VVvvvwwwwwwv.......",
    ".......VVVVVVVVV........",
    "......zzz......zzz......",
  ],
});

/** Every playable skater. Pick one and pass its palette to drawSprite. */
export const CHARACTERS = {
  ollie: { name: "Ollie", palette: PALETTE, frames: FRAMES },
  pip: {
    name: "Pip",
    frames: PIP,
    palette: { ...SHARED, g: "#a3a9b3", d: "#6f7682", c: "#f3e8d2", p: "#f29bb0", r: "#e0483e", R: "#9e2a24" },
  },
  kit: {
    name: "Kit",
    frames: KIT,
    palette: { ...SHARED, m: "#2bb3a3", M: "#1c7d72", v: "#cdd5dd", V: "#8b96a3", A: "#23262e", a: "#ffb84d" },
  },
  mochi: {
    name: "Mochi",
    frames: MOCHI,
    palette: { ...SHARED, L: "#b48ad8", D: "#7a52a8", s: "#ead9f7", o: "#f3e08a", O: "#c9b35a", p: "#f29bb0" },
  },
  cappy: {
    name: "Cappy",
    frames: CAPPY,
    palette: { ...SHARED, c: "#e8553a", C: "#a83a28", s: "#fff1d6", j: "#eedbb8", J: "#c4a67a", p: "#f29bb0" },
  },
  nori: {
    name: "Nori",
    frames: NORI,
    palette: { ...SHARED, v: "#2b4170", V: "#18264a", f: "#ffd23f", F: "#d9a300", z: "#ff8a3d" },
  },
};

/* ---------- Obstacles ----------
 * Every obstacle stands on (or hangs from) the bottom edge of its frame, so
 * keep the last row filled for anything on the ground. Animated obstacles
 * list several frames; runner-logic.js decides how fast they cycle and how
 * each one is cleared (KINDS). Its tests check every skater can clear every
 * obstacle, so a sprite that grows too tall or wide fails `bun test`.
 */

// Swaps colour letters, for an obstacle that's another one repainted.
const recolor = (frame, map) => frame.map((row) => row.replace(/./g, (c) => map[c] ?? c));

/* Low ones: a tap jump clears them. */

// Traffic cone (12 x 16). Comes in groups of up to three.
const CONE = [
  ".....rr.....",
  ".....rr.....",
  "....rrrr....",
  "....rrrr....",
  "....ssss....",
  "...ssssss...",
  "...rrrrrr...",
  "...rrrrrr...",
  "..rrrrrrrr..",
  "..ssssssss..",
  "..ssssssss..",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  "eeeeeeeeeeee",
  "eeeeeeeeeeee",
];

// Fire hydrant (12 x 15).
const HYDRANT = [
  ".....QQ.....",
  "...QQQQQQ...",
  "..QQQQQQQQ..",
  "..RRRRRRRR..",
  "...QQQQQQ...",
  "...QQQQQR...",
  ".CCQQQQQRCC.",
  ".CCQQQQQRCC.",
  "...QQQQQR...",
  "...QQQQQR...",
  "...QQQQQR...",
  "...QQQQQR...",
  "..RRRRRRRR..",
  ".QQQQQQQQQR.",
  ".RRRRRRRRRR.",
];

// Bollard (8 x 16), a thin post with a reflective band. Groups of up to three.
const BOLLARD = [
  "...CC...",
  "..CCCD..",
  "..CDDD..",
  "..EEEE..",
  "..AAAA..",
  "..AAAA..",
  "..EEEE..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  "..CDDD..",
  ".EEEEEE.",
];

// Manhole with its cover propped up and steam rising (16 x 14). The steam
// (the top five rows) isn't part of the hitbox.
const MANHOLE_COVER = [
  "...........FF...",
  ".........FFGGF..",
  ".......FFGGGGF..",
  ".....FFGGEGGF...",
  "...FFGGGEGGF....",
  "..FGGGEGGGF.....",
  "..FGGGGGGF......",
  ".FFFFFFFFFFFFFF.",
  "EEEEEEEEEEEEEEEE",
];
const MANHOLE_A = [
  "....a...........",
  "...a..a.........",
  "....a..a........",
  "...a..a.........",
  "....aa..........",
  ...MANHOLE_COVER,
];
const MANHOLE_B = [
  "...a............",
  "....a..a........",
  "...a..a.........",
  "....a..a........",
  "...aa...........",
  ...MANHOLE_COVER,
];

// Red pillar post box (14 x 24).
const POST_BOX = [
  "....RRRRRR....",
  "..RRQQQQQQRR..",
  ".RQQQQQQQQQQR.",
  ".RRRRRRRRRRRR.",
  "..QQQQQQQQQR..",
  "..QQQkkkkQQR..",
  "..QQQQQQQQQR..",
  "..QQsssssQQR..",
  "..QQsssssQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  "..QQQQQQQQQR..",
  ".FFFFFFFFFFFF.",
  ".FFFFFFFFFFFF.",
];

/* Wide ones: a tap clears them too, but the timing is tighter. */

// Park bench (34 x 12).
const BENCH = [
  "..SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS..",
  "..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
  "..SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS..",
  "..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
  "...E..........................E...",
  "...E..........................E...",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "..EE..........................EE..",
  "..EE..........................EE..",
  "..EE..........................EE..",
  ".EEEE........................EEEE.",
];

// Roadworks barrier (30 x 11), a striped plank on two A-frame legs.
const BARRIER = [
  "rrrsssrrrsssrrrsssrrrsssrrrsss",
  "rrsssrrrsssrrrsssrrrsssrrrsssr",
  "rsssrrrsssrrrsssrrrsssrrrsssrr",
  "sssrrrsssrrrsssrrrsssrrrsssrrr",
  ".....EE.................EE....",
  "....E..E...............E..E...",
  "....E..E...............E..E...",
  "...E....E.............E....E..",
  "...E....E.............E....E..",
  "..E......E...........E......E.",
  "..E......E...........E......E.",
];

// Abandoned shopping cart (26 x 19), facing left; the wheels turn.
const CART_BASKET = [
  "CCCCCCCCCCCCCCCCCCCCCCCxxx",
  "CD..D..D..D..D..D..D..Cxxx",
  "CD..D..D..D..D..D..D..CE..",
  "CDDDDDDDDDDDDDDDDDDDDDCE..",
  ".C..D..D..D..D..D..D..CE..",
  ".C..D..D..D..D..D..D..CE..",
  ".CDDDDDDDDDDDDDDDDDDDDCE..",
  ".C..D..D..D..D..D..D..CE..",
  "..C.D..D..D..D..D..D..CE..",
  "..CDDDDDDDDDDDDDDDDDDDCE..",
  "..C.D..D..D..D..D..D..CE..",
  "..C.D..D..D..D..D..D..C...",
  "...CCCCCCCCCCCCCCCCCCCC...",
  "...EEEEEEEEEEEEEEEEEEEEE..",
  "....E...............E.....",
  "....E...............E.....",
  "....EEEEEEEEEEEEEEEEE.....",
];
const CART_A = [...CART_BASKET, "...FGF.............FGF....", "...FFF.............FFF...."];
const CART_B = [...CART_BASKET, "...FCF.............FCF....", "...FFF.............FFF...."];

/* Tall ones: too high for a tap, so jump has to be held. */

// Wheelie bin (16 x 35) with flies buzzing over it. The flies (the top
// three rows) aren't part of the hitbox.
const BIN_BODY = [
  "..NNNNNNNNNNNN..",
  ".NMMMMMMMMMMMMN.",
  "NNNNNNNNNNNNNNNN",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMCCCCCCMMMNN.",
  ".MMMCMMMMCMMMNN.",
  ".MMMCCCCCCMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".MMMMMMMMMMMMNN.",
  ".NNNNNNNNNNNNNN.",
  "..NN.......FFF..",
  "..NN......FGCGF.",
  "..NN.......FFF..",
];
const BIN_A = ["...a......a.....", "......a.........", ".a..........a...", ...BIN_BODY];
const BIN_B = ["......a.........", "..a.......a.....", "...........a..a.", ...BIN_BODY];

// Newspaper vending box (14 x 33), on a stand.
const NEWS_BOX = [
  "..OOOOOOOOOO..",
  ".OOOOOOOOOOOO.",
  ".PPPPPPPPPPPP.",
  ".OVVVVVVVVVVP.",
  ".OVsssssssVVP.",
  ".OVskkkkksVVP.",
  ".OVsssssssVVP.",
  ".OVskkksssVVP.",
  ".OVsssssssVVP.",
  ".OVVVVVVVVVVP.",
  ".OOOOCCCOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".OOOOOOOOOOOP.",
  ".PPPPPPPPPPPP.",
  "...EE....EE...",
  "...EE....EE...",
  "...EE....EE...",
  "...EE....EE...",
  "...EE....EE...",
  "..EEEE..EEEE..",
];

/* Birds: duck under them at head height, jump them when they fly low. */

// Pigeon, two wing frames (20 x 14).
const PIGEON_UP = [
  ".....qq.............",
  ".....qqq............",
  "......qqqq..........",
  ".......qqqq.........",
  "........qqqq....nn..",
  "........qqqq...nwkn.",
  "qq.....nnnnnnnnnnnzz",
  ".qqnnnnnnnnnnnnnn...",
  "..nnnnsssssssnnn....",
  ".....nnnnnnnnnn.....",
  "........z..z........",
  "....................",
  "....................",
  "....................",
];

const PIGEON_DOWN = [
  "....................",
  "....................",
  "....................",
  "....................",
  "................nn..",
  "...............nwkn.",
  "qq.....nnnnnnnnnnnzz",
  ".qqnnnnnnnnnnnnnn...",
  "..nnnnqqqqssssnnn...",
  ".....nnqqqqnnnnn....",
  ".......qqqq.........",
  "......qqqq..........",
  ".....qqq............",
  ".....qq.............",
];

// Seagull: the pigeon in white and grey.
const GULL = { n: "W", s: "W", q: "X" };
const SEAGULL_UP = recolor(PIGEON_UP, GULL);
const SEAGULL_DOWN = recolor(PIGEON_DOWN, GULL);

/* Moving ones: they come at the skater faster than the street scrolls. */

// Rat, scurrying left (16 x 7).
const RAT_BODY = [
  "...p............",
  "..LLLLLLLLL.....",
  ".LkLLLLLLLLL....",
  "pLLLLLLLLLLLL...",
  ".LLLLLLLLLLLLppp",
  "..YYYYYYYYYY...p",
];
const RAT_A = [...RAT_BODY, "..L..L...L..L..."];
const RAT_B = [...RAT_BODY, "...L..L.L..L...."];

export const OBSTACLES = {
  cone: [CONE],
  hydrant: [HYDRANT],
  bollard: [BOLLARD],
  manhole: [MANHOLE_A, MANHOLE_B],
  bench: [BENCH],
  barrier: [BARRIER],
  cart: [CART_A, CART_B],
  bin: [BIN_A, BIN_B],
  newsBox: [NEWS_BOX],
  postBox: [POST_BOX],
  pigeon: [PIGEON_UP, PIGEON_DOWN],
  seagull: [SEAGULL_UP, SEAGULL_DOWN],
  rat: [RAT_A, RAT_B],
};

/* ---------- Rendering ---------- */

/** Draws one frame at (x, y) with each pixel scaled to `scale` CSS pixels. */
export function drawSprite(ctx, frame, x, y, scale = 3, palette = PALETTE, outline = OUTLINE) {
  const h = frame.length;
  const w = frame[0].length;
  const filled = (cx, cy) => cy >= 0 && cy < h && cx >= 0 && cx < w && frame[cy][cx] !== ".";

  if (outline) {
    ctx.fillStyle = outline;
    for (let cy = -1; cy <= h; cy++) {
      for (let cx = -1; cx <= w; cx++) {
        if (filled(cx, cy)) continue;
        if (filled(cx + 1, cy) || filled(cx - 1, cy) || filled(cx, cy + 1) || filled(cx, cy - 1)) {
          ctx.fillRect(x + cx * scale, y + cy * scale, scale, scale);
        }
      }
    }
  }
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const c = frame[cy][cx];
      if (c === ".") continue;
      ctx.fillStyle = palette[c] ?? "#ff00ff"; // magenta = unknown letter
      ctx.fillRect(x + cx * scale, y + cy * scale, scale, scale);
    }
  }
}

/** Tight bounding box of the filled pixels, handy for collision boxes. */
export function bounds(frame) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -1,
    maxY = -1;
  frame.forEach((row, yy) =>
    [...row].forEach((c, xx) => {
      if (c === ".") return;
      minX = Math.min(minX, xx);
      maxX = Math.max(maxX, xx);
      minY = Math.min(minY, yy);
      maxY = Math.max(maxY, yy);
    })
  );
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
