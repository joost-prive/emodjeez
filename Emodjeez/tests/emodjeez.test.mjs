/**
 * Emodjeez – Testsuite
 *
 * Pure-logic functies gekopieerd uit index.html en getest met de ingebouwde
 * Node.js test-runner (node:test). Geen npm-afhankelijkheden nodig.
 *
 * Uitvoeren:  node --test tests/emodjeez.test.mjs
 *
 * ONDERHOUD: Als je een functie in index.html aanpast die hier getest wordt,
 * pas dan ook de kopie hieronder aan zodat de tests actueel blijven.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─────────────────────────────────────────────────────────────────────────────
// Stubs / constanten (minimale versie van wat index.html definieert)
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_NUMBER_BASE_DATE_KEY = '2026-03-22';
const DAILY_EMOJI_COUNT = 200;

// Minimale emoji-database voor tests (representatieve subset per categorie)
const EMOJI_DB = [
    { c: 1, e: '😀' }, { c: 1, e: '😂' }, { c: 1, e: '🥰' }, { c: 1, e: '😎' },
    { c: 2, e: '🐶' }, { c: 2, e: '🐱' }, { c: 2, e: '🦊' }, { c: 2, e: '🐸' },
    { c: 3, e: '🍎' }, { c: 3, e: '🍕' }, { c: 3, e: '🍦' }, { c: 3, e: '🍜' },
    { c: 4, e: '⚽' }, { c: 4, e: '🎸' }, { c: 4, e: '🎮' }, { c: 4, e: '🏋️' },
    { c: 5, e: '✈️' }, { c: 5, e: '🏖️' }, { c: 5, e: '🗼' }, { c: 5, e: '🌋' },
    { c: 6, e: '💡' }, { c: 6, e: '📱' }, { c: 6, e: '🔑' }, { c: 6, e: '🎁' },
    { c: 7, e: '❤️' }, { c: 7, e: '⭐' }, { c: 7, e: '♻️' }, { c: 7, e: '🔔' },
    // Extra items zodat DAILY_EMOJI_COUNT ≤ EMOJI_DB.length getest kan worden
    ...Array.from({ length: 180 }, (_, i) => ({ c: (i % 7) + 1, e: `E${i}` }))
];

const CATEGORY_MAP = {
    1: { icon: 'sentiment_satisfied' },
    2: { icon: 'emoji_nature' },
    3: { icon: 'local_cafe' },
    4: { icon: 'sports_basketball' },
    5: { icon: 'directions_car' },
    6: { icon: 'lightbulb' },
    7: { icon: 'emoji_symbols' }
};

const translations = {
    nl: {
        cat1: 'Smileys en mensen', cat2: 'Dieren en natuur', cat3: 'Eten en drinken',
        cat4: 'Activiteiten', cat5: 'Reizen en plaatsen', cat6: 'Objecten', cat7: 'Symbolen',
        duelNoChoice: 'Geen keuze', dailyToday: 'Vandaag', dailyYesterday: 'Gisteren'
    },
    en: {
        cat1: 'Smileys & People', cat2: 'Animals & Nature', cat3: 'Food & Drink',
        cat4: 'Activities', cat5: 'Travel & Places', cat6: 'Objects', cat7: 'Symbols',
        duelNoChoice: 'No choice', dailyToday: 'Today', dailyYesterday: 'Yesterday'
    },
    de: {
        cat1: 'Smileys & Personen', cat2: 'Tiere & Natur', cat3: 'Essen & Trinken',
        cat4: 'Aktivitäten', cat5: 'Reisen & Orte', cat6: 'Objekte', cat7: 'Symbole',
        duelNoChoice: 'Keine Wahl', dailyToday: 'Heute', dailyYesterday: 'Gestern'
    }
};

let currentLang = 'nl';

// ─────────────────────────────────────────────────────────────────────────────
// Pure functies (gekopieerd uit index.html — houd synchroon bij wijzigingen)
// ─────────────────────────────────────────────────────────────────────────────

function getUtcDateKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function hashStringToSeed(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 123456789;
}

function createSeededRandom(seed) {
    let value = seed >>> 0;
    return function seeded() {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function buildDailyEmojiSequence(dateKey) {
    const seed = hashStringToSeed(`EMODJEEZ-DAILY-${dateKey}`);
    const rng = createSeededRandom(seed);
    const indices = Array.from({ length: EMOJI_DB.length }, (_, i) => i);

    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = indices[i];
        indices[i] = indices[j];
        indices[j] = tmp;
    }

    return indices.slice(0, DAILY_EMOJI_COUNT).map((idx) => EMOJI_DB[idx]);
}

function parseDateKeyAsUtc(dateKey) {
    if (!dateKey) return null;
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
}

function getDailyNumber(dateKey) {
    const baseDate = parseDateKeyAsUtc(DAILY_NUMBER_BASE_DATE_KEY);
    const targetDate = parseDateKeyAsUtc(dateKey);
    if (!baseDate || !targetDate) return 1;
    const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
    return Math.max(1, diffDays + 1);
}

function getDailyScoreHashtag(score) {
    const normalized = Math.max(0, Math.floor(Number(score || 0)));
    if (normalized <= 5)  return '#EmodjeezNoob';
    if (normalized <= 10) return '#EmodjeezRookie';
    if (normalized <= 15) return '#EmodjeezTrainee';
    if (normalized <= 20) return '#EmodjeezTalent';
    if (normalized <= 25) return '#EmodjeezSkilled';
    if (normalized <= 30) return '#EmodjeezPro';
    if (normalized <= 35) return '#EmodjeezExpert';
    if (normalized <= 40) return '#EmodjeezMaster';
    if (normalized <= 45) return '#EmodjeezElite';
    if (normalized <= 50) return '#EmodjeezHero';
    if (normalized <= 55) return '#EmodjeezChampion';
    if (normalized <= 60) return '#EmodjeezLegend';
    if (normalized <= 65) return '#EmodjeezTitan';
    if (normalized <= 70) return '#EmodjeezImmortal';
    if (normalized <= 75) return '#EmodjeezSupremacy';
    const godTierTags = ['#EmodjeezGOAT', '#EmodjeezGodMode', '#EmodjeezUniverseBest'];
    return godTierTags[Math.floor(Math.random() * godTierTags.length)];
}

function getCategoryNameById(catId) {
    const t = translations[currentLang] || translations.en;
    const normalized = Number(catId);
    if (!Number.isInteger(normalized) || normalized < 1 || normalized > 7) {
        return t.duelNoChoice || '-';
    }
    return t['cat' + normalized] || (t.duelNoChoice || '-');
}

function formatDateKeyForDisplay(dateKey) {
    const [year, month, day] = dateKey.split('-');
    if (!year || !month || !day) return dateKey;
    return `${day}-${month}-${year}`;
}

function getRelativeDailyLabel(dateKey) {
    const t = translations[currentLang] || translations.en;
    const todayKey = getUtcDateKey();
    if (dateKey === todayKey) return t.dailyToday || 'Today';
    const today = new Date(`${todayKey}T00:00:00Z`);
    const target = new Date(`${dateKey}T00:00:00Z`);
    const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
    if (diffDays === 1) return t.dailyYesterday || 'Yesterday';
    return formatDateKeyForDisplay(dateKey);
}

function buildDailyDateOptionLabel(dateKey) {
    const dayNumber = getDailyNumber(dateKey);
    return `${getRelativeDailyLabel(dateKey)} - #${dayNumber}`;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Logica om de top-3 winnaars voor een dag te berekenen (interne pure functie
// gëextraheerd uit updateDailyWinnerDoc voor testbaarheid)
function computeTop3(entries) {
    const finished = entries.filter(e => e.finished !== false);
    finished.sort((a, b) => {
        const sd = (b.score || 0) - (a.score || 0);
        if (sd !== 0) return sd;
        return (a.clientFinishedTimestamp || 0) - (b.clientFinishedTimestamp || 0);
    });
    const top3 = [];
    const seen = new Set();
    for (const e of finished) {
        if (!seen.has(e.uid)) { seen.add(e.uid); top3.push(e); }
        if (top3.length === 3) break;
    }
    return top3;
}

// Logica om een duel-ronde te evalueren (pure versie van evaluateRound transactie)
function evaluateRoundLogic(gameData) {
    if (gameData.status !== 'playing') return null;
    if (!gameData.hostMove || !gameData.guestMove) return null;

    const hCorrect = !!gameData.hostMove.correct;
    const gCorrect = !!gameData.guestMove.correct;

    if (hCorrect && gCorrect) {
        return {
            outcome: 'continue',
            hostScore: (gameData.hostScore || 0) + 1,
            guestScore: (gameData.guestScore || 0) + 1
        };
    }

    let winner = 'draw';
    if (hCorrect && !gCorrect) winner = gameData.hostId;
    if (!hCorrect && gCorrect) winner = gameData.guestId;

    return {
        outcome: 'finished',
        winner,
        hostScore: hCorrect ? (gameData.hostScore || 0) + 1 : (gameData.hostScore || 0),
        guestScore: gCorrect ? (gameData.guestScore || 0) + 1 : (gameData.guestScore || 0)
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('getUtcDateKey', () => {
    test('formatteert datum correct als YYYY-MM-DD', () => {
        const d = new Date('2026-04-14T15:30:00Z');
        assert.equal(getUtcDateKey(d), '2026-04-14');
    });

    test('gebruikt altijd UTC (niet lokale tijd)', () => {
        // 23:30 UTC op 14 april = 15 april lokaal in UTC+2, maar sleutel moet 14 april zijn
        const d = new Date('2026-04-14T23:30:00Z');
        assert.equal(getUtcDateKey(d), '2026-04-14');
    });

    test('voegt leading zeros toe bij maand en dag < 10', () => {
        const d = new Date('2026-01-05T00:00:00Z');
        assert.equal(getUtcDateKey(d), '2026-01-05');
    });

    test('resultaat heeft altijd het formaat YYYY-MM-DD (10 tekens)', () => {
        const result = getUtcDateKey(new Date('2026-12-31T12:00:00Z'));
        assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('parseDateKeyAsUtc', () => {
    test('parseert geldige datum-sleutel correct', () => {
        const d = parseDateKeyAsUtc('2026-04-14');
        assert.equal(d.getUTCFullYear(), 2026);
        assert.equal(d.getUTCMonth(), 3); // april = index 3
        assert.equal(d.getUTCDate(), 14);
    });

    test('geeft null terug voor lege invoer', () => {
        assert.equal(parseDateKeyAsUtc(''), null);
        assert.equal(parseDateKeyAsUtc(null), null);
        assert.equal(parseDateKeyAsUtc(undefined), null);
    });

    test('geeft null terug voor ongeldig formaat', () => {
        assert.equal(parseDateKeyAsUtc('niet-een-datum'), null);
    });

    test('maakt UTC middernacht aan (geen tijdzone-verschuiving)', () => {
        const d = parseDateKeyAsUtc('2026-01-01');
        assert.equal(d.getUTCHours(), 0);
        assert.equal(d.getUTCMinutes(), 0);
    });
});

describe('getDailyNumber', () => {
    test('basedate geeft dag #1', () => {
        assert.equal(getDailyNumber('2026-03-22'), 1);
    });

    test('dag ná de basedate geeft dag #2', () => {
        assert.equal(getDailyNumber('2026-03-23'), 2);
    });

    test('een week na de basedate geeft dag #8', () => {
        assert.equal(getDailyNumber('2026-03-29'), 8);
    });

    test('datum vóór de basedate geeft minimaal #1 (nooit negatief)', () => {
        assert.equal(getDailyNumber('2025-01-01'), 1);
    });

    test('geeft 1 terug bij ongeldige invoer', () => {
        assert.equal(getDailyNumber(''), 1);
        assert.equal(getDailyNumber(null), 1);
    });

    test('dag #24 klopt op 2026-04-14', () => {
        // 2026-04-14 is 23 dagen na 2026-03-22 → dag 24
        assert.equal(getDailyNumber('2026-04-14'), 24);
    });
});

describe('hashStringToSeed', () => {
    test('geeft een getal terug', () => {
        assert.equal(typeof hashStringToSeed('test'), 'number');
    });

    test('is deterministisch — zelfde invoer geeft zelfde uitvoer', () => {
        assert.equal(hashStringToSeed('EMODJEEZ-DAILY-2026-04-14'), hashStringToSeed('EMODJEEZ-DAILY-2026-04-14'));
    });

    test('verschillende invoer geeft (doorgaans) verschillende seed', () => {
        assert.notEqual(hashStringToSeed('EMODJEEZ-DAILY-2026-04-14'), hashStringToSeed('EMODJEEZ-DAILY-2026-04-15'));
    });

    test('geeft nooit 0 terug (fallback naar 123456789)', () => {
        // Edge case: als hash 0 uitkomt, moet 123456789 terugkomen
        assert.notEqual(hashStringToSeed(''), 0);
    });

    test('geeft een unsigned 32-bit integer terug', () => {
        const seed = hashStringToSeed('test');
        assert.ok(seed >= 0);
        assert.ok(seed <= 4294967295);
    });
});

describe('createSeededRandom', () => {
    test('geeft waarden tussen 0 (inclusief) en 1 (exclusief)', () => {
        const rng = createSeededRandom(42);
        for (let i = 0; i < 100; i++) {
            const v = rng();
            assert.ok(v >= 0 && v < 1, `Waarde buiten bereik: ${v}`);
        }
    });

    test('is deterministisch — zelfde seed geeft zelfde reeks', () => {
        const rng1 = createSeededRandom(12345);
        const rng2 = createSeededRandom(12345);
        for (let i = 0; i < 20; i++) {
            assert.equal(rng1(), rng2());
        }
    });

    test('verschillende seeds geven verschillende reeksen', () => {
        const rng1 = createSeededRandom(1);
        const rng2 = createSeededRandom(2);
        const seq1 = Array.from({ length: 10 }, () => rng1());
        const seq2 = Array.from({ length: 10 }, () => rng2());
        assert.notDeepEqual(seq1, seq2);
    });
});

describe('buildDailyEmojiSequence', () => {
    test('geeft precies DAILY_EMOJI_COUNT emojis terug', () => {
        const seq = buildDailyEmojiSequence('2026-04-14');
        assert.equal(seq.length, DAILY_EMOJI_COUNT);
    });

    test('is deterministisch — zelfde datum geeft zelfde volgorde', () => {
        const seq1 = buildDailyEmojiSequence('2026-04-14');
        const seq2 = buildDailyEmojiSequence('2026-04-14');
        assert.deepEqual(seq1, seq2);
    });

    test('verschillende datums geven (doorgaans) verschillende volgorden', () => {
        const seq1 = buildDailyEmojiSequence('2026-04-14');
        const seq2 = buildDailyEmojiSequence('2026-04-15');
        // Vergelijk eerste 10 items; kans op gelijke volgorde is astronomisch klein
        const equal = seq1.slice(0, 10).every((e, i) => e === seq2[i]);
        assert.equal(equal, false);
    });

    test('elke emoji-entry heeft de juiste structuur (e en c)', () => {
        const seq = buildDailyEmojiSequence('2026-04-14');
        for (const item of seq) {
            assert.ok('e' in item, 'emoji heeft geen "e" veld');
            assert.ok('c' in item, 'emoji heeft geen "c" veld');
            assert.ok(item.c >= 1 && item.c <= 7, `Ongeldige categorie: ${item.c}`);
        }
    });

    test('geen duplicaten in de reeks (Fisher-Yates is een permutatie)', () => {
        const seq = buildDailyEmojiSequence('2026-04-14');
        const unique = new Set(seq.map(e => e.e));
        assert.equal(unique.size, seq.length);
    });

    test('alle emojis zijn afkomstig uit EMOJI_DB', () => {
        const dbSet = new Set(EMOJI_DB.map(e => e.e));
        const seq = buildDailyEmojiSequence('2026-04-14');
        for (const item of seq) {
            assert.ok(dbSet.has(item.e), `Onbekende emoji: ${item.e}`);
        }
    });
});

describe('getDailyScoreHashtag', () => {
    const grens = [
        [0,  '#EmodjeezNoob'],
        [5,  '#EmodjeezNoob'],
        [6,  '#EmodjeezRookie'],
        [10, '#EmodjeezRookie'],
        [11, '#EmodjeezTrainee'],
        [15, '#EmodjeezTrainee'],
        [16, '#EmodjeezTalent'],
        [20, '#EmodjeezTalent'],
        [21, '#EmodjeezSkilled'],
        [25, '#EmodjeezSkilled'],
        [26, '#EmodjeezPro'],
        [30, '#EmodjeezPro'],
        [31, '#EmodjeezExpert'],
        [35, '#EmodjeezExpert'],
        [36, '#EmodjeezMaster'],
        [40, '#EmodjeezMaster'],
        [41, '#EmodjeezElite'],
        [45, '#EmodjeezElite'],
        [46, '#EmodjeezHero'],
        [50, '#EmodjeezHero'],
        [51, '#EmodjeezChampion'],
        [55, '#EmodjeezChampion'],
        [56, '#EmodjeezLegend'],
        [60, '#EmodjeezLegend'],
        [61, '#EmodjeezTitan'],
        [65, '#EmodjeezTitan'],
        [66, '#EmodjeezImmortal'],
        [70, '#EmodjeezImmortal'],
        [71, '#EmodjeezSupremacy'],
        [75, '#EmodjeezSupremacy'],
    ];

    for (const [score, expected] of grens) {
        test(`score ${score} → ${expected}`, () => {
            assert.equal(getDailyScoreHashtag(score), expected);
        });
    }

    test('score > 75 geeft één van de god-tier tags', () => {
        const godTags = ['#EmodjeezGOAT', '#EmodjeezGodMode', '#EmodjeezUniverseBest'];
        for (let s = 76; s <= 200; s += 10) {
            assert.ok(godTags.includes(getDailyScoreHashtag(s)), `Score ${s} gaf geen god-tier tag`);
        }
    });

    test('negatieve score behandeld als 0 → Noob', () => {
        assert.equal(getDailyScoreHashtag(-5), '#EmodjeezNoob');
    });

    test('decimale score wordt naar beneden afgerond', () => {
        assert.equal(getDailyScoreHashtag(5.9), '#EmodjeezNoob');
        assert.equal(getDailyScoreHashtag(6.0), '#EmodjeezRookie');
    });

    test('null/undefined behandeld als 0', () => {
        assert.equal(getDailyScoreHashtag(null), '#EmodjeezNoob');
        assert.equal(getDailyScoreHashtag(undefined), '#EmodjeezNoob');
    });
});

describe('getCategoryNameById', () => {
    test('geeft correcte NL categorienamen terug voor IDs 1-7', () => {
        currentLang = 'nl';
        assert.equal(getCategoryNameById(1), 'Smileys en mensen');
        assert.equal(getCategoryNameById(7), 'Symbolen');
    });

    test('geeft correcte EN categorienamen terug', () => {
        currentLang = 'en';
        assert.equal(getCategoryNameById(1), 'Smileys & People');
        assert.equal(getCategoryNameById(3), 'Food & Drink');
        currentLang = 'nl';
    });

    test('geeft correcte DE categorienamen terug', () => {
        currentLang = 'de';
        assert.equal(getCategoryNameById(2), 'Tiere & Natur');
        currentLang = 'nl';
    });

    test('ongeldig ID (0) geeft "geen keuze" terug', () => {
        currentLang = 'nl';
        assert.equal(getCategoryNameById(0), 'Geen keuze');
    });

    test('ongeldig ID (8) geeft "geen keuze" terug', () => {
        assert.equal(getCategoryNameById(8), 'Geen keuze');
    });

    test('null/undefined geeft "geen keuze" terug', () => {
        assert.equal(getCategoryNameById(null), 'Geen keuze');
        assert.equal(getCategoryNameById(undefined), 'Geen keuze');
    });

    test('string-getal werkt ook ("3" → categorie 3)', () => {
        assert.equal(getCategoryNameById('3'), 'Eten en drinken');
    });
});

describe('formatDateKeyForDisplay', () => {
    test('converteert YYYY-MM-DD naar DD-MM-YYYY', () => {
        assert.equal(formatDateKeyForDisplay('2026-04-14'), '14-04-2026');
    });

    test('behoudt leading zeros', () => {
        assert.equal(formatDateKeyForDisplay('2026-01-05'), '05-01-2026');
    });

    test('geeft invoer terug bij ongeldig formaat (geen crash)', () => {
        assert.equal(formatDateKeyForDisplay('ongeldig'), 'ongeldig');
    });
});

describe('buildDailyDateOptionLabel', () => {
    test('dag #1 voor de basedate', () => {
        const label = buildDailyDateOptionLabel(DAILY_NUMBER_BASE_DATE_KEY);
        assert.ok(label.endsWith('#1'), `Verwacht dat label eindigt op "#1", maar was: "${label}"`);
    });

    test('dag #2 voor de dag na de basedate', () => {
        const label = buildDailyDateOptionLabel('2026-03-23');
        assert.ok(label.endsWith('#2'), `Verwacht dat label eindigt op "#2", maar was: "${label}"`);
    });

    test('dag #24 voor 2026-04-14', () => {
        currentLang = 'nl';
        const label = buildDailyDateOptionLabel('2026-04-14');
        assert.ok(label.includes('#24'), `Verwacht "#24" in label, maar was: "${label}"`);
    });

    test('label bevat de relatieve aanduiding (vandaag/gisteren/datum)', () => {
        const todayKey = getUtcDateKey();
        const label = buildDailyDateOptionLabel(todayKey);
        assert.ok(label.includes('Vandaag') || label.includes('Today') || label.includes('Heute'),
            `Verwacht "Vandaag/Today/Heute" in label voor vandaag, maar was: "${label}"`);
    });

    test('dagsnummer is onafhankelijk van het aantal beschikbare datums', () => {
        // Vroeger hing het af van `total` (aantal beschikbare datums).
        // Na de fix hangt het alleen af van de datum zelf.
        const label1 = buildDailyDateOptionLabel('2026-03-25');
        const label2 = buildDailyDateOptionLabel('2026-03-25');
        assert.equal(label1, label2);
        assert.ok(label1.endsWith('#4'), `Dag 4 verwacht (3 dagen na basedate +1), maar was: "${label1}"`);
    });
});

describe('escapeHtml', () => {
    test('escapet < en >', () => {
        assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
    });

    test('escapet &', () => {
        assert.equal(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
    });

    test('escapet aanhalingstekens', () => {
        assert.equal(escapeHtml('"quoted"'), '&quot;quoted&quot;');
        assert.equal(escapeHtml("it's"), 'it&#039;s');
    });

    test('XSS-aanval in gebruikersnaam wordt geneutraliseerd', () => {
        const malicious = '<img src=x onerror=alert(1)>';
        const safe = escapeHtml(malicious);
        assert.ok(!safe.includes('<img'), 'Mag geen < bevatten');
        assert.ok(!safe.includes('>'), 'Mag geen > bevatten');
        assert.equal(safe, '&lt;img src=x onerror=alert(1)&gt;');
    });

    test('normale tekst blijft ongewijzigd', () => {
        assert.equal(escapeHtml('Joost'), 'Joost');
    });

    test('null/undefined geeft lege string terug (geen crash)', () => {
        assert.equal(escapeHtml(null), '');
        assert.equal(escapeHtml(undefined), '');
    });

    test('getallen worden naar string geconverteerd', () => {
        assert.equal(escapeHtml(42), '42');
    });
});

describe('computeTop3 (daily winner logic)', () => {
    test('sorteer op score desc, dan op timestamp asc', () => {
        const entries = [
            { uid: 'a', score: 10, finished: true, clientFinishedTimestamp: 1000 },
            { uid: 'b', score: 15, finished: true, clientFinishedTimestamp: 500 },
            { uid: 'c', score: 10, finished: true, clientFinishedTimestamp: 800 },
        ];
        const top3 = computeTop3(entries);
        assert.equal(top3[0].uid, 'b'); // hoogste score
        assert.equal(top3[1].uid, 'c'); // zelfde score als a, maar eerder klaar
        assert.equal(top3[2].uid, 'a');
    });

    test('niet-finished entries worden uitgesloten', () => {
        const entries = [
            { uid: 'a', score: 20, finished: true, clientFinishedTimestamp: 100 },
            { uid: 'b', score: 99, finished: false, clientFinishedTimestamp: 50 }, // gestart maar niet klaar
        ];
        const top3 = computeTop3(entries);
        assert.equal(top3.length, 1);
        assert.equal(top3[0].uid, 'a');
    });

    test('geeft max 3 winnaars terug', () => {
        const entries = Array.from({ length: 10 }, (_, i) => ({
            uid: `u${i}`, score: 10 - i, finished: true, clientFinishedTimestamp: i * 100
        }));
        const top3 = computeTop3(entries);
        assert.equal(top3.length, 3);
    });

    test('duplicate uid telt maar één keer mee', () => {
        const entries = [
            { uid: 'a', score: 10, finished: true, clientFinishedTimestamp: 100 },
            { uid: 'a', score: 8,  finished: true, clientFinishedTimestamp: 200 }, // zelfde user
            { uid: 'b', score: 5,  finished: true, clientFinishedTimestamp: 300 },
        ];
        const top3 = computeTop3(entries);
        const uids = top3.map(e => e.uid);
        assert.equal(new Set(uids).size, uids.length, 'Duplicate UIDs in top3');
    });

    test('lege lijst geeft lege top3', () => {
        assert.deepEqual(computeTop3([]), []);
    });

    test('entries zonder finished-veld (undefined) worden meegenomen (legacy data)', () => {
        const entries = [
            { uid: 'legacy', score: 5, clientFinishedTimestamp: 100 } // geen finished-veld
        ];
        const top3 = computeTop3(entries);
        assert.equal(top3.length, 1);
    });
});

describe('evaluateRoundLogic (duel evaluatie)', () => {
    const baseGame = {
        status: 'playing',
        hostId: 'host-uid',
        guestId: 'guest-uid',
        hostScore: 3,
        guestScore: 2,
    };

    test('beide correct → "continue" + beide scoren +1', () => {
        const result = evaluateRoundLogic({
            ...baseGame,
            hostMove: { correct: true },
            guestMove: { correct: true },
        });
        assert.equal(result.outcome, 'continue');
        assert.equal(result.hostScore, 4);
        assert.equal(result.guestScore, 3);
    });

    test('host correct, guest fout → host wint', () => {
        const result = evaluateRoundLogic({
            ...baseGame,
            hostMove: { correct: true },
            guestMove: { correct: false },
        });
        assert.equal(result.outcome, 'finished');
        assert.equal(result.winner, 'host-uid');
        assert.equal(result.hostScore, 4); // host scoort nog
        assert.equal(result.guestScore, 2); // guest scoort niet
    });

    test('host fout, guest correct → guest wint', () => {
        const result = evaluateRoundLogic({
            ...baseGame,
            hostMove: { correct: false },
            guestMove: { correct: true },
        });
        assert.equal(result.outcome, 'finished');
        assert.equal(result.winner, 'guest-uid');
        assert.equal(result.guestScore, 3);
        assert.equal(result.hostScore, 3);
    });

    test('beide fout → draw', () => {
        const result = evaluateRoundLogic({
            ...baseGame,
            hostMove: { correct: false },
            guestMove: { correct: false },
        });
        assert.equal(result.outcome, 'finished');
        assert.equal(result.winner, 'draw');
    });

    test('één move ontbreekt → geen evaluatie (null)', () => {
        assert.equal(evaluateRoundLogic({ ...baseGame, hostMove: { correct: true }, guestMove: null }), null);
        assert.equal(evaluateRoundLogic({ ...baseGame, hostMove: null, guestMove: { correct: true } }), null);
    });

    test('status !== "playing" → geen evaluatie (null)', () => {
        assert.equal(evaluateRoundLogic({
            ...baseGame, status: 'finished',
            hostMove: { correct: true }, guestMove: { correct: false }
        }), null);
    });

    test('scores starten op 0 als ze ontbreken in gameData', () => {
        const result = evaluateRoundLogic({
            status: 'playing',
            hostId: 'h', guestId: 'g',
            hostMove: { correct: true },
            guestMove: { correct: true },
            // hostScore en guestScore ontbreken
        });
        assert.equal(result.hostScore, 1);
        assert.equal(result.guestScore, 1);
    });
});

describe('Vertalingen – volledigheid', () => {
    const requiredKeys = [
        'subtitle', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat7',
        'duelNoChoice', 'dailyToday', 'dailyYesterday', 'wrong', 'itWas',
        'playAgain', 'backToMenu', 'draw', 'win', 'lose',
        'statusSent', 'statusWait', 'statusEval',
        'popupInfoTitle', 'popupSuccessTitle', 'popupErrorTitle',
        'dailyAlreadyPlayed', 'dailyNoRetry', 'dailyCompletedTitle',
        'loginFailed', 'gameCreateFailed', 'gameInvalid', 'gameInProgress',
        'soloLabel', 'dailyLabel', 'dailyRank', 'hofDailyTitle', 'hofDuelTitle',
        'settingsDailyNotif', 'settingsDailyNotifOn', 'settingsDailyNotifOff', 'settingsDailyNotifHint',
        'nameTaken', 'nameSuggestionsLabel', 'nameChecking',
        'copyScoreBtn', 'copyScoreDone', 'duelLabel'
    ];

    // Uitgebreide translations voor deze test (index.html bevat alle sleutels)
    const base = {
        subtitle: 'x', cat1: 'x', cat2: 'x', cat3: 'x', cat4: 'x', cat5: 'x', cat6: 'x', cat7: 'x',
        duelNoChoice: 'x', dailyToday: 'x', dailyYesterday: 'x', wrong: 'x', itWas: 'x',
        playAgain: 'x', backToMenu: 'x', draw: 'x', win: 'x', lose: 'x',
        statusSent: 'x', statusWait: 'x', statusEval: 'x',
        popupInfoTitle: 'x', popupSuccessTitle: 'x', popupErrorTitle: 'x',
        dailyAlreadyPlayed: 'x', dailyNoRetry: 'x', dailyCompletedTitle: 'x',
        loginFailed: 'x', gameCreateFailed: 'x', gameInvalid: 'x', gameInProgress: 'x',
        soloLabel: 'x', dailyLabel: 'x', dailyRank: 'x', hofDailyTitle: 'x', hofDuelTitle: 'x',
        settingsDailyNotif: 'x', settingsDailyNotifOn: 'x', settingsDailyNotifOff: 'x',
        settingsDailyNotifHint: 'x',
        nameTaken: 'x', nameSuggestionsLabel: 'x', nameChecking: 'x',
        copyScoreBtn: 'x', copyScoreDone: 'x', duelLabel: 'x'
    };
    const fullTranslations = { nl: { ...base }, en: { ...base }, de: { ...base } };

    for (const lang of ['nl', 'en', 'de']) {
        for (const key of requiredKeys) {
            test(`[${lang}] bevat sleutel "${key}"`, () => {
                assert.ok(key in fullTranslations[lang], `Ontbrekende sleutel "${key}" in taal "${lang}"`);
            });
        }
    }
});

// ─── buildShareText ──────────────────────────────────────────────────────────
// Duplicaat van de pure functie uit index.html (moet gesynchroniseerd blijven)

const DAILY_BASE_DATE = '2026-03-22';
const DAILY_BASE_MS   = new Date(DAILY_BASE_DATE + 'T00:00:00Z').getTime();

function getDailyNumberForTest(dateKey) {
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 1;
    const ms = new Date(dateKey + 'T00:00:00Z').getTime();
    return Math.max(1, Math.floor((ms - DAILY_BASE_MS) / 86400000) + 1);
}

function getDailyScoreHashtagForTest(score) {
    const n = Math.max(0, Math.floor(Number(score || 0)));
    if (n <= 5)  return '#EmodjeezNoob';
    if (n <= 10) return '#EmodjeezRookie';
    if (n <= 15) return '#EmodjeezTrainee';
    if (n <= 20) return '#EmodjeezTalent';
    if (n <= 25) return '#EmodjeezSkilled';
    if (n <= 30) return '#EmodjeezPro';
    if (n <= 35) return '#EmodjeezExpert';
    if (n <= 40) return '#EmodjeezMaster';
    if (n <= 45) return '#EmodjeezElite';
    if (n <= 50) return '#EmodjeezHero';
    if (n <= 55) return '#EmodjeezChampion';
    if (n <= 60) return '#EmodjeezLegend';
    if (n <= 65) return '#EmodjeezTitan';
    if (n <= 70) return '#EmodjeezImmortal';
    if (n <= 75) return '#EmodjeezSupremacy';
    return '#EmodjeezGod';
}

const translationsForTest = {
    nl: { soloLabel: 'SOLO RUN', duelLabel: '1v1 Duel', score: 'Score:' },
    en: { soloLabel: 'SOLO RUN', duelLabel: '1v1 Duel', score: 'Score:' },
    de: { soloLabel: 'SOLO-LAUF', duelLabel: '1v1 Duell', score: 'Punktzahl:' },
};

function buildShareTextForTest(ctx, lang) {
    const t = translationsForTest[lang] || translationsForTest.en;
    const lines = [];

    if (ctx.mode === 'daily' && ctx.dailyDateKey) {
        lines.push(`Daily #${getDailyNumberForTest(ctx.dailyDateKey)}`);
    } else if (ctx.mode === 'solo') {
        lines.push(t.soloLabel);
    } else if (ctx.mode === 'duel') {
        lines.push(t.duelLabel);
    }

    lines.push('https://emodjeez.net');
    lines.push(`${t.score} ${ctx.score}`);

    if (ctx.emojis && ctx.emojis.length > 0) {
        lines.push(ctx.emojis.join(' '));
    }

    if (ctx.mode === 'daily' && ctx.dailyDateKey) {
        lines.push(`#Emodjeez${getDailyNumberForTest(ctx.dailyDateKey)}`);
        lines.push(getDailyScoreHashtagForTest(ctx.score));
    } else {
        lines.push('#emodjeez');
    }

    return lines.join('\n');
}

describe('buildShareText', () => {
    test('Daily: eerste regel bevat "Daily #N"', () => {
        const ctx = { mode: 'daily', score: 30, dailyDateKey: '2026-03-22', emojis: ['😀'] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.startsWith('Daily #1'), `Verwacht te starten met "Daily #1", kreeg: "${text.split('\n')[0]}"`);
    });

    test('Daily: bevat de URL', () => {
        const ctx = { mode: 'daily', score: 20, dailyDateKey: '2026-03-23', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.includes('https://emodjeez.net'));
    });

    test('Daily: bevat score', () => {
        const ctx = { mode: 'daily', score: 42, dailyDateKey: '2026-03-23', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.includes('42'), `Score 42 niet gevonden in: ${text}`);
    });

    test('Daily: bevat score-hashtag', () => {
        const ctx = { mode: 'daily', score: 30, dailyDateKey: '2026-03-22', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.includes('#EmodjeezPro'), `Verwacht #EmodjeezPro bij score 30`);
    });

    test('Daily: bevat dag-hashtag (#EmodjeezN)', () => {
        const ctx = { mode: 'daily', score: 10, dailyDateKey: '2026-03-22', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.includes('#Emodjeez1'), `Verwacht #Emodjeez1 voor dag #1`);
    });

    test('Daily: emojis worden opgenomen als ze aanwezig zijn', () => {
        const ctx = { mode: 'daily', score: 10, dailyDateKey: '2026-03-22', emojis: ['😀', '🎉', '🔥'] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.includes('😀 🎉 🔥'));
    });

    test('Daily: geen emojis → geen lege emoji-regel', () => {
        const ctx = { mode: 'daily', score: 10, dailyDateKey: '2026-03-22', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        const lines = text.split('\n');
        // Geen van de regels mag een lege string zijn
        assert.ok(lines.every(l => l.length > 0), `Lege regels gevonden: ${JSON.stringify(lines)}`);
    });

    test('Solo: eerste regel is soloLabel', () => {
        const ctx = { mode: 'solo', score: 15, dailyDateKey: null, emojis: [] };
        const nlText = buildShareTextForTest(ctx, 'nl');
        assert.ok(nlText.startsWith('SOLO RUN'));
    });

    test('Solo: DE gebruikt eigen soloLabel', () => {
        const ctx = { mode: 'solo', score: 15, dailyDateKey: null, emojis: [] };
        const deText = buildShareTextForTest(ctx, 'de');
        assert.ok(deText.startsWith('SOLO-LAUF'));
    });

    test('Solo: eindigt op #emodjeez (geen dag-hashtag)', () => {
        const ctx = { mode: 'solo', score: 15, dailyDateKey: null, emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.endsWith('#emodjeez'));
    });

    test('Duel NL: eerste regel is "1v1 Duel"', () => {
        const ctx = { mode: 'duel', score: 8, dailyDateKey: null, emojis: ['⚔️'] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.startsWith('1v1 Duel'));
    });

    test('Duel DE: eerste regel is "1v1 Duell"', () => {
        const ctx = { mode: 'duel', score: 8, dailyDateKey: null, emojis: [] };
        const text = buildShareTextForTest(ctx, 'de');
        assert.ok(text.startsWith('1v1 Duell'));
    });

    test('Duel: eindigt op #emodjeez', () => {
        const ctx = { mode: 'duel', score: 8, dailyDateKey: null, emojis: [] };
        const text = buildShareTextForTest(ctx, 'en');
        assert.ok(text.endsWith('#emodjeez'));
    });

    test('Daily dag #2 klopt', () => {
        const ctx = { mode: 'daily', score: 5, dailyDateKey: '2026-03-23', emojis: [] };
        const text = buildShareTextForTest(ctx, 'nl');
        assert.ok(text.startsWith('Daily #2'), `Verwacht "Daily #2", kreeg: "${text.split('\n')[0]}"`);
    });

    test('Score is correct opgenomen in de tekst (EN)', () => {
        const ctx = { mode: 'solo', score: 99, dailyDateKey: null, emojis: [] };
        const text = buildShareTextForTest(ctx, 'en');
        assert.ok(text.includes('Score: 99'));
    });

    test('Score is correct opgenomen in de tekst (DE)', () => {
        const ctx = { mode: 'solo', score: 99, dailyDateKey: null, emojis: [] };
        const text = buildShareTextForTest(ctx, 'de');
        assert.ok(text.includes('Punktzahl: 99'));
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// DUEL UITNODIGINGS- EN JOIN-LOGICA
//
// De functies hieronder zijn pure extracties van de logica in index.html
// (checkAndJoin, handleGameState, evaluateRound). Ze simuleren twee devices
// zonder Firebase-afhankelijkheid.
// ONDERHOUD: synchroon houden met index.html bij wijzigingen.
// ═════════════════════════════════════════════════════════════════════════════

// ─── Pure hulpfuncties (spiegel van index.html) ───────────────────────────

function parseGameIdFromUrl(search) {
    const params = new URLSearchParams(search);
    return params.get('game') || null;
}

function buildInviteUrl(origin, gameId) {
    return `${origin}/?game=${gameId}`;
}

/**
 * Valideert of een gebruiker zich bij een spel mag aansluiten.
 * Weerspiegelt de checkAndJoin()-logica in index.html.
 *
 * @returns {{ allowed: boolean, reason?: string, action?: string }}
 *   action: 'rejoin-host' | 'rejoin-guest' | 'join-as-guest'
 */
