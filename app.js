/**
 * Pumping Lemma Explorer – app.js
 * ════════════════════════════════════════════════════════════
 *
 * Core logic stages:
 *   §1  generateString(p)          → s = 0^p 1^p
 *   §2  isInLanguage(s)            → s ∈ L?
 *   §3  checkConstraints(x,y,z,s,p)→ validate Pumping Lemma conditions
 *   §4  pumpString(x,y,z,i)        → x(y^i)z
 *   §5  analyseString(s, lang)     → per-symbol counts & membership reasoning
 *   §6  State, DOM refs, helpers
 *   §7  Render – string, partition, pumped (animated), math explanation
 *   §8  updateResults              → result panel + proof table
 *   §9  Main update loop
 *   §10 Event listeners
 *   §11 Init
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   §1  STRING GENERATOR  –  L = { 0ⁿ 1ⁿ | n ≥ 1 }
   ════════════════════════════════════════════════════════════ */

/**
 * Build the canonical sample string for pumping length p.
 * Returns s = 0^p 1^p  so  |s| = 2p ≥ p.
 * @param  {number} p
 * @returns {string}
 */
function generateString(p) {
  return '0'.repeat(p) + '1'.repeat(p);
}


/* ════════════════════════════════════════════════════════════
   §2  MEMBERSHIP TEST  –  L = { 0ⁿ 1ⁿ | n ≥ 1 }
   ════════════════════════════════════════════════════════════ */

/**
 * Return true iff s ∈ L = { 0ⁿ 1ⁿ | n ≥ 1 }.
 * Conditions:
 *   • |s| even and non-zero
 *   • first half all '0', second half all '1'
 * @param  {string}  s
 * @returns {boolean}
 */
function isInLanguage(s) {
  if (!s.length || s.length % 2 !== 0) return false;
  const half = s.length / 2;
  return /^0+$/.test(s.slice(0, half)) && /^1+$/.test(s.slice(half));
}


/* ════════════════════════════════════════════════════════════
   §3  CONSTRAINT CHECKER
   Validates the three Pumping Lemma conditions on (x, y, z).
   ════════════════════════════════════════════════════════════ */

/**
 * @param {string} x
 * @param {string} y
 * @param {string} z
 * @param {string} s  original string
 * @param {number} p  pumping length
 * @returns {{c1_yNonEmpty, c2_xyLeqP, c3_xyzEqS, allValid, errorMsg}}
 */
function checkConstraints(x, y, z, s, p) {
  const c1_yNonEmpty = y.length >= 1;
  const c2_xyLeqP    = (x.length + y.length) <= p;
  const c3_xyzEqS    = (x + y + z) === s;
  const allValid     = c1_yNonEmpty && c2_xyLeqP && c3_xyzEqS;

  let errorMsg = '';
  if (!c1_yNonEmpty) {
    errorMsg = `⚠ Cond 1 violated: |y| = 0. y must be non-empty (|y| ≥ 1).`;
  } else if (!c2_xyLeqP) {
    errorMsg = `⚠ Cond 2 violated: |xy| = ${x.length + y.length} > p = ${p}. Slide x and y leftward.`;
  } else if (!c3_xyzEqS) {
    errorMsg = `⚠ Cond 3 violated: x + y + z ≠ s. Partition must cover the full string.`;
  }

  return { c1_yNonEmpty, c2_xyLeqP, c3_xyzEqS, allValid, errorMsg };
}


/* ════════════════════════════════════════════════════════════
   §4  PUMPING FUNCTION
   ════════════════════════════════════════════════════════════ */

/**
 * Generate the pumped string x(yⁱ)z.
 * @param {string} x
 * @param {string} y
 * @param {string} z
 * @param {number} i  pumping factor (i ≥ 0)
 * @returns {string}
 */
function pumpString(x, y, z, i) {
  return x + y.repeat(i) + z;
}


/* ════════════════════════════════════════════════════════════
   §5  MATH ANALYSER
   Counts per-symbol occurrences and builds an educational
   explanation of why the pumped string is / isn't in L.
   ════════════════════════════════════════════════════════════ */

/**
 * Analyse a pumped string and return a structured explanation.
 * Works for any language registered in LANGUAGES.
 *
 * @param {string} pumped       the string x(yⁱ)z
 * @param {string} langKey      key into LANGUAGES
 * @param {boolean} inLang      result of lang.accepts(pumped)
 * @param {boolean} validPart   whether partition is valid
 * @returns {{chips, verdict, reasoning}}
 */
function analyseString(pumped, langKey, inLang, validPart) {
  if (!validPart) {
    return {
      chips: [],
      verdict: '',
      reasoning: 'Fix the partition constraints above to see the math breakdown.',
    };
  }

  // ── Build per-symbol count chips ──────────────────────────
  const countMap = {};
  for (const ch of pumped) countMap[ch] = (countMap[ch] || 0) + 1;

  const CHIP_CLASS = { '0': 'chip-zero', '1': 'chip-one', 'a': 'chip-zero', 'b': 'chip-one', 'c': 'chip-other' };

  const chips = Object.entries(countMap).map(([ch, n]) => ({
    ch,
    count: n,
    cls: CHIP_CLASS[ch] || 'chip-other',
    label: `# of "${ch}": ${n}`,
  }));

  // ── Language-specific reasoning ────────────────────────────
  let verdict = '';
  let reasoning = '';

  if (langKey === '0n1n' || langKey === 'apbp') {
    const sym0 = langKey === '0n1n' ? '0' : 'a';
    const sym1 = langKey === '0n1n' ? '1' : 'b';
    const n0   = countMap[sym0] || 0;
    const n1   = countMap[sym1] || 0;

    if (inLang) {
      verdict   = `✓ PASS — "${sym0}" count = "${sym1}" count = ${n0}`;
      reasoning = `${n0} ${sym0}s = ${n1} ${sym1}s, so the string is still in L. ` +
                  `The pumping lemma holds for this i. Try i = 0 or a larger i to find a violation.`;
    } else {
      const rel  = n0 > n1 ? '>' : '<';
      verdict   = `✗ FAIL — Number of "${sym0}"s ≠ Number of "${sym1}"s`;
      reasoning = `Number of "${sym0}"s: ${n0},  Number of "${sym1}"s: ${n1}.  ` +
                  `${n0} ${rel} ${n1}, so ${n0} ≠ ${n1}. ` +
                  `Therefore the pumped string is NOT in L = {${sym0}ⁿ${sym1}ⁿ | n≥1}. ` +
                  `This contradiction proves L is NOT a regular language!`;
    }
  } else if (langKey === 'anbn_cn') {
    const na = countMap['a'] || 0, nb = countMap['b'] || 0, nc = countMap['c'] || 0;
    if (inLang) {
      verdict   = `✓ PASS — |a| = |b| = |c| = ${na}`;
      reasoning = `All three symbol counts are equal (${na}). The string is still in L. Try a different i.`;
    } else {
      verdict   = `✗ FAIL — |a|=${na}, |b|=${nb}, |c|=${nc} — counts are unequal`;
      reasoning = `After pumping, the counts diverge: a×${na}, b×${nb}, c×${nc}. ` +
                  `Since they are not all equal, the string ∉ L. Contradiction — L is not regular!`;
    }
  } else if (langKey === 'palindrome') {
    if (inLang) {
      verdict   = `✓ PASS — Pumped string is still wwᴿ`;
      reasoning = `The string still satisfies the even-palindrome property. Try i = 0 or a larger i.`;
    } else {
      verdict   = `✗ FAIL — Pumped string is NOT of the form wwᴿ`;
      reasoning = `After pumping, the first half no longer mirrors the second half in reverse. ` +
                  `This breaks the palindrome property, proving L = {wwᴿ} is not regular!`;
    }
  } else if (langKey === 'custom') {
    verdict   = inLang ? `✓ PASS — Pumped string belongs to L` : `✗ FAIL — Pumped string ∉ L`;
    reasoning = inLang
      ? `The pumped string "${pumped}" successfully follows the rules of your custom mathematical definition \`${state.customMathVal}\`.`
      : `The pumped string "${pumped}" does NOT match your custom rules for \`${state.customMathVal}\`. This proves your language is not regular!`;
  } else {
    verdict   = inLang ? `✓ PASS — Pumped string ∈ L` : `✗ FAIL — Pumped string ∉ L`;
    reasoning = inLang
      ? 'The language conditions still hold after pumping. Try different i.'
      : 'The pumped string violates the language rules. Contradiction found!';
  }

  return { chips, verdict, reasoning };
}


