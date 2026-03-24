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
const emailDomains = ['email.cz', 'seznam.cz', 'gmail.com', 'centrum.cz', 'outlook.com', 'firma.cz'];

// ─── Notes by type (varied pool) ─────────────────────────────────────────────

const notesByType: Record<Client['type'], string[]> = {
  buyer: [
    'Hledá 3+kk v Holešovicích, max 9 mil., preferuje cihlový dům.',
    'Pár se dvěma dětmi, potřebují 4 pokoje a docházku do školy pěšky.',
    'IT pracovník na remote, chce byt s oddělenou pracovnou a rychlým internetem.',
    'Přestěhování z Brna do Prahy, potřebuje vyřešit koupi nejpozději do června.',
    'Investor, zajímá se pouze o Vinohrady a Karlín, sleduje cenu za m².',
    'Cizinec, komunikace v angličtině, hledá pronájem s opcí na koupi.',
    'Senior, potřebuje bezbariérový byt v přízemí nebo s výtahem.',
    'Mladá rodina kupuje první byt, celkový rozpočet do 6 mil. CZK.',
    'Developer hledá pozemky pro menší rezidenční výstavbu na okraji Prahy.',
    'Hledá komerční prostor pro kavárnu, 50–80 m², ideálně rohovou jednotku.',
    'Chce byt s balkonem u metra B, domácí mazlíček podmínkou.',
    'Manažer banky, hledá reprezentativní 4+kk na Vinohradech do 20 mil. CZK.',
    'Rozvedený klient, potřebuje rychle menší byt blízko kanceláře na Andělu.',
    'Zájem o novostavbu s garážovým stáním, nechce další investice do úprav.',
    'Hledá chalupu do dvou hodin od Prahy, důležitá je zahrada a klid.',
    'Kupuje byt pro studující dceru, preferuje Žižkov nebo Karlín.',
    'Lékařka, chce tichý byt u parku a samostatnou místnost pro home office.',
    'Hledá rodinný dům na Praze-západ, minimálně 5 pokojů a dvojgaráž.',
    'Německý klient, hledá kancelář s možností rychlého nastěhování a parkování.',
    'První investiční nákup, chce jistotu dlouhodobého pronájmu a nízkých nákladů.',
    'Hledá byt pro rodiče po návratu ze zahraničí, důležitá je občanská vybavenost.',
    'Architekt, zajímají ho lofty a byty s původními prvky v širším centru.',
  ],
  seller: [
    'Prodej bytu po rozvodu, potřebuje rychle uzavřít a rozdělit finance.',
    'Dědictví, tři sourozenci se musí dohodnout na ceně i termínu předání.',
    'Stěhuje se do zahraničí, byt bude volný od května a chce minimum starostí.',
    'Prodává investiční byt, nájemce má smlouvu do konce roku 2026.',
    'Developer, doprodává poslední 3 jednotky v projektu na Smíchově.',
    'Důchodce, prodává velký dům a stěhuje se do menšího bytu.',
    'Majitelka po rodičích zdědila byt v původním stavu, nechce rekonstrukci řešit sama.',
    'Prodej kanceláře po sloučení firem, prostor je prázdný a připravený k předání.',
    'Rodina se stěhuje do novostavby za Prahou, současný byt chce prodat do léta.',
    'Urgentní prodej kvůli refixaci hypotéky, očekává realistickou cenovou strategii.',
    'Klient prodává rekreační chalupu, protože ji rodina už nevyužívá.',
    'Majitel pronajímaného bytu zvažuje prodej pouze investorovi se stávajícím nájemcem.',
    'Potřebuje prodat komerční jednotku po ukončení podnikání v gastronomii.',
    'Manželé prodávají dům po odchodu dětí, preferují diskrétní prodej bez portálů.',
    'Správce rodinného trustu nabízí činžovní dům, chce silného kupujícího a rychlé due diligence.',
    'Majitelka bytu na Vinohradech už koupila nový byt a potřebuje navazující financování.',
    'Developer zvažuje blokový prodej několika menších bytů jednomu investorovi.',
    'Prodej domu po rozdělení firmy, součástí je i garáž a dílna.',
    'Klientka řeší přesun do senior housingu a chce profesionálně ohlídat celý proces.',
    'Prodává ateliér po neúspěšném podnikání, potřebuje pomoct i s vyklizením prostoru.',
    'Investor odprodává část portfolia kvůli přesunu kapitálu do zahraničí.',
    'Vlastník bytu požaduje důkladné prověření kupujících, nechce riskovat zmařenou rezervaci.',
  ],
  investor: [
    'Portfolio investor, hledá stabilní výnos nad 5 % a nízkou fluktuaci nájemníků.',
    'Flipper, kupuje byty v původním stavu a prodává po rychlé rekonstrukci.',
    'Zahraniční investor z Rakouska, komunikuje přes family office v Praze.',
    'Investiční fond, rozpočet 50+ mil. CZK, preferuje větší balíky aktiv.',
    'Kupuje celé činžovní domy s potenciálem zvýšení nájemného.',
    'Zajímá se o komerční nemovitosti v Brně a Ostravě s dlouhými nájemními smlouvami.',
    'Hledá menší retail parky s anchor tenantem a parkingem.',
    'Investor orientovaný na studentské byty v Brně a Olomouci.',
    'Skupina partnerů, hledá projekt od 20 jednotek ve fázi shell & core.',
    'Private equity klient zvažuje nákup kancelářské budovy mimo centrum Prahy.',
    'Kupuje pozemky v rozvojových lokalitách kolem Prahy s územní rezervou.',
    'Rodinná kancelář, zajímají ji prémiové byty s dlouhodobou kapitálovou ochranou.',
    'Klient hledá mixed-use objekt s retail parterem a kancelářemi nahoře.',
    'Investuje do krátkodobých pronájmů, řeší hlavně turisticky silné lokality.',
    'Hledá developerské příležitosti v brownfieldech a průmyslových areálech.',
    'Nizozemský investor, prioritou je ESG standard a nízká energetická náročnost.',
    'Kupuje pouze aktiva s možností refinancování po stabilizaci nájemního cashflow.',
    'Lokální investor, chce diverzifikovat mezi byty, kanceláře a lehkou komerci.',
    'Speciální situace: hledá distressed sale a majetek po restrukturalizaci.',
    'Fond zvažuje forward purchase u projektu s dokončením v roce 2027.',
    'Hledá servisované apartmány pro firemní klientelu a dlouhodobé pobyty.',
    'Flipper se zaměřuje výhradně na byty 2+kk a 3+kk ve starší zástavbě.',
  ],
  tenant: [
    'Expat z Francie, potřebuje zařízený byt na 2 roky a komunikuje anglicky.',
    'Rodina se dvěma dětmi hledá 3+1 blízko školy a dětského hřiště.',
    'Student medicíny, chce menší byt poblíž MHD a nemocnice.',
    'Korporátní relokace, firma hledá 5 bytů pro zaměstnance z Německa.',
    'Mladý pár chce pronájem 2+kk v centru Prahy do 28 000 CZK měsíčně.',
    'Startup hledá kancelář s možností růstu týmu během 12 měsíců.',
    'Kavárna hledá rohový prostor s výlohou a zahrádkou.',
    'Manažer na krátkodobé misi, chce servisovaný byt na 6 měsíců.',
    'Rodina po rekonstrukci vlastního domu potřebuje přechodné bydlení na rok.',
    'Studentka architektury hledá světlé studio s možností domácího ateliéru.',
    'Americký expat chce byt s parkováním a domácí kanceláří poblíž Karlína.',
    'Mladá právnička hledá reprezentativní 2+kk na Vinohradech nebo Letné.',
    'Firma poptává kancelář 50–100 m² s recepcí a zasedačkou.',
    'Tříčlenná skupina studentů hledá velký byt 4+kk pro spolubydlení.',
    'Rozvedený klient chce rychlý pronájem menšího bytu bez provize navíc.',
    'Cizinec s kočkou, potřebuje pet-friendly nájem poblíž parku.',
    'Rodina vracející se ze zahraničí chce nájem s možností pozdější koupě.',
    'Konzultant hledá klidný byt s balkonem a dobrou dostupností na letiště.',
    'IT firma hledá kancelář s optikou, serverovnou a flexibilní smlouvou.',
    'Zdravotní sestra chce menší nájem v dosahu nočních spojů MHD.',
    'Čtyři studenti VUT hledají velký byt v Brně, ideálně poblíž centra.',
    'Majitel malého e-shopu hledá kombinaci showroomu a skladu do 70 m².',
  ],
};