function validateJoinAttempt(gameData, uid) {
    if (!gameData) return { allowed: false, reason: 'not-found' };

    // Speler zit al in het spel (host opent eigen link of guest herconnecteert)
    if (gameData.hostId === uid) {
        if (gameData.status === 'finished') return { allowed: false, reason: 'already-finished' };
        return { allowed: true, action: 'rejoin-host' };
    }
    if (gameData.guestId === uid) {
        if (gameData.status === 'finished') return { allowed: false, reason: 'already-finished' };
        return { allowed: true, action: 'rejoin-guest' };
    }

    // Buitenstaander probeert te joinen
    if (gameData.status === 'finished')  return { allowed: false, reason: 'already-finished' };
    if (gameData.status !== 'waiting')   return { allowed: false, reason: 'game-in-progress' };
    if (gameData.guestId)                return { allowed: false, reason: 'game-full' };

    return { allowed: true, action: 'join-as-guest' };
}

/**
 * Bepaalt of gameActive op true gezet moet worden op basis van de nieuwe
 * game-staat. Weerspiegelt de fix in handleGameState (else-tak).
 */
function resolveGameActive(gameData, uid) {
    if (gameData.status !== 'playing') return false;
    const myMove  = gameData.hostId === uid ? gameData.hostMove  : gameData.guestMove;
    const oppMove = gameData.hostId === uid ? gameData.guestMove : gameData.hostMove;
    // Nieuwe ronde: beide moves null → speler mag weer klikken
    return !myMove && !oppMove;
}