/* ════════════════════════════════════════════════════════════
   §6  LANGUAGE TABLE, STATE, DOM REFS, HELPERS
   ════════════════════════════════════════════════════════════ */

/** 
 * Parses math string formats like "a^n b^n c^m" into generators and acceptors.
 * Uses Regular Expressions to capture blocks, then verifies count dependencies.
 */
function parseLanguageNotation(notationString) {
  let str = notationString.replace(/\s+/g, '');
  if (!str) return null;

  const parts = str.split('|');
  const expr  = parts[0];
  const conds = parts[1] || '';

  // ── Parse exponent token into { coeff, varName } ─────────────────
  // Handles: n, m, 3n, 2m, n2 (coeff may come before or after variable)
  function parseExponent(token) {
    // Try: leading digits then variable letters, e.g. "3n", "10m"
    let m = token.match(/^(\d+)([a-zA-Z]+)$/);
    if (m) return { coeff: parseInt(m[1], 10), varName: m[2] };
    // Try: variable letters then digits, e.g. "n2", "m3"
    m = token.match(/^([a-zA-Z]+)(\d+)$/);
    if (m) return { coeff: parseInt(m[2], 10), varName: m[1] };
    // Pure variable: "n", "m"
    if (/^[a-zA-Z]+$/.test(token)) return { coeff: 1, varName: token };
    // Pure number (constant exponent): "3", "2"
    if (/^\d+$/.test(token)) return { coeff: parseInt(token, 10), varName: null };
    return { coeff: 1, varName: token };
  }

  const chunks = [];
  // Match char^exponent blocks; exponent may contain digits + letters in any order
  const regex = /(?:(?:\(([^)]+)\))|([a-zA-Z0-9]))\^(\d*[a-zA-Z]+\d*|\d+)(?=(?:\([^)]+\)|[a-zA-Z0-9])\^|$)/g;
  let match;
  while ((match = regex.exec(expr)) !== null) {
    const char = match[1] || match[2];
    const { coeff, varName } = parseExponent(match[3]);
    chunks.push({ char, varName, coeff });
  }

  if (chunks.length === 0) return { error: 'Notation pattern not recognized. Please stick to basic a^n b^m formats.' };

  // ── Parse PER-VARIABLE minimum values ────────────────────────────────
  // Handles all patterns found in the conditions string, e.g.:
  //   "n>=1"          → { n: 1 }
  //   "n>0"           → { n: 1 }
  //   "n,m>=1"        → { n: 1, m: 1 }
  //   "n>=1,m>=0"     → { n: 1, m: 0 }
  //   "n>=2,m>=1"     → { n: 2, m: 1 }
  const varMins = {};
  if (conds) {
    // Match groups: one or more variable names (comma-separated), then >=|> and a number
    const condRe = /([a-zA-Z](?:,[a-zA-Z])*)(>=|>)(\d+)/g;
    let cm;
    while ((cm = condRe.exec(conds)) !== null) {
      const vars   = cm[1].split(',');
      const op     = cm[2];
      let   val    = parseInt(cm[3], 10);
      if (op === '>') val += 1;   // strict > : n>0 means n>=1
      vars.forEach(v => { varMins[v.trim()] = val; });
    }
  }
  // Helper: get the minimum for a variable (default 0 if not found in conditions)
  const minForVar = (v) => (varMins[v] !== undefined ? varMins[v] : 0);

  // Determine variables — group by BASE variable name (ignoring coefficient)
  const varOccurrences = {};
  chunks.forEach(c => {
    if (c.varName === null) return; // constant exponent, skip
    varOccurrences[c.varName] = (varOccurrences[c.varName] || 0) + 1;
  });

  const dependentVars = [];
  const independentVars = [];
  for (const [v, count] of Object.entries(varOccurrences)) {
    if (count > 1) dependentVars.push(v);
    else independentVars.push(v);
  }

  const varsUsingP = new Set();
  let varsNeedingSliders = [];

  if (dependentVars.length > 0) {
    dependentVars.forEach(v => varsUsingP.add(v));
    varsNeedingSliders = independentVars.map(v => ({ name: v, min: minForVar(v) }));
  } else {
    // All are independent. The first gets p to represent the pumping length test bound.
    if (independentVars.length > 0) {
      varsUsingP.add(independentVars[0]);
    }
    // Every remaining independent variable needs its own slider
    varsNeedingSliders = independentVars.slice(1).map(v => ({ name: v, min: minForVar(v) }));
  }

  const generate = (p, dynamicVars = {}) => {
    let res = '';

    // Assign BASE variable values, respecting each variable's own minimum
    const varValues = {};
    chunks.forEach(c => {
      if (c.varName === null) return; // constant exponent handled below
      if (varValues[c.varName] === undefined) {
        const vMin = minForVar(c.varName);
        if (varsUsingP.has(c.varName)) {
          varValues[c.varName] = Math.max(p, vMin);
        } else {
          const sliderVal = dynamicVars[c.varName] !== undefined ? dynamicVars[c.varName] : vMin;
          varValues[c.varName] = Math.max(sliderVal, vMin);
        }
      }
    });

    // Build string: repeat count = coeff * varValue  (or just coeff for constants)
    chunks.forEach(c => {
      const count = c.varName !== null
        ? c.coeff * varValues[c.varName]
        : c.coeff; // constant exponent e.g. a^3
      res += c.char.repeat(count);
    });
    return res;
  };

  const accepts = (s) => {
    // 1. Build a strict block-matching regex
    let reStr = '^';
    chunks.forEach(c => {
      const escaped = c.char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      reStr += `((?:${escaped})*)`;
    });
    reStr += '$';

    const blockMatch = s.match(new RegExp(reStr));
    if (!blockMatch) return false;

    // 2. Extract block lengths (divide by char-group length for multi-char chars like "(ab)")
    const blockLengths = chunks.map((c, i) => blockMatch[i + 1].length / c.char.length);

    // 3. Verify variable constraints per-variable minimum and coefficient relationship
    const varValues = {};
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const len = blockLengths[i];

      if (c.varName === null) {
        // Constant exponent: block must be exactly coeff chars
        if (len !== c.coeff) return false;
        continue;
      }

      // Derive base variable value: len must be divisible by coeff
      if (c.coeff > 0 && len % c.coeff !== 0) return false;
      const baseVal = len / c.coeff;

      // Check this variable's own minimum (not a global one)
      if (baseVal < minForVar(c.varName)) return false;

      if (varValues[c.varName] === undefined) {
        varValues[c.varName] = baseVal;
      } else {
        if (varValues[c.varName] !== baseVal) return false;
      }
    }
    return true;
  };

  const isRegular = dependentVars.length === 0;
  const descParts = [];
  if (dependentVars.length > 0) descParts.push(`Dependent: ${dependentVars.join(', ')}`);
  if (independentVars.length > 0) descParts.push(`Independent: ${independentVars.join(', ')}`);
  const desc = `Parsed -> ${descParts.join(' | ')}. ${isRegular ? '(Regular)' : '(Non-Regular)'}`;

  const varsObj = {
      dependents: dependentVars,
      independents: independentVars.map(v => ({ name: v, min: minForVar(v) }))
  };

  // Expose varMins so callers can inspect per-variable floors
  return { generate, accepts, desc, varsObj, varsNeedingSliders, varMins, minForVar };
}

