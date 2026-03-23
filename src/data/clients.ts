import { Client } from '../types';

// ─── Seeded deterministic PRNG ────────────────────────────────────────────────
// Uses the client index so values are stable across builds (no Math.random).

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Weighted picker ──────────────────────────────────────────────────────────

function weightedPick<T>(weights: [T, number][], rand: number): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let cumulative = 0;
  for (const [item, weight] of weights) {
    cumulative += weight;
    if (rand * total < cumulative) return item;
  }
  return weights[weights.length - 1][0];
}

// ─── Source distribution (target: ~120 clients) ───────────────────────────────
// website ~40%, sreality ~15%, bezrealitky ~10%, referral ~10%
// instagram ~6%, facebook ~4%, cold_call ~7%, walk_in ~3%, other ~5%

const SOURCE_WEIGHTS: [Client['source'], number][] = [
  ['website',     40],
  ['sreality',    15],
  ['bezrealitky', 10],
  ['referral',    10],
  ['instagram',    6],
  ['facebook',     4],
  ['cold_call',    7],
  ['walk_in',      3],
  ['other',        5],
];

// ─── Type distribution: buyer 35%, tenant 25%, seller 20%, investor 20% ───────

const TYPE_WEIGHTS: [Client['type'], number][] = [
  ['buyer',    35],
  ['tenant',   25],
  ['seller',   20],
  ['investor', 20],
];

// ─── Name data ────────────────────────────────────────────────────────────────

const czechFirstNames = [
  'Jan', 'Petr', 'Martin', 'Tomáš', 'Pavel', 'Jiří', 'Jakub', 'David', 'Lukáš', 'Michal',
  'Ondřej', 'Filip', 'Vojtěch', 'Adam', 'Marek', 'Daniel', 'Radek', 'Vladimír', 'Zdeněk', 'Milan',
  'Anna', 'Marie', 'Eva', 'Lucie', 'Kateřina', 'Petra', 'Jana', 'Tereza', 'Martina', 'Veronika',
  'Hana', 'Barbora', 'Monika', 'Lenka', 'Klára', 'Alena', 'Ivana', 'Markéta', 'Simona', 'Nikola',
  'Robert', 'Aleš', 'Stanislav', 'Roman', 'Josef', 'Miroslav', 'Karel', 'Jaroslav', 'René', 'Igor',
  'Denisa', 'Gabriela', 'Renáta', 'Dagmar', 'Zuzana', 'Jitka', 'Helena', 'Věra', 'Dana', 'Olga',
];

const czechLastNames = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
  'Pokorný', 'Marek', 'Pospíšil', 'Hájek', 'Jelínek', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček',
  'Nováková', 'Svobodová', 'Novotná', 'Dvořáková', 'Černá', 'Procházková', 'Kučerová', 'Veselá', 'Horáková', 'Němcová',
  'Pokorná', 'Marková', 'Pospíšilová', 'Hájková', 'Jelínková', 'Králová', 'Růžičková', 'Benešová', 'Fialová', 'Sedláčková',
];

const agentIds = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'agent-005', 'agent-006', 'agent-007', 'agent-008'];

// ─── Notes by type (varied pool) ─────────────────────────────────────────────