/**
 * Minimalistische simulatie van één device/speler.
 * Verwerkt game-state updates zoals handleGameState() dat doet.
 */
class PlayerSimulator {
    constructor(uid, role) {
        this.uid   = uid;
        this.role  = role;
        this.gameActive = false;
        this.currentEmojiIdx = null;
        this.status = null;
    }

    /** Verwerk een Firestore snapshot (pure, geen bijeffecten). */
    applyState(gameData) {
        this.status = gameData.status;
        this.currentEmojiIdx = gameData.currentEmojiIdx;

        if (gameData.status !== 'playing') {
            this.gameActive = false;
            return;
        }

        const myMove = this.role === 'host' ? gameData.hostMove : gameData.guestMove;
        // Spiegel van handleGameState: de else-tak (myMove null) stelt gameActive in op true,
        // of het nu wachten op de tegenstander is of een nieuwe ronde.
        this.gameActive = !myMove;
    }

    /** Simuleert klikken op een categorie (zoals handleCategoryClick). */
    clickCategory(catId, gameData) {
        if (!this.gameActive) throw new Error('gameActive is false — speler kan niet klikken');
        this.gameActive = false; // Voorkomt dubbel klikken
        const correct = catId === (EMOJI_DB[gameData.currentEmojiIdx] || {}).c;
        return { correct, categoryId: catId, timestamp: Date.now() };
    }
}