const LANGUAGES = {
  '0n1n': {
    label:       'L = { 0ⁿ 1ⁿ | n ≥ 1 }',
    description: 'Equal number of 0s followed by equal number of 1s. Classic non-regular language.',
    generate:    generateString,
    accepts:     isInLanguage,
  },
  'apbp': {
    label:       'L = { aᵖ bᵖ | p ≥ 1 }',
    description: "Equal number of a's followed by equal number of b's. Structurally identical to 0ⁿ1ⁿ.",
    generate:    (n) => 'a'.repeat(n) + 'b'.repeat(n),
    accepts:     (s) => {
      if (!s.length || s.length % 2 !== 0) return false;
      const h = s.length / 2;
      return /^a+$/.test(s.slice(0, h)) && /^b+$/.test(s.slice(h));
    },
  },
  'anbn_cn': {
    label:       'L = { aⁿ bⁿ cⁿ | n ≥ 1 }',
    description: "Equal number of a's, b's, and c's in order. Even harder than aⁿbⁿ.",
    generate:    (n) => 'a'.repeat(n) + 'b'.repeat(n) + 'c'.repeat(n),
    accepts:     (s) => {
      if (!s.length || s.length % 3 !== 0) return false;
      const t = s.length / 3;
      return new RegExp(`^a{${t}}b{${t}}c{${t}}$`).test(s);
    },
  },
  'palindrome': {
    label:       'L = { wwᴿ | w ∈ {a,b}* }',
    description: 'Even-length palindromes over {a,b}. The reverse of w concatenated after w.',
    generate:    (n) => {
      let w = '';
      for (let k = 0; k < n; k++) w += k % 2 === 0 ? 'a' : 'b';
      return w + [...w].reverse().join('');
    },
    accepts: (s) => {
      if (s.length % 2 !== 0) return false;
      const w = s.slice(0, s.length / 2);
      return s.slice(s.length / 2) === [...w].reverse().join('');
    },
  },
  'anbm': {
    label:       'L = { aⁿ bᵐ | n, m ≥ 0 }',
    description: 'Any number of a\'s followed by any number of b\'s. This language is REGULAR. The Pumping Lemma will always pass!',
    generate:    (n) => 'a'.repeat(n) + 'b'.repeat(n),
    accepts:     (s) => /^a*b*$/.test(s),
  },
  'custom': {
    label:       'Custom (Math Notation)',
    description: 'Provide a set-builder notation expression. Validated automatically by our expression parser.',
    generate:    (p) => {
      const parsed = parseLanguageNotation(state.customMathVal);
      if (parsed && !parsed.error) return parsed.generate(p, state.dynamicVars);
      return '';
    },
    accepts:     (s) => {
      const parsed = parseLanguageNotation(state.customMathVal);
      if (!parsed || parsed.error) return false;
      return parsed.accepts(s);
    },
  },
};

// Central reactive state
const state = {
  currentStep: 1,
  langKey: '0n1n',
  p:       3,
  s:       '',
  xLen:    0,
  yLen:    1,
  i:       0,
  prevI:   0,   // track previous i for animation direction
  customMathVal:   'a^n b^n | n >= 1',
  dynamicVars: {},
  currentDynamicSignature: null,
};

// DOM shortcut
const $ = (id) => document.getElementById(id);

