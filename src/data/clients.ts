import { Client } from '../types';

// Helper: distribute clients across months with January 2026 having the most
// Source distribution: 40% website, 15% sreality, 10% bezrealitky, 10% referral, 10% instagram/facebook, 15% other
const sources: Client['source'][] = [
  // 48 website (40%)
  ...Array(48).fill('website'),
  // 18 sreality (15%)
  ...Array(18).fill('sreality'),
  // 12 bezrealitky (10%)
  ...Array(12).fill('bezrealitky'),
  // 12 referral (10%)
  ...Array(12).fill('referral'),
  // 6 instagram (5%)
  ...Array(6).fill('instagram'),
  // 6 facebook (5%)
  ...Array(6).fill('facebook'),
  // 6 cold_call (5%)
  ...Array(6).fill('cold_call'),
  // 6 walk_in (5%)
  ...Array(6).fill('walk_in'),
  // 6 other (5%)
  ...Array(6).fill('other'),
];

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

const clientTypes: Client['type'][] = ['buyer', 'buyer', 'buyer', 'seller', 'seller', 'investor', 'investor', 'tenant', 'tenant', 'tenant'];

// Monthly distribution: Jan 2026 = peak (18), others vary — total 120
const monthlyDistribution: { month: string; count: number }[] = [
  { month: '2025-04', count: 7 },
  { month: '2025-05', count: 8 },
  { month: '2025-06', count: 9 },
  { month: '2025-07', count: 10 },
  { month: '2025-08', count: 9 },
  { month: '2025-09', count: 10 },
  { month: '2025-10', count: 11 },
  { month: '2025-11', count: 10 },
  { month: '2025-12', count: 10 },
  { month: '2026-01', count: 18 },
  { month: '2026-02', count: 12 },
  { month: '2026-03', count: 6 },
];

function generateClients(): Client[] {
  const clients: Client[] = [];
  let clientIndex = 0;
  let sourceIndex = 0;

  for (const { month, count } of monthlyDistribution) {
    for (let i = 0; i < count; i++) {
      clientIndex++;
      const id = `client-${String(clientIndex).padStart(3, '0')}`;
      const firstName = czechFirstNames[clientIndex % czechFirstNames.length];
      const lastName = czechLastNames[clientIndex % czechLastNames.length];
      const name = `${firstName} ${lastName}`;
      const emailName = `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
      const day = String(Math.min(28, Math.floor(Math.random() * 28) + 1)).padStart(2, '0');
      const source = sources[sourceIndex % sources.length];
      sourceIndex++;

      const type = clientTypes[clientIndex % clientTypes.length];
      const status: Client['status'] = clientIndex <= 90 ? 'active' : (clientIndex <= 105 ? 'inactive' : 'closed');

      const notes = generateClientNotes(type, source);

      clients.push({
        id,
        name,
        email: `${emailName}@email.cz`,
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

function generateClientNotes(type: Client['type'], source: Client['source']): string {
  const notesByType: Record<Client['type'], string[]> = {
    buyer: [
      'Hledá byt 3+kk v Praze, rozpočet do 10 mil. CZK',
      'Zájemce o novostavbu, preferuje Karlín nebo Holešovice',
      'Hledá investiční byt k pronájmu, zajímá se o výnos',
      'Mladý pár, první byt, hledají 2+kk do 7 mil.',
      'Hledá rodinný dům s zahradou, okolí Prahy',
      'Investor, zajímá se o komerční nemovitosti',
      'Hledá byt pro rodiče, bezbariérový přístup',
      'Zájemce o luxusní nemovitost, bez cenového limitu',
    ],
    seller: [
      'Prodává byt po rodičích, nemovitost v původním stavu',
      'Prodej kvůli stěhování do zahraničí, potřebuje rychlý prodej',
      'Prodává investiční byt, nájemce do konce roku',
      'Developer, prodej posledních jednotek v projektu',
      'Prodej rodinného domu, stěhování do menšího',
    ],
    investor: [
      'Portfolio investor, hledá nemovitosti s výnosem nad 5%',
      'Zahraniční investor, zajímá se o pražský trh',
      'Investuje do rekonstrukcí a flipů',
      'Hledá celé bytové domy nebo komerční objekty',
      'Investiční fond, rozpočet 50+ mil. CZK',
    ],
    tenant: [
      'Hledá pronájem 2+kk v centru Prahy, do 25 000 CZK/měsíc',
      'Expat, potřebuje byt na 2 roky, anglicky mluvící',
      'Rodina s dětmi, hledá 3+1 s blízkostí školy',
      'Student, hledá garsonku nebo spolubydlení',
      'Firma hledá byt pro zaměstnance na relokaci',
    ],
  };

  const notes = notesByType[type];
  return notes[Math.floor(Math.random() * notes.length)];
}

export const clients: Client[] = generateClients();