const notesByType: Record<Client['type'], string[]> = {
  buyer: [
    'Hledá byt 3+kk v Praze, rozpočet do 10 mil. CZK',
    'Zájemce o novostavbu, preferuje Karlín nebo Holešovice',
    'Mladý pár, první byt, hledají 2+kk do 7 mil.',
    'Hledá rodinný dům s zahradou, okolí Prahy',
    'Hledá byt pro rodiče, bezbariérový přístup',
    'Zájemce o luxusní nemovitost, priorita je lokalita',
    'Koupě bytu jako investice k pronájmu, výnos min. 4,5 %',
    'Hledá 2+1 nebo 3+kk, důležitá blízkost metra',
    'Přestěhování z Brna, orientace v pražském trhu',
    'Developer, zájem o pozemky nebo starší domy k demolici',
    'Hledá byt do 50 m² v centru nebo Žižkově',
    'Rodinný dům na Praze-západ, do 15 mil. CZK',
  ],
  seller: [
    'Prodává byt po rodičích, nemovitost v původním stavu',
    'Prodej kvůli stěhování do zahraničí, potřebuje rychlý prodej',
    'Prodává investiční byt, stávající nájemce do konce roku',
    'Developer, prodej posledních jednotek v projektu',
    'Prodej rodinného domu, stěhování do menšího',
    'Prodává byt po rozvodu, chce co nejrychlejší transakci',
    'Dědictví — sourozenci se dohodli na prodeji',
    'Prodej komerčního prostoru, firma se stěhuje',
    'Výprodej bytů z portfolia kvůli daňové optimalizaci',
    'Urgentní prodej — hypotéka před splatností',
  ],
  investor: [
    'Portfolio investor, hledá nemovitosti s výnosem nad 5 %',
    'Zahraniční investor, zajímá se o pražský trh',
    'Investuje do rekonstrukcí a flipů, praxe 10 let',
    'Hledá celé bytové domy nebo komerční objekty',
    'Investiční fond, rozpočet 50+ mil. CZK',
    'Zájem o komerční nemovitosti v Brně',
    'Kupuje byty v původním stavu, sám rekonstruuje',
    'Zájem o pozemky v rozvojových lokalitách',
    'Skupina investorů, hledá projekt od 20 jednotek',
    'Zájem o administrativní budovy mimo centrum',
  ],
  tenant: [
    'Hledá pronájem 2+kk v centru Prahy, do 25 000 CZK/měsíc',
    'Expat z Německa, potřebuje byt na 2 roky, mluví anglicky',
    'Rodina s dětmi, hledá 3+1 blízko dobré školy',
    'Student, hledá garsonku nebo sdílení',
    'Firma hledá byt pro zaměstnance na relokaci',
    'Hledá pronájem kanceláře 50–100 m², centrum',
    'Kavárna hledá prostory na frekventované ulici',
    'Pronájem domu na rok, přechodné bydlení',
    'Hledá velký byt 4+kk pro více spolubydlících',
    'Startup hledá coworkingový nebo kancelářský prostor',
  ],
};

function pickNote(type: Client['type'], seed: number): string {
  const pool = notesByType[type];
  return pool[Math.floor(seededRand(seed) * pool.length)];
}

// ─── Monthly distribution (total = 120) ──────────────────────────────────────

const monthlyDistribution: { month: string; count: number }[] = [
  { month: '2025-04', count: 7  },
  { month: '2025-05', count: 8  },
  { month: '2025-06', count: 9  },
  { month: '2025-07', count: 10 },
  { month: '2025-08', count: 9  },
  { month: '2025-09', count: 10 },
  { month: '2025-10', count: 11 },
  { month: '2025-11', count: 10 },
  { month: '2025-12', count: 10 },
  { month: '2026-01', count: 18 },
  { month: '2026-02', count: 12 },
  { month: '2026-03', count: 6  },
];

// ─── Generator ────────────────────────────────────────────────────────────────

function generateClients(): Client[] {
  const clients: Client[] = [];
  let clientIndex = 0;

  for (const { month, count } of monthlyDistribution) {
    for (let i = 0; i < count; i++) {
      clientIndex++;

      const id = `client-${String(clientIndex).padStart(3, '0')}`;
      const firstName = czechFirstNames[clientIndex % czechFirstNames.length];
      const lastName = czechLastNames[clientIndex % czechLastNames.length];
      const name = `${firstName} ${lastName}`;
      const emailBase = `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

      // Deterministic day within month (1–28)
      const day = String(Math.min(28, Math.floor(seededRand(clientIndex * 3 + 1) * 28) + 1)).padStart(2, '0');

      // Weighted source (each client gets unique rand via clientIndex * prime + offset)
      const source = weightedPick(SOURCE_WEIGHTS, seededRand(clientIndex * 7 + 2));

      // Weighted type
      const type = weightedPick(TYPE_WEIGHTS, seededRand(clientIndex * 11 + 3));

      const status: Client['status'] =
        clientIndex <= 90 ? 'active' : clientIndex <= 105 ? 'inactive' : 'closed';

      const notes = pickNote(type, clientIndex * 13 + 5);

      clients.push({
        id,
        name,
        email: `${emailBase}${clientIndex > czechFirstNames.length ? clientIndex : ''}@email.cz`,
        phone: `+420 ${600 + (clientIndex % 80)} ${String(100 + (clientIndex * 7) % 900).padStart(3, '0')} ${String(100 + (clientIndex * 13) % 900).padStart(3, '0')}`,
        type,
        source,
        status,
        notes,
        assigned_agent: agentIds[clientIndex % agentIds.length],
        created_at: `${month}-${day}`,
      });
    }
  }

  return clients;
}

export const clients: Client[] = generateClients();