const DOM = {
  langSelect:    $('languageSelect'),
  langDesc:      $('langDescription'),
  pSlider:       $('pumpingLengthSlider'),
  pInput:        $('pumpingLength'),
  
  customInputs:  $('customInputs'),
  customMath:    $('customMath'),
  customParseOk: $('customParseStatus'),

  stringDisplay: $('stringDisplay'),
  stringLength:  $('stringLength'),
  stringValue:   $('stringValue'),

  xLen:          $('xLength') || $('xLen'), // Fallback depending on versions!
  xLenVal:       $('xLengthVal') || $('xLenVal'),
  yLen:          $('yLength') || $('yLen'),
  yLenVal:       $('yLengthVal') || $('yLenVal'),
  partitionWarn: $('partitionWarning'),
  partitionDisp: $('partitionDisplay'),
  xValue:        $('xValue'),
  yValue:        $('yValue'),
  zValue:        $('zValue'),

  iSlider:       $('pumpFactorSlider') || $('iSlider'),
  iValue:        $('pumpFactor') || $('iValue'),
  pumpedDisplay: $('pumpedDisplay'),
  pumpedLength:  $('pumpedLength'),
  pumpedValue:   $('pumpedValue'),

  mathExplain:   $('mathExplanation'),
  mathCounts:    $('mathCounts'),
  mathVerdict:   $('mathVerdict'),
  mathReasoning: $('mathReasoning'),

  resultPanel:   $('resultPanel'),
  resultIcon:    $('resultIcon'),
  resultTitle:   $('resultTitle'),
  resultExplain: $('resultExplanation'),
  proofTable:    $('proofTable'),

  sectionPump:   $('section-pump') || $('sectionPump'),
  pumpExplanation: $('pumpExplanation'),

  btnNext2: $('btn-next-2'),
  btnNext3: $('btn-next-3'),
  btnNext4: $('btn-next-4'),
  btnNext5: $('btn-next-5'),

  btnPrev1: $('btn-prev-1'),
  btnPrev2: $('btn-prev-2'),
  btnPrev3: $('btn-prev-3'),
  btnPrev4: $('btn-prev-4'),
  btnRestart: $('btn-restart'),

  tourButtonContainer: $('tourButtonContainer'),
  btnStartTour: $('btn-start-tour'),
  tourBanner: $('tourBanner'),
  tourTitle: $('tourTitle'),
  tourText: $('tourText'),
  btnTourNext: $('btn-tour-next'),
  btnTourEnd: $('btn-tour-end'),

  btnThemeToggle: $('btn-theme-toggle'),
  themeIconLight: $('theme-icon-light'),
  themeIconDark: $('theme-icon-dark'),

  btnAnalyzeAll: $('btn-analyze-all'),
  proofModal: $('proofModal'),
  proofModalContent: $('proofModalContent'),
  proofModalTable: $('proofModalTable'),
  proofVerdictPanel: $('proofVerdictPanel'),
  btnCloseProof: $('btn-close-proof'),
};

const clamp  = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const clearEl = (el) => { el.innerHTML = ''; };

/** Build a styled character cell with animation class and optional index label. */
function buildCell(ch, colorCls, animCls, delay = 0, idx = null) {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  });

  const cell = document.createElement('span');
  cell.className = `char-cell ${colorCls} ${animCls}`;
  cell.textContent = ch;
  cell.title = idx !== null ? `Index ${idx}` : ch;
  if (delay) cell.style.animationDelay = `${delay}ms`;
  wrap.appendChild(cell);

  if (idx !== null) {
    const lbl = document.createElement('span');
    lbl.className = 'index-label';
    lbl.textContent = idx;
    wrap.appendChild(lbl);
  }
  return wrap;
}

/** Vertical separator between x/y/z regions. */
function buildSep() {
  const sep = document.createElement('div');
  sep.className = 'seg-separator';
  return sep;
}

/** Proof table row HTML. */
function proofRow(property, value, ok) {
  const cls   = ok === null ? 'badge-na' : ok ? 'badge-ok' : 'badge-fail';
  const badge = ok === null ? '—' : ok ? '✓ YES' : '✗ NO';
  return `<tr>
    <td class="pr-4 text-slate-600 py-1.5">${property}</td>
    <td class="font-mono text-slate-800 py-1.5">${value}</td>
    <td class="pl-4 py-1.5 ${cls}">${badge}</td>
  </tr>`;
}


/* ════════════════════════════════════════════════════════════
   §7  DERIVED VALUES
   ════════════════════════════════════════════════════════════ */

function deriveValues() {
  const lang = LANGUAGES[state.langKey];

  let customError = null;
  if (state.langKey === 'custom') {
    const parsed = parseLanguageNotation(state.customMathVal);
    if (!parsed || parsed.error) customError = parsed ? parsed.error : 'Invalid generic notation.';
  }

  // Generate string
  state.s = lang.generate(state.p);
  const sLen = state.s.length;

  // Clamp partition sliders
  const xMax = Math.max(0, state.p - 1);
  state.xLen = clamp(state.xLen, 0, xMax);
  const yMax = Math.max(1, Math.min(state.p - state.xLen, Math.max(1, sLen - state.xLen)));
  state.yLen = clamp(state.yLen, 1, yMax);

  if(DOM.xLen) { DOM.xLen.max = xMax;  DOM.xLen.value = state.xLen; }
  if(DOM.yLen) { DOM.yLen.max = yMax;  DOM.yLen.value = state.yLen; }

  // Slice into x, y, z
  const xStr = state.s.slice(0, state.xLen);
  const yStr = state.s.slice(state.xLen, state.xLen + state.yLen);
  const zStr = state.s.slice(state.xLen + state.yLen);

  // Check Pumping Lemma constraints
  const constraints = checkConstraints(xStr, yStr, zStr, state.s, state.p);

  if (customError) {
    constraints.allValid = false;
    constraints.errorMsg = `⚠ Invalid Language Notation: ${customError}`;
  }

  // Build pumped string
  const pumpedY  = yStr.repeat(state.i);
  const pumped   = pumpString(xStr, yStr, zStr, state.i);
  const inLang   = constraints.allValid ? lang.accepts(pumped) : false;

  // Analyse for math explanation
  const analysis = analyseString(pumped, state.langKey, inLang, constraints.allValid);

  return { lang, sLen, xStr, yStr, zStr, pumpedY, pumped, constraints, inLang, analysis };
}


/* ════════════════════════════════════════════════════════════
   §8  RENDER FUNCTIONS
   ════════════════════════════════════════════════════════════ */

function renderDynamicSliders(slidersList) {
  const container = document.getElementById('dynamic-sliders-container');
  if (!container) return;

  if (!slidersList || slidersList.length === 0) {
      container.innerHTML = '';
      state.dynamicVars = {};
      return;
  }

  const newDynamicVars = {};
  slidersList.forEach(obj => {
      newDynamicVars[obj.name] = Math.max(state.dynamicVars[obj.name] !== undefined ? state.dynamicVars[obj.name] : obj.min, obj.min);
  });
  state.dynamicVars = newDynamicVars;

  container.innerHTML = '';
  slidersList.forEach(obj => {
      const v = obj.name;
      const minVal = obj.min;
      
      const div = document.createElement('div');
      div.className = 'flex items-center gap-3 fade-in-up form-group mt-2 bg-white p-2 rounded';
      
      // Label
      const label = document.createElement('label');
      label.className = 'form-label text-indigo-300 w-32 mb-0 shrink-0';
      label.innerHTML = `Independent $${v}$`;
      
      // Control wrapper
      const controls = document.createElement('div');
      controls.className = 'flex items-center gap-3 flex-1';

      // Range Slider
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'flex-1 accent-indigo-400 cursor-pointer';
      slider.min = minVal;
      slider.max = 10;
      slider.value = state.dynamicVars[v];
      
      // Number Input
      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.className = 'form-input w-20 text-center font-mono';
      numInput.min = minVal;
      numInput.max = 10;
      numInput.value = state.dynamicVars[v];
      
      slider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          state.dynamicVars[v] = val;
          numInput.value = val;
          state.xLen = 0; state.yLen = 1;
          update();
      });

      numInput.addEventListener('change', (e) => {
          const val = Math.max(minVal, parseInt(e.target.value, 10) || minVal);
          state.dynamicVars[v] = val;
          e.target.value = val;
          slider.value = val;
          state.xLen = 0; state.yLen = 1;
          update();
      });

      controls.appendChild(slider);
      controls.appendChild(numInput);
      div.appendChild(label);
      div.appendChild(controls);
      container.appendChild(div);
  });

  if (window.renderMathInElement) {
      renderMathInElement(container, { delimiters: [{ left:'$', right:'$', display:false }] });
  }
}