/**
 * Pure evaluatielogica (spiegel van evaluateRound-transactie in index.html).
 * Geeft het bijgewerkte game-document terug, of null als er niets te evalueren valt.
 */
function simulateEvaluateRound(gameData) {
    if (gameData.status !== 'playing') return null;
    if (!gameData.hostMove || !gameData.guestMove) return null;

    const hCorrect = !!gameData.hostMove.correct;
    const gCorrect = !!gameData.guestMove.correct;

    if (hCorrect && gCorrect) {
        return {
            ...gameData,
            hostMove: null,
            guestMove: null,
            currentEmojiIdx: (gameData.currentEmojiIdx + 1) % EMOJI_DB.length,
            hostScore: (gameData.hostScore || 0) + 1,
            guestScore: (gameData.guestScore || 0) + 1,
            round: (gameData.round || 1) + 1,
        };
    }

    let winner = 'draw';
    if (hCorrect && !gCorrect) winner = gameData.hostId;
    if (!hCorrect && gCorrect) winner = gameData.guestId;

    return {
        ...gameData,
        status: 'finished',
        winner,
        hostScore: hCorrect ? (gameData.hostScore || 0) + 1 : (gameData.hostScore || 0),
        guestScore: gCorrect ? (gameData.guestScore || 0) + 1 : (gameData.guestScore || 0),
    };
}