function pickNote(type: Client['type'], seed: number): string {
  const pool = notesByType[type];
  return pool[Math.floor(seededRand(seed) * pool.length)];
}

function pickEmailDomain(seed: number): string {
  return emailDomains[Math.floor(seededRand(seed) * emailDomains.length)];
}

function formatPhoneNumber(seed: number): string {
  const first = 600 + Math.floor(seededRand(seed * 5 + 1) * 300);
  const second = 100 + Math.floor(seededRand(seed * 5 + 2) * 900);
  const third = 100 + Math.floor(seededRand(seed * 5 + 3) * 900);
  const compact = `${first}${String(second).padStart(3, '0')}${String(third).padStart(3, '0')}`;
  const firstBlock = String(first).padStart(3, '0');
  const secondBlock = String(second).padStart(3, '0');
  const thirdBlock = String(third).padStart(3, '0');
  const variant = Math.floor(seededRand(seed * 5 + 4) * 4);

  if (variant === 0) return `+420 ${firstBlock} ${secondBlock} ${thirdBlock}`;
  if (variant === 1) return `+420${compact}`;
  if (variant === 2) return `+420 ${firstBlock}${secondBlock}${thirdBlock}`;
  return `${firstBlock} ${secondBlock} ${thirdBlock}`;
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
      const domain = pickEmailDomain(clientIndex * 17 + 7);

      clients.push({
        id,
        name,
        email: `${emailBase}${clientIndex > czechFirstNames.length ? clientIndex : ''}@${domain}`,
        phone: formatPhoneNumber(clientIndex),
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