/** Section 2 – render original string with neutral cells. */
function renderStringDisplay(s) {
  clearEl(DOM.stringDisplay);
  for (let idx = 0; idx < s.length; idx++) {
    DOM.stringDisplay.appendChild(buildCell(s[idx], 'char-default', 'cell-enter', idx * 30, idx));
  }
  DOM.stringLength.textContent = s.length;
  DOM.stringValue.textContent  = s;
}

/** Section 3 – render colour-coded partition cells. */
function renderPartition(s, xLen, yLen) {
  clearEl(DOM.partitionDisp);
  const frag = document.createDocumentFragment();
  let prev = null;

  for (let idx = 0; idx < s.length; idx++) {
    const seg = idx < xLen ? 'x' : idx < xLen + yLen ? 'y' : 'z';
    const cls = seg === 'x' ? 'char-x' : seg === 'y' ? 'char-y' : 'char-z';
    if (prev && prev !== seg) frag.appendChild(buildSep());
    frag.appendChild(buildCell(s[idx], cls, 'cell-enter', idx * 25, idx));
    prev = seg;
  }
  DOM.partitionDisp.appendChild(frag);

  DOM.xLenVal.textContent = xLen;
  DOM.yLenVal.textContent = yLen;
  DOM.xValue.textContent  = s.slice(0, xLen)           || 'ε';
  DOM.yValue.textContent  = s.slice(xLen, xLen + yLen) || 'ε';
  DOM.zValue.textContent  = s.slice(xLen + yLen)        || 'ε';
}

/** Show constraint warning text in Section 3. */
function renderConstraintWarning(constraints) {
  DOM.partitionWarn.textContent = constraints.allValid ? '' : constraints.errorMsg;
}

/** Dim Section 4 entirely when partition is invalid. */
function renderPumpLock(constraints) {
  const locked = !constraints.allValid;
  DOM.sectionPump.style.opacity       = locked ? '0.4' : '1';
  DOM.sectionPump.style.pointerEvents = locked ? 'none' : 'auto';
  DOM.sectionPump.title               = locked ? 'Fix the partition constraints above first.' : '';
}

/**
 * Section 4 – render the pumped string x(yⁱ)z with animation.
 *
 * Animation strategy:
 *   • x and z cells use cellEnter (gentle slide-up), staggered by position.
 *   • y^i cells use pumpWave (spring bounce) with stagger, so each copy
 *     of y visibly "pumps in" one after another.
 *   • When i decreased from previous render the whole display re-renders
 *     cleanly (exit animation is handled by CSS on removed elements via
 *     a brief timeout before we rebuild).
 */
function renderPumpedString({ xStr, yStr, pumpedY, zStr, pumped }) {
  const container = DOM.pumpedDisplay;

  // If i dropped, flash a brief exit before rebuilding
  const iDecreased = state.i < state.prevI;

  const buildAndInsert = () => {
    clearEl(container);
    const frag = document.createDocumentFragment();
    let prev = null;
    let globalIdx = 0;

    // ── x cells ──
    for (let k = 0; k < xStr.length; k++) {
      if (prev && prev !== 'x') frag.appendChild(buildSep());
      frag.appendChild(buildCell(xStr[k], 'char-x', 'cell-enter', globalIdx * 30));
      globalIdx++; prev = 'x';
    }

    // ── y^i cells (one copy of y at a time, with a wave per copy) ──
    const copies = state.i;
    const yLen   = yStr.length;
    for (let copy = 0; copy < copies; copy++) {
      if (prev && prev !== 'y') frag.appendChild(buildSep());
      for (let k = 0; k < yLen; k++) {
        // Stagger: base delay from position + extra delay per copy (so each
        // copy "pumps in" after the previous one lands).
        const delay = (xStr.length + copy * yLen + k) * 30 + copy * 60;
        frag.appendChild(buildCell(pumpedY[copy * yLen + k], 'char-pumped-y', 'cell-pump', delay));
        globalIdx++; prev = 'y';
      }
    }

    // ── z cells ──
    const zOffset = xStr.length + pumpedY.length;
    for (let k = 0; k < zStr.length; k++) {
      if (prev && prev !== 'z') frag.appendChild(buildSep());
      const delay = (zOffset + k) * 30 + copies * 60;
      frag.appendChild(buildCell(zStr[k], 'char-z', 'cell-enter', delay));
      globalIdx++; prev = 'z';
    }

    // ── Empty string edge-case ──
    if (pumped.length === 0) {
      const eps = document.createElement('span');
      eps.className = 'text-gray-500 text-sm italic px-2';
      eps.textContent = 'ε (empty string)';
      frag.appendChild(eps);
    }

    container.appendChild(frag);
  };

  if (iDecreased) {
    // Brief exit-flash: mark existing cells, rebuild after short delay
    [...container.querySelectorAll('.char-cell')].forEach((el, k) => {
      el.classList.remove('cell-enter', 'cell-pump');
      el.classList.add('cell-exit');
      el.style.animationDelay = `${k * 15}ms`;
    });
    setTimeout(buildAndInsert, 220);
  } else {
    buildAndInsert();
  }

  DOM.pumpedLength.textContent = pumped.length;
  DOM.pumpedValue.textContent  = pumped || 'ε';
}

/**
 * Section 4 (bottom) – render the educational math explanation panel.
 * Shows per-symbol counts, an inequality / equality statement, and
 * a plain-English conclusion.
 */
function renderMathExplanation({ analysis, inLang, constraints }) {
  const panel = DOM.mathExplain;

  // Remove old state classes
  panel.classList.remove('math-pass', 'math-fail', 'math-warn');

  if (!constraints.allValid) {
    panel.classList.add('math-warn');
    clearEl(DOM.mathCounts);
    DOM.mathVerdict.textContent   = '';
    DOM.mathReasoning.textContent = analysis.reasoning;
    DOM.mathReasoning.className   = 'math-reasoning verdict-warn';
    return;
  }

  // ── Symbol count chips ──
  clearEl(DOM.mathCounts);
  analysis.chips.forEach(({ ch, count, cls, label }) => {
    const chip = document.createElement('span');
    chip.className   = `math-count-chip ${cls}`;
    chip.textContent = label;
    chip.style.animation = 'cellEnter 0.3s ease both';
    DOM.mathCounts.appendChild(chip);
  });

  // ── Verdict line ──
  panel.classList.add(inLang ? 'math-pass' : 'math-fail');
  DOM.mathVerdict.textContent = analysis.verdict;
  DOM.mathVerdict.className   = `math-verdict ${inLang ? 'verdict-pass' : 'verdict-fail'}`;

  // ── Reasoning ──
  DOM.mathReasoning.textContent = analysis.reasoning;
  DOM.mathReasoning.className   = 'math-reasoning';
}