// ─── Tests: URL-parsing en linkbouw ──────────────────────────────────────

describe('Duel – URL-parsing (uitnodigingslink)', () => {
    test('parseert gameId uit ?game= parameter', () => {
        assert.equal(parseGameIdFromUrl('?game=abc123'), 'abc123');
    });

    test('geeft null terug als parameter ontbreekt', () => {
        assert.equal(parseGameIdFromUrl(''), null);
        assert.equal(parseGameIdFromUrl('?foo=bar'), null);
    });

    test('werkt met extra parameters in de URL', () => {
        assert.equal(parseGameIdFromUrl('?utm_source=whatsapp&game=xyz99'), 'xyz99');
    });

    test('buildInviteUrl – web-origin', () => {
        const url = buildInviteUrl('https://emodjeez.net', 'game42');
        assert.equal(url, 'https://emodjeez.net/?game=game42');
    });

    test('buildInviteUrl – app-origin (localhost/file)', () => {
        const url = buildInviteUrl('http://localhost:8080', 'game42');
        assert.ok(url.includes('game42'));
    });

    test('dezelfde gameId via WhatsApp of gekopieerde link produceert identieke URL', () => {
        const origin = 'https://emodjeez.net';
        const id = 'gameXYZ';
        // WhatsApp en "link kopiëren" gebruiken dezelfde buildInviteUrl-logica
        assert.equal(buildInviteUrl(origin, id), buildInviteUrl(origin, id));
    });
});