/** Section 5 – result panel + proof table. */
function updateResults({ constraints, pumped, inLang }) {
  const panel = DOM.resultPanel;
  panel.classList.remove('result-idle', 'result-pass', 'result-fail', 'result-warning');

  let cls, icon, title, explanation;

  if (!constraints.allValid) {
    cls         = 'result-warning';
    icon        = '⚠️';
    title       = 'Partition violates Pumping Lemma constraints';
    explanation = constraints.errorMsg;
  } else if (inLang) {
    cls         = 'result-pass';
    icon        = '✅';
    title       = 'PASS — Pumped string is in the language';
    explanation = `"${pumped}" ∈ L. The lemma holds for i = ${state.i}.  Try i = 0 or larger i!`;
  } else {
    cls         = 'result-fail';
    icon        = '❌';
    title       = 'FAIL — Pumping Lemma violated! Contradiction found.';
    explanation = `"${pumped}" ∉ L. See the math breakdown above for why. This is the proof that L is not regular!`;
  }

  panel.classList.add(cls, 'fade-in-up');
  panel.addEventListener('animationend', () => panel.classList.remove('fade-in-up'), { once: true });

  DOM.resultIcon.textContent    = icon;
  DOM.resultTitle.textContent   = title;
  DOM.resultExplain.textContent = explanation;

  // Proof table rows
  const { c1_yNonEmpty, c2_xyLeqP, c3_xyzEqS } = constraints;
  DOM.proofTable.innerHTML = [
    proofRow('|s| ≥ p',              `${state.s.length} ≥ ${state.p}`,             state.s.length >= state.p),
    proofRow('Cond 1: |y| ≥ 1',      `|y| = ${state.yLen}`,                        c1_yNonEmpty),
    proofRow('Cond 2: |xy| ≤ p',     `${state.xLen + state.yLen} ≤ ${state.p}`,   c2_xyLeqP),
    proofRow('Cond 3: xyz = s',      c3_xyzEqS ? 'x+y+z = s ✓' : 'x+y+z ≠ s',    c3_xyzEqS),
    proofRow(`xy\u2071z ∈ L (i=${state.i})`,
             constraints.allValid ? `"${pumped}"` : '—',
             constraints.allValid ? inLang : null),
  ].join('');

  if (window.renderMathInElement) {
    renderMathInElement(DOM.proofTable, {
      delimiters: [{ left:'$$', right:'$$', display:true }, { left:'$', right:'$', display:false }],
    });
  }
}


/* ════════════════════════════════════════════════════════════
   §9  MAIN UPDATE LOOP
   ════════════════════════════════════════════════════════════ */

function update() {
  // Check if we need to build dynamic sliders BEFORE string generation phase
  let parsed = null;
  if (state.langKey === 'custom') {
      parsed = parseLanguageNotation(state.customMathVal);
  }
  
  const newSignature = JSON.stringify(parsed && !parsed.error ? parsed.varsNeedingSliders : null);
  if (state.currentDynamicSignature !== newSignature) {
      state.currentDynamicSignature = newSignature;
      renderDynamicSliders(parsed && !parsed.error ? parsed.varsNeedingSliders : null);
  }

  const derived = deriveValues();

  renderStringDisplay(state.s);

  renderPartition(state.s, state.xLen, state.yLen);
  renderConstraintWarning(derived.constraints);

  renderPumpLock(derived.constraints);
  renderPumpedString(derived);

  renderMathExplanation(derived);
  updateResults(derived);

  // Remember i so next render knows direction
  state.prevI = state.i;
}


/* ════════════════════════════════════════════════════════════
   §10  EVENT LISTENERS
   ════════════════════════════════════════════════════════════ */

DOM.langSelect.addEventListener('change', (e) => {
  state.langKey = e.target.value;
  DOM.langDesc.textContent = LANGUAGES[state.langKey].description;

  const isCustom = state.langKey === 'custom';
  DOM.customInputs.classList.toggle('hidden', !isCustom);
  if (isCustom) {
     const parsed = parseLanguageNotation(state.customMathVal);
     if (parsed && parsed.error) {
       DOM.customParseOk.textContent = `Error: ${parsed.error}`;
       DOM.customParseOk.className = "text-xs mt-1.5 text-rose-500";
     } else if (parsed) {
       DOM.customParseOk.textContent = `Parsed: ${parsed.desc}`;
       DOM.customParseOk.className = "text-xs mt-1.5 text-emerald-500";
     }
  }

  state.xLen = 0; state.yLen = 1;
  update();
  if (state.currentStep !== 1) goToStep(1);
});

const stepSections = [
  $('section-setup'),
  $('section-string'),
  $('section-partition'),
  $('section-pump'),
  $('section-result'),
];

function goToStep(newStep) {
  if (newStep === state.currentStep) return;

  const forward    = newStep > state.currentStep;
  const exitClass  = forward ? 'step-exit-forward'  : 'step-exit-back';
  const enterClass = forward ? 'step-enter-forward' : 'step-enter-back';
  const EXIT_MS    = 220;   // matches stepExitForward/Back duration in CSS

  const currentElem = stepSections[state.currentStep - 1];
  const newElem     = stepSections[newStep - 1];

  // ── 1. Play exit animation on current section ──────────────
  if (currentElem) {
    currentElem.classList.remove(
      'step-enter-forward', 'step-enter-back',
      'step-exit-forward',  'step-exit-back'
    );
    currentElem.classList.add(exitClass);
  }

  // ── 2. After exit finishes, swap and enter ──────────────────
  setTimeout(() => {
    if (currentElem) {
      currentElem.style.display = 'none';
      currentElem.classList.remove(exitClass);
    }

    state.currentStep = newStep;

    if (DOM.tourButtonContainer) {
      DOM.tourButtonContainer.style.display =
        (newStep === 1 && !tourActive) ? 'flex' : 'none';
    }

    if (newElem) {
      // Pre-set opacity:0 so the very first paint is invisible (no flash frame)
      newElem.style.opacity  = '0';
      newElem.style.display  = 'block';

      // Two rAF frames: first paints the block at opacity 0, second starts animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newElem.style.opacity = '';   // let the animation control opacity
          newElem.classList.remove(
            'step-enter-forward', 'step-enter-back',
            'step-exit-forward',  'step-exit-back'
          );
          newElem.classList.add(enterClass);

          // Clean up after animation ends
          newElem.addEventListener('animationend', () => {
            newElem.classList.remove(enterClass);
            newElem.style.willChange = '';
          }, { once: true });
        });
      });
    }
  }, EXIT_MS);
}