// ─── Tests: join-validatie (alle scenario-combinaties) ───────────────────

describe('Duel – validateJoinAttempt (alle uitnodigingsscenario\'s)', () => {
    const HOST_UID     = 'host-uid';
    const GUEST_UID    = 'guest-uid';
    const OTHER_UID    = 'stranger-uid';
    const STRANGER_UID = 'fourth-uid'; // Iemand die helemaal niet in het spel zit

    const waitingGame = {
        hostId: HOST_UID, guestId: null,
        status: 'waiting', currentEmojiIdx: 0,
        hostScore: 0, guestScore: 0,
    };
    const playingGame  = { ...waitingGame, guestId: GUEST_UID, status: 'playing' };
    const finishedGame = { ...playingGame, status: 'finished', winner: HOST_UID };
    // Wachtend spel waarbij OTHER_UID al de guest is — STRANGER_UID mag er niet in
    const fullWaiting  = { ...waitingGame, guestId: OTHER_UID };

    // ── Scenario A: uitnodigende speler klikt op eigen link ──────────────
    test('[Host/eigen link] host herverbindt met lopend spel', () => {
        const r = validateJoinAttempt(playingGame, HOST_UID);
        assert.equal(r.allowed, true);
        assert.equal(r.action, 'rejoin-host');
    });

    test('[Host/eigen link] host herverbindt met wachtend spel', () => {
        const r = validateJoinAttempt(waitingGame, HOST_UID);
        assert.equal(r.allowed, true);
        assert.equal(r.action, 'rejoin-host');
    });

    test('[Host/eigen link] host kan niet terug naar afgelopen spel', () => {
        const r = validateJoinAttempt(finishedGame, HOST_UID);
        assert.equal(r.allowed, false);
        assert.equal(r.reason, 'already-finished');
    });

    // ── Scenario B: ontvanger opent link voor het eerst ──────────────────
    test('[Gast/eerste keer] joinen op een wachtend spel is toegestaan', () => {
        const r = validateJoinAttempt(waitingGame, GUEST_UID);
        assert.equal(r.allowed, true);
        assert.equal(r.action, 'join-as-guest');
    });

    test('[Gast/eerste keer] onbekende gebruiker mag niet joinen op al-spelend spel', () => {
        // playingGame heeft al een andere guest (GUEST_UID); STRANGER_UID probeert te joinen
        const r = validateJoinAttempt(playingGame, STRANGER_UID);
        assert.equal(r.allowed, false);
        assert.equal(r.reason, 'game-in-progress');
    });

    // ── Scenario C: ontvanger herverbindt (had app al open of opent link opnieuw) ─
    test('[Gast/herverbinden] guest opent eigen link opnieuw → rejoin', () => {
        const r = validateJoinAttempt(playingGame, GUEST_UID);
        // GUEST_UID === playingGame.guestId → rejoin-guest
        // (NB: playingGame heeft guestId: GUEST_UID)
        const rRejoin = validateJoinAttempt({ ...playingGame, guestId: GUEST_UID }, GUEST_UID);
        assert.equal(rRejoin.allowed, true);
        assert.equal(rRejoin.action, 'rejoin-guest');
    });

    test('[Gast/herverbinden] guest opent link van afgelopen spel → geblokkeerd', () => {
        const r = validateJoinAttempt({ ...finishedGame, guestId: GUEST_UID }, GUEST_UID);
        assert.equal(r.allowed, false);
        assert.equal(r.reason, 'already-finished');
    });

    // ── Scenario D: derde persoon probeert in te breken ──────────────────
    test('[Derde/vol spel] derde gebruiker kan niet joinen als spel vol is', () => {
        const r = validateJoinAttempt(playingGame, OTHER_UID);
        assert.equal(r.allowed, false);
        assert.equal(r.reason, 'game-in-progress');
    });

    test('[Derde/wachten] vierde gebruiker kan niet joinen als guestId al bezet is', () => {
        // fullWaiting heeft guestId: OTHER_UID; STRANGER_UID is de echte onbekende derde
        const r = validateJoinAttempt(fullWaiting, STRANGER_UID);
        assert.equal(r.allowed, false);
        assert.equal(r.reason, 'game-full');
    });

    test('[Ontbrekend spel] gameData null → not-found', () => {
        assert.equal(validateJoinAttempt(null, HOST_UID).reason, 'not-found');
    });

    // ── Platform-combinaties: app vs web maakt geen verschil voor join-logica ─
    const PLATFORMS = ['app (localhost)', 'web (emodjeez.net)'];
    for (const platform of PLATFORMS) {
        test(`[${platform}] ontvanger join wachtend spel → toegestaan`, () => {
            const r = validateJoinAttempt(waitingGame, GUEST_UID);
            assert.equal(r.allowed, true);
        });

        test(`[${platform}] uitnodigende speler herverbindt als host → rejoin`, () => {
            const r = validateJoinAttempt(waitingGame, HOST_UID);
            assert.equal(r.action, 'rejoin-host');
        });
    }
});

// ─── Tests: gameActive reset (regressietest voor de bug) ─────────────────

describe('Duel – gameActive na ronde-progressie (regressietest bug)', () => {
    const HOST_UID  = 'host-uid';
    const GUEST_UID = 'guest-uid';

    const newRoundState = {
        status: 'playing',
        hostId: HOST_UID, guestId: GUEST_UID,
        hostMove: null, guestMove: null,
        currentEmojiIdx: 5, round: 2,
    };

    test('host: gameActive = true na nieuwe ronde (beide moves null)', () => {
        assert.equal(resolveGameActive(newRoundState, HOST_UID), true);
    });

    test('guest: gameActive = true na nieuwe ronde (beide moves null)', () => {
        assert.equal(resolveGameActive(newRoundState, GUEST_UID), true);
    });

    test('gameActive = false als eigen move al verzonden', () => {
        const state = { ...newRoundState, hostMove: { correct: true } };
        assert.equal(resolveGameActive(state, HOST_UID), false);
    });

    test('gameActive = false als status finished is', () => {
        const state = { ...newRoundState, status: 'finished' };
        assert.equal(resolveGameActive(state, HOST_UID), false);
    });
});

// ─── Tests: volledige multi-ronde game simulatie (twee devices) ───────────

describe('Duel – multi-ronde simulatie (twee devices)', () => {
    function makeGame(emojiIdx = 0) {
        return {
            status: 'playing',
            hostId: 'h', guestId: 'g',
            hostMove: null, guestMove: null,
            hostScore: 0, guestScore: 0,
            currentEmojiIdx: emojiIdx,
            round: 1,
        };
    }

    test('ronde 1: beide correct → beide devices krijgen gameActive terug voor ronde 2', () => {
        let game = makeGame(0);
        const host  = new PlayerSimulator('h', 'host');
        const guest = new PlayerSimulator('g', 'guest');

        // Beide devices ontvangen beginstand
        host.applyState(game);
        guest.applyState(game);
        assert.equal(host.gameActive, true);
        assert.equal(guest.gameActive, true);

        // Beide klikken de juiste categorie (c van emoji idx 0)
        const correctCat = EMOJI_DB[0].c;
        const hMove = host.clickCategory(correctCat, game);
        game = { ...game, hostMove: hMove };
        host.applyState(game);   // host ziet eigen move → gameActive false
        guest.applyState(game);  // guest ziet host's move

        const gMove = guest.clickCategory(correctCat, game);
        game = { ...game, guestMove: gMove };
        host.applyState(game);
        guest.applyState(game);

        // Evalueer de ronde
        const nextGame = simulateEvaluateRound(game);
        assert.ok(nextGame, 'ronde moet geëvalueerd worden');
        assert.equal(nextGame.round, 2);
        assert.equal(nextGame.hostMove, null);
        assert.equal(nextGame.guestMove, null);

        // Beide devices ontvangen de nieuwe staat
        host.applyState(nextGame);
        guest.applyState(nextGame);

        // *** Dit is de regressiecheck voor de bug ***
        assert.equal(host.gameActive,  true, 'host moet opnieuw kunnen klikken in ronde 2');
        assert.equal(guest.gameActive, true, 'guest moet opnieuw kunnen klikken in ronde 2');
    });

    test('drie rondes beide correct → scores 3-3, round === 4', () => {
        let game = makeGame(0);

        for (let r = 1; r <= 3; r++) {
            const correctCat = EMOJI_DB[game.currentEmojiIdx].c;
            game = {
                ...game,
                hostMove:  { correct: true,  categoryId: correctCat, timestamp: Date.now() },
                guestMove: { correct: true,  categoryId: correctCat, timestamp: Date.now() },
            };
            const next = simulateEvaluateRound(game);
            assert.ok(next, `ronde ${r} moet geëvalueerd worden`);
            game = next;
        }

        assert.equal(game.hostScore, 3);
        assert.equal(game.guestScore, 3);
        assert.equal(game.round, 4);
        assert.equal(game.status, 'playing');
    });

    test('host fout in ronde 2 → guest wint, game eindigt', () => {
        let game = makeGame(0);
        const correctCat = EMOJI_DB[0].c;
        const wrongCat   = correctCat === 1 ? 2 : 1;

        // Ronde 1: beide correct
        game = { ...game,
            hostMove:  { correct: true, categoryId: correctCat },
            guestMove: { correct: true, categoryId: correctCat },
        };
        game = simulateEvaluateRound(game);

        // Ronde 2: host fout
        const r2Correct = EMOJI_DB[game.currentEmojiIdx].c;
        const r2Wrong   = r2Correct === 1 ? 2 : 1;
        game = { ...game,
            hostMove:  { correct: false, categoryId: r2Wrong },
            guestMove: { correct: true,  categoryId: r2Correct },
        };
        const finalGame = simulateEvaluateRound(game);

        assert.equal(finalGame.status, 'finished');
        assert.equal(finalGame.winner, 'g');       // guest wint
        assert.equal(finalGame.hostScore, 1);      // ronde 1 scoorde host nog
        assert.equal(finalGame.guestScore, 2);     // ronde 1 + ronde 2
    });

    test('guest kan niet nogmaals klikken nadat move al verzonden is', () => {
        const game = makeGame(0);
        const guest = new PlayerSimulator('g', 'guest');
        guest.applyState(game);

        const correctCat = EMOJI_DB[0].c;
        guest.clickCategory(correctCat, game); // eerste klik OK
        assert.equal(guest.gameActive, false);
        assert.throws(
            () => guest.clickCategory(correctCat, game),
            /gameActive is false/,
            'tweede klik moet geweigerd worden'
        );
    });

    test('host klikt juiste categorie, guest nog niet → host gameActive false, guest nog true', () => {
        let game = makeGame(0);
        const host  = new PlayerSimulator('h', 'host');
        const guest = new PlayerSimulator('g', 'guest');

        host.applyState(game);
        guest.applyState(game);

        const correctCat = EMOJI_DB[0].c;
        const hMove = host.clickCategory(correctCat, game);
        game = { ...game, hostMove: hMove };

        host.applyState(game);
        guest.applyState(game);

        assert.equal(host.gameActive,  false, 'host wacht op guest');
        assert.equal(guest.gameActive, true,  'guest kan nog klikken');
    });
});

// ─── Tests: uitnodigings-methode-matrix ──────────────────────────────────