if (DOM.btnNext2) DOM.btnNext2.addEventListener('click', () => goToStep(2));
if (DOM.btnNext3) DOM.btnNext3.addEventListener('click', () => goToStep(3));
if (DOM.btnNext4) DOM.btnNext4.addEventListener('click', () => goToStep(4));
if (DOM.btnNext5) DOM.btnNext5.addEventListener('click', () => goToStep(5));

if (DOM.btnPrev1) DOM.btnPrev1.addEventListener('click', () => goToStep(1));
if (DOM.btnPrev2) DOM.btnPrev2.addEventListener('click', () => goToStep(2));
if (DOM.btnPrev3) DOM.btnPrev3.addEventListener('click', () => goToStep(3));
if (DOM.btnPrev4) DOM.btnPrev4.addEventListener('click', () => goToStep(4));

if (DOM.btnRestart) {
  DOM.btnRestart.addEventListener('click', () => {
    goToStep(1);
    state.xLen = 0; state.yLen = 1;
    update();
  });
}

DOM.customMath.addEventListener('input', (e) => {
  state.customMathVal = e.target.value;
  const parsed = parseLanguageNotation(state.customMathVal);
  if (parsed && parsed.error) {
    DOM.customParseOk.textContent = `Error: ${parsed.error}`;
    DOM.customParseOk.className = "text-xs mt-1.5 text-rose-500";
  } else if (parsed) {
    DOM.customParseOk.textContent = `Parsed: ${parsed.desc}`;
    DOM.customParseOk.className = "text-xs mt-1.5 text-emerald-500";
    state.xLen = 0; state.yLen = 1;
    update();
  }
});

// Config hint buttons
document.querySelectorAll('.custom-hint-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.customMathVal = btn.dataset.expr;
    DOM.customMath.value = state.customMathVal;
    DOM.customMath.dispatchEvent(new Event('input'));
  });
});


function syncP(raw) {
  state.p     = clamp(parseInt(raw, 10) || 1, 1, 10);
  DOM.pSlider.value = state.p;
  DOM.pInput.value  = state.p;
  state.xLen = 0; state.yLen = 1;
  update();
}
DOM.pSlider.addEventListener('input',  (e) => syncP(e.target.value));
DOM.pInput .addEventListener('change', (e) => syncP(e.target.value));

DOM.xLen.addEventListener('input', (e) => {
  state.xLen = parseInt(e.target.value, 10);
  update();
});

DOM.yLen.addEventListener('input', (e) => {
  state.yLen = parseInt(e.target.value, 10);
  update();
});

function syncI(raw) {
  state.prevI = state.i;
  state.i     = clamp(parseInt(raw, 10) || 0, 0, 6);
  DOM.iSlider.value = state.i;
  DOM.iValue.value  = state.i;
  update();
}
DOM.iSlider.addEventListener('input',  (e) => syncI(e.target.value));
DOM.iValue .addEventListener('change', (e) => syncI(e.target.value));


/* ════════════════════════════════════════════════════════════
   §10  ULTIMATE VISUAL PROOF
   ════════════════════════════════════════════════════════════ */

function analyzeAllPartitions() {
  const { p, s } = state;
  const langKey = state.langKey;
  let L_check_func;
  
  if (langKey === 'custom') {
    const parsed = parseLanguageNotation(state.customMathVal);
    L_check_func = parsed.accepts;
  } else {
    L_check_func = LANGUAGES[langKey].accepts;
  }

  let allFailed = true;
  const results = [];

  for (let xL = 0; xL <= p - 1; xL++) {
    for (let yL = 1; yL <= p - xL; yL++) {
      const x = s.substring(0, xL);
      const y = s.substring(xL, xL + yL);
      const z = s.substring(xL + yL);
      
      let killerI = null;
      let killerString = null;
      let survived = true;
      
      // Test pumping factors 0 to 6
      for (let testI = 0; testI <= 6; testI++) {
        const pumped = x + y.repeat(testI) + z;
        if (!L_check_func(pumped)) {
          killerI = testI;
          killerString = pumped;
          survived = false;
          break;
        }
      }
      
      if (survived) allFailed = false;
      
      results.push({ x, y, z, xL, yL, killerI, killerString, survived });
    }
  }
  
  renderProofModal(results, allFailed);
}

function renderProofModal(results, allFailed) {
  const tbody = DOM.proofModalTable;
  tbody.innerHTML = results.map(r => {
    const partitionStr = `<span class="text-indigo-500 dark:text-indigo-400 font-mono">${r.x}</span><span class="text-emerald-500 dark:text-emerald-400 font-mono font-bold">${r.y}</span><span class="text-rose-500 dark:text-rose-400 font-mono">${r.z}</span>`;
    
    if (r.survived) {
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
          <td class="py-3 px-6">${partitionStr}</td>
          <td class="py-3 px-6 text-center text-slate-500 dark:text-slate-400">—</td>
          <td class="py-3 px-6 font-mono text-emerald-600 dark:text-emerald-400 text-sm">Survived (i=0..6)</td>
          <td class="py-3 px-6 text-center"><span class="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">Valid Pump ✓</span></td>
        </tr>
      `;
    } else {
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
          <td class="py-3 px-6">${partitionStr}</td>
          <td class="py-3 px-6 font-mono font-bold text-amber-500 text-center">${r.killerI}</td>
          <td class="py-3 px-6 font-mono text-slate-700 dark:text-slate-300 text-sm max-w-[200px] truncate" title="${r.killerString}">${r.killerString}</td>
          <td class="py-3 px-6 text-center"><span class="inline-flex items-center justify-center bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">Failed ❌</span></td>
        </tr>
      `;
    }
  }).join('');
  
  const verdictPanel = DOM.proofVerdictPanel;
  if (allFailed) {
    verdictPanel.innerHTML = `
      <div class="flex items-center gap-4 bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl shadow-inner">
        <div class="text-4xl drop-shadow-sm">🏆</div>
        <div>
          <h4 class="text-emerald-900 dark:text-emerald-400 font-extrabold text-[1.1rem] mb-1">Q.E.D. Language is NON-REGULAR</h4>
          <p class="text-emerald-800 dark:text-emerald-500 text-[0.9rem] leading-relaxed">Every single valid partition where $|xy| \\leq p$ failed the Pumping Lemma constraints. The contradiction is mathematically absolute.</p>
        </div>
      </div>
    `;
  } else {
    verdictPanel.innerHTML = `
      <div class="flex items-center gap-4 bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-inner">
        <div class="text-4xl drop-shadow-sm">⚠️</div>
        <div>
          <h4 class="text-amber-900 dark:text-amber-400 font-extrabold text-[1.1rem] mb-1">Inconclusive or Regular</h4>
          <p class="text-amber-800 dark:text-amber-500 text-[0.9rem] leading-relaxed">At least one partition survived the pump test up to $i=6$. The language might be regular, or you may need a larger $i$ bound to break it.</p>
        </div>
      </div>
    `;
  }
  
  if (window.renderMathInElement) {
    renderMathInElement(verdictPanel, { delimiters: [{left:'$$',right:'$$',display:true}, {left:'$',right:'$',display:false}] });
    renderMathInElement(tbody, { delimiters: [{left:'$$',right:'$$',display:true}, {left:'$',right:'$',display:false}] });
  }

  DOM.proofModal.classList.remove('opacity-0', 'pointer-events-none');
  DOM.proofModalContent.classList.remove('scale-95');
  DOM.proofModalContent.classList.add('scale-100');
}