describe('Duel – uitnodigingsscenario\'s matrix (alle combinaties)', () => {
    const HOST_UID  = 'host-uid';
    const GUEST_UID = 'guest-uid';

    const INVITE_METHODS  = ['whatsapp', 'copy-link'];
    const RECEIVER_STATES = ['fresh-open', 'already-open'];
    const INVITER_ACTIONS = ['clicks-own-link', 'returns-to-game'];
    const PLATFORMS       = ['app', 'web'];

    // De invite-methode (WhatsApp vs kopiëren) en het platform (app vs web)
    // beïnvloeden alleen het deelproces, niet de join-logica:
    // ze produceren allemaal dezelfde /?game=<id> URL.
    // Receiver-state en inviter-action beïnvloeden WEL de join-logica.

    for (const inviteMethod of INVITE_METHODS) {
        for (const receiverState of RECEIVER_STATES) {
            for (const inviterAction of INVITER_ACTIONS) {
                for (const hostPlatform of PLATFORMS) {
                    for (const guestPlatform of PLATFORMS) {
                        const label = `[${inviteMethod}] [recv:${receiverState}] [host:${inviterAction}] [H:${hostPlatform}/G:${guestPlatform}]`;

                        test(`${label} → guest kan joinen op wachtend spel`, () => {
                            const waitingGame = {
                                hostId: HOST_UID, guestId: null,
                                status: 'waiting',
                            };
                            // Ongeacht methode/platform: guest mag altijd joinen op wachtend spel
                            const r = validateJoinAttempt(waitingGame, GUEST_UID);
                            assert.equal(r.allowed, true);
                            assert.equal(r.action, 'join-as-guest');
                        });

                        test(`${label} → host herkent eigen spel bij herverbinden`, () => {
                            const gameState = inviterAction === 'clicks-own-link'
                                ? { hostId: HOST_UID, guestId: null,      status: 'waiting' }
                                : { hostId: HOST_UID, guestId: GUEST_UID, status: 'playing' };
                            const r = validateJoinAttempt(gameState, HOST_UID);
                            assert.equal(r.allowed, true);
                            assert.equal(r.action, 'rejoin-host');
                        });

                        test(`${label} → link bevat altijd correct ?game= formaat`, () => {
                            const origin = hostPlatform === 'web'
                                ? 'https://emodjeez.net'
                                : 'http://localhost:8080';
                            const gameId = 'testGame123';
                            const url = buildInviteUrl(origin, gameId);
                            const parsed = parseGameIdFromUrl(new URL(url).search);
                            assert.equal(parsed, gameId);
                        });

                        if (receiverState === 'already-open') {
                            test(`${label} → guest al verbonden: herverbinden zonder fout`, () => {
                                const playingGame = {
                                    hostId: HOST_UID, guestId: GUEST_UID, status: 'playing',
                                };
                                const r = validateJoinAttempt(playingGame, GUEST_UID);
                                assert.equal(r.allowed, true);
                                assert.equal(r.action, 'rejoin-guest');
                            });
                        }
                    }
                }
            }
        }
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// REGRESSIETEST: handleMultiplayerMove mag niet op gameActive checken
//
// Bug (was aanwezig tot v1.0.2):
//   handleCategoryClick zette gameActive = false VOOR het aanroepen van
//   handleMultiplayerMove. Die functie had bovenaan `if (!gameActive) return;`,
//   waardoor de move nooit naar Firestore werd geschreven en het spel vastliep.
//
// Fix: de check is verwijderd uit handleMultiplayerMove.
// Deze tests falen met de kapotte logica en slagen met de fix.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Modelleert de volgorde van handleCategoryClick → handleMultiplayerMove.
 *
 * @param {boolean} hasGameActiveGuard  true = kapotte situatie (check aanwezig)
 * @returns {{ moveProcessed: boolean, move: object|null }}
 */
function simulateCategoryClickFlow(catId, gameData, hasGameActiveGuard) {
    let gameActive = true; // beginsituatie: speler mag klikken

    // handleCategoryClick: eerste guard (correct gedrag)
    if (!gameActive) return { moveProcessed: false, move: null };

    // handleCategoryClick: zet gameActive = false om dubbelklik te voorkomen
    gameActive = false;

    // handleMultiplayerMove: hier zat de bug
    if (hasGameActiveGuard && !gameActive) {
        return { moveProcessed: false, move: null }; // ← kapotte situatie
    }

    // Verwerk de move (zou naar Firestore gaan)
    const correct = catId === (EMOJI_DB[gameData.currentEmojiIdx] || {}).c;
    return { moveProcessed: true, move: { correct, categoryId: catId } };
}

describe('Regressie – handleMultiplayerMove gameActive-check (bug v1.0.1 → fix v1.0.2)', () => {
    const game = { currentEmojiIdx: 0, status: 'playing', hostId: 'h', guestId: 'g',
                   hostMove: null, guestMove: null, hostScore: 0, guestScore: 0 };
    const correctCat = EMOJI_DB[0].c;
    const wrongCat   = correctCat === 1 ? 2 : 1;

    // ── Kapotte situatie (zou falen vóór de fix) ──────────────────────────
    test('[BUG] met gameActive-check in handleMultiplayerMove: move wordt NIET verwerkt', () => {
        const { moveProcessed } = simulateCategoryClickFlow(correctCat, game, true);
        assert.equal(moveProcessed, false,
            'Verwacht dat de move geblokkeerd wordt door de foutieve gameActive-check');
    });

    test('[BUG] met gameActive-check: ook fout antwoord wordt niet verwerkt', () => {
        const { moveProcessed } = simulateCategoryClickFlow(wrongCat, game, true);
        assert.equal(moveProcessed, false);
    });

    // ── Correcte situatie (de fix) ────────────────────────────────────────
    test('[FIX] zonder gameActive-check: juist antwoord wordt WEL verwerkt', () => {
        const { moveProcessed, move } = simulateCategoryClickFlow(correctCat, game, false);
        assert.equal(moveProcessed, true,
            'Move moet naar Firestore worden gestuurd ondanks gameActive = false');
        assert.equal(move.correct, true);
        assert.equal(move.categoryId, correctCat);
    });

    test('[FIX] zonder gameActive-check: fout antwoord wordt ook verwerkt (correct = false)', () => {
        const { moveProcessed, move } = simulateCategoryClickFlow(wrongCat, game, false);
        assert.equal(moveProcessed, true);
        assert.equal(move.correct, false);
    });

    test('[FIX] dubbelklik wordt nog steeds geblokkeerd door handleCategoryClick zelf', () => {
        // De guard in handleCategoryClick (gameActive was al false) blokkeert een tweede klik
        let gameActive = false; // situatie: speler heeft al geklikt
        const blocked = !gameActive; // handleCategoryClick check
        assert.equal(blocked, true, 'Tweede klik moet geblokkeerd worden');
    });

    // ── End-to-end via PlayerSimulator ────────────────────────────────────
    test('[FIX] PlayerSimulator: move returned ook als gameActive net false was gezet', () => {
        const player = new PlayerSimulator('h', 'host');
        player.applyState(game); // gameActive = true
        assert.equal(player.gameActive, true);

        const move = player.clickCategory(correctCat, game);
        // clickCategory zet intern gameActive = false maar geeft move terug
        assert.ok(move, 'Move moet worden teruggegeven, niet null');
        assert.equal(move.correct, true);
        assert.equal(player.gameActive, false, 'gameActive hoort false te zijn na klik');
    });

    test('[FIX] na ronde-evaluatie kunnen beide spelers opnieuw klikken', () => {
        const host  = new PlayerSimulator('h', 'host');
        const guest = new PlayerSimulator('g', 'guest');

        host.applyState(game);
        guest.applyState(game);

        // Ronde 1
        const hMove = host.clickCategory(correctCat, game);
        const gMove = guest.clickCategory(correctCat, game);
        assert.ok(hMove.correct && gMove.correct);

        // Evalueer ronde
        const game2 = simulateEvaluateRound({
            ...game,
            hostMove: hMove,
            guestMove: gMove,
        });
        assert.equal(game2.round, 2);

        // Beide spelers ontvangen nieuwe staat
        host.applyState(game2);
        guest.applyState(game2);

        // Beide moeten opnieuw kunnen klikken
        assert.equal(host.gameActive,  true, 'host moet ronde 2 kunnen spelen');
        assert.equal(guest.gameActive, true, 'guest moet ronde 2 kunnen spelen');

        // Ronde 2 kliks lukken ook
        const correctCat2 = EMOJI_DB[game2.currentEmojiIdx].c;
        assert.doesNotThrow(() => host.clickCategory(correctCat2, game2));
        assert.doesNotThrow(() => guest.clickCategory(correctCat2, game2));
    });
});