function closeProofModal() {
  DOM.proofModal.classList.add('opacity-0', 'pointer-events-none');
  DOM.proofModalContent.classList.remove('scale-100');
  DOM.proofModalContent.classList.add('scale-95');
}

if (DOM.btnAnalyzeAll) DOM.btnAnalyzeAll.addEventListener('click', analyzeAllPartitions);
if (DOM.btnCloseProof) DOM.btnCloseProof.addEventListener('click', closeProofModal);

/* ════════════════════════════════════════════════════════════
   §11  THEME TOGGLE
   ════════════════════════════════════════════════════════════ */
function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    if (DOM.themeIconLight) DOM.themeIconLight.classList.remove('hidden');
    if (DOM.themeIconDark) DOM.themeIconDark.classList.add('hidden');
  }
}

if (DOM.btnThemeToggle) {
  DOM.btnThemeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    if (DOM.themeIconLight) DOM.themeIconLight.classList.toggle('hidden', !isDark);
    if (DOM.themeIconDark) DOM.themeIconDark.classList.toggle('hidden', isDark);
  });
}

/* ════════════════════════════════════════════════════════════
   §12  INTERACTIVE GUIDED TOUR
   ════════════════════════════════════════════════════════════ */
let tourActive = false;
let tourResolveNext = null;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function setTourMessage(title, msg) {
  if (DOM.tourTitle) DOM.tourTitle.textContent = title;
  if (DOM.tourText) DOM.tourText.textContent = msg;
  if (DOM.btnTourNext) DOM.btnTourNext.style.display = 'block';
  return new Promise(resolve => {
    tourResolveNext = resolve;
  });
}

function clearTourHighlights() {
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
}

async function startTour() {
  if (tourActive) return;
  tourActive = true;
  goToStep(1);
  
  if (DOM.tourBanner) DOM.tourBanner.classList.add('tour-active-banner');
  
  // Phase 1 Setup
  state.langKey = '0n1n';
  if (DOM.langSelect) { DOM.langSelect.value = '0n1n'; DOM.langSelect.dispatchEvent(new Event('change')); }
  await delay(100);
  
  state.p = 3;
  if (DOM.pSlider) { DOM.pSlider.value = 3; DOM.pSlider.dispatchEvent(new Event('input')); }
  
  if (DOM.langSelect) DOM.langSelect.classList.add('tour-highlight');
  if (DOM.pSlider) DOM.pSlider.classList.add('tour-highlight');
  
  await setTourMessage("Step 1: Setup", "Welcome! Let's test the classic language L = { 0ⁿ 1ⁿ }. We'll start by selecting a pumping length p = 3.");
  if (!tourActive) return;
  clearTourHighlights();
  
  // Phase 2
  goToStep(2);
  await delay(400);
  if (DOM.stringDisplay) DOM.stringDisplay.classList.add('tour-highlight');
  await setTourMessage("Step 2: String Generation", "A string is generated honoring |s| ≥ p. Observe the string '000111'. Its length is 6, which is ≥ 3.");
  if (!tourActive) return;
  clearTourHighlights();
  
  // Phase 3
  goToStep(3);
  await delay(400);
  
  state.xLen = 0;
  if (DOM.xLen) { DOM.xLen.value = 0; DOM.xLen.dispatchEvent(new Event('input')); }
  await delay(200);
  
  state.yLen = 2;
  if (DOM.yLen) { DOM.yLen.value = 2; DOM.yLen.dispatchEvent(new Event('input')); }
  
  if (DOM.partitionDisp) DOM.partitionDisp.classList.add('tour-highlight');
  await setTourMessage("Step 3: Partitioning", "The hardest part is partitioning into x, y, z. We must follow |xy| ≤ p && |y| ≥ 1. Let's test x=ε (len 0) and y='00' (len 2).");
  if (!tourActive) return;
  clearTourHighlights();
  
  // Phase 4
  goToStep(4);
  await delay(400);
  
  state.i = 2;
  if (DOM.iSlider) { DOM.iSlider.value = 2; DOM.iSlider.dispatchEvent(new Event('input')); }
  
  if (DOM.pumpedDisplay) DOM.pumpedDisplay.classList.add('tour-highlight');
  await setTourMessage("Step 4: Pumping", "Now we pump y! Notice how the '0's duplicate because i=2, but '1's stay exactly the same.");
  if (!tourActive) return;
  clearTourHighlights();
  
  // Phase 5
  goToStep(5);
  await delay(400);
  
  if (DOM.mathExplain) DOM.mathExplain.classList.add('tour-highlight');
  await setTourMessage("Step 5: Contradiction", "Because the '0's outnumber the '1's, the pumped string is NO LONGER inside L = { 0ⁿ 1ⁿ }. Contradiction found! That proves L is NOT regular.");
  if (!tourActive) return;
  clearTourHighlights();
  
  // End Tour
  endTour();
}

function endTour() {
  tourActive = false;
  
  if (state.currentStep === 1 && DOM.tourButtonContainer) {
    DOM.tourButtonContainer.style.display = 'flex';
  }
  
  if (DOM.tourBanner) DOM.tourBanner.classList.remove('tour-active-banner');
  clearTourHighlights();
  if (tourResolveNext) {
    tourResolveNext();
    tourResolveNext = null;
  }
}

if (DOM.btnStartTour) DOM.btnStartTour.addEventListener('click', startTour);
if (DOM.btnTourNext) {
  DOM.btnTourNext.addEventListener('click', () => {
    if (tourResolveNext) {
      const res = tourResolveNext;
      tourResolveNext = null;
      res();
    }
  });
}
if (DOM.btnTourEnd) DOM.btnTourEnd.addEventListener('click', endTour);

/* ════════════════════════════════════════════════════════════
   §13  INITIALISE
   ════════════════════════════════════════════════════════════ */
(function init() {
  initTheme();
  DOM.langDesc.textContent = LANGUAGES[state.langKey].description;
  DOM.pSlider.value = state.p;
  DOM.pInput.value  = state.p;
  DOM.iSlider.value = state.i;
  DOM.iValue.value  = state.i;
  update();
}());
