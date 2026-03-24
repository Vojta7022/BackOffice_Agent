import { Lead } from '../types';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 91.7 + 19.31) * 10000.123;
  return x - Math.floor(x);
}

// Conversion funnel distribution for 250 leads:
// new: 80, contacted: 55, viewing_scheduled: 45, offer_made: 30, negotiation: 15, closed_won: 15, closed_lost: 10
// Growth trend: Oct 2025 < Nov < Dec < Jan 2026 < Feb < Mar (Q1 2026 > Q4 2025)

const monthlyLeadCounts: { month: string; count: number }[] = [
  { month: '2025-10', count: 30 },
  { month: '2025-11', count: 33 },
  { month: '2025-12', count: 37 },
  { month: '2026-01', count: 55 },
  { month: '2026-02', count: 52 },
  { month: '2026-03', count: 43 },
];

const statusDistribution: Lead['status'][] = [
  // 80 new (32%)
  ...Array(32).fill('new'),
  // 55 contacted (22%)
  ...Array(22).fill('contacted'),
  // 45 viewing_scheduled (18%)
  ...Array(18).fill('viewing_scheduled'),
  // 30 offer_made (12%)
  ...Array(12).fill('offer_made'),
  // 15 negotiation (6%)
  ...Array(6).fill('negotiation'),
  // 15 closed_won (6%)
  ...Array(6).fill('closed_won'),
  // 10 closed_lost (4%)
  ...Array(4).fill('closed_lost'),
];

const leadTypes: Lead['type'][] = ['inquiry', 'inquiry', 'inquiry', 'viewing_request', 'viewing_request', 'offer', 'purchase', 'rental', 'rental'];

const propertyIds = Array.from({ length: 65 }, (_, i) => `prop-${String(i + 1).padStart(3, '0')}`);

const leadNotes: string[] = [
  'Klient volal, chce prohlídku tento týden. Preferuje úterý odpoledne.',
  'Email dotaz z Bezrealitky, odpovězeno do 2 hodin.',
  'Velmi motivovaný kupující, má schválenou hypotéku od ČSOB na 8 mil. CZK.',
  'Ptal se na možnost platby na splátky přímo s majitelem.',
  'Zájemce z Instagramu, viděl reel s virtual tour a chce další podobné byty.',
  'Korporátní klient, hledá 5 bytů pro zaměstnance na relokaci.',
  'Podruhé se ozval po 3 měsících, teď má připravené vlastní zdroje.',
  'Chce vidět byt o víkendu s manželkou a architektem.',
  'Zahraniční investor, komunikace přes prostředníka a due diligence tým.',
  'Zájemce porovnává s konkurenční nabídkou od RE/MAX.',
  'Rodina s alergickým dítětem se ptá na typ topení a podlah.',
  'Odložil rozhodnutí na příští měsíc kvůli čerpání hypotéky.',
  'Nabídku odmítl kvůli ceně, ale má zájem o jiné nemovitosti.',
  'Chce slevu 500 tis., jinak koupí byt na vedlejší ulici.',
  'Přišel na den otevřených dveří, velmi pozitivní reakce a chce druhou návštěvu.',
  'Zájemce si vyžádal půdorys a orientaci oken kvůli home office.',
  'První kontakt po doporučení od stávajícího klienta, vysoká důvěra.',
  'Má zájem pouze pokud součástí ceny zůstane parkovací stání.',
  'Klient chce vědět, zda lze byt krátkodobě pronajímat přes Airbnb.',
  'Volal pozdě večer, urgentně řeší stěhování do konce měsíce.',
  'Poptává virtuální prohlídku, fyzicky je momentálně v Londýně.',
  'Zajímají ho měsíční náklady domu a fond oprav za poslední 2 roky.',
  'Ptal se na možnost vyjednat delší rezervační lhůtu kvůli prodeji vlastního bytu.',
  'Klient chce koupit bez hypotéky, ale čeká na uvolnění prostředků z termínovaného vkladu.',
  'Pozitivní první call, oceňuje rychlou komunikaci a detailní podklady.',
  'Zajímají ho hlukové poměry v ulici a plánované stavební projekty v okolí.',
  'Investor počítá výnos a chce znát skutečné obsazenosti v posledních 12 měsících.',
  'Zájemce chce řešit koupi až po narození dítěte, orientační termín srpen.',
  'Uvažuje o spojení dvou menších jednotek, poptává statický posudek.',
  'Přišel z Facebook kampaně, velmi citlivý na cenu a výši provize.',
  'Chce druhou prohlídku s rodiči, kteří budou pomáhat s financováním.',
  'Volal po pracovní době, protože je celý den na stavbě a jinak nemůže.',
  'Klient chce byt pouze s výtahem a sklepem, jinak se nebude rozhodovat.',
  'Požaduje zaslat návrh kupní smlouvy ještě před podáním nabídky.',
  'Zájemce je připraven podepsat rezervaci ihned po ověření technického stavu.',
  'Řeší firemní nájem a chce, aby na smlouvě byla právnická osoba.',
];

function generateLeads(): Lead[] {
  const leads: Lead[] = [];
  let leadIndex = 0;
  let statusIndex = 0;

  for (const { month, count } of monthlyLeadCounts) {
    for (let i = 0; i < count; i++) {
      leadIndex++;
      const id = `lead-${String(leadIndex).padStart(3, '0')}`;
      const day = String(Math.min(28, Math.floor(seededRand(leadIndex * 3 + 1) * 28) + 1)).padStart(2, '0');

      const status = statusDistribution[statusIndex % statusDistribution.length];
      statusIndex++;

      const type = leadTypes[leadIndex % leadTypes.length];
      const clientId = `client-${String(Math.min(120, Math.floor(seededRand(leadIndex * 7 + 2) * 120) + 1)).padStart(3, '0')}`;
      const propertyId = seededRand(leadIndex * 11 + 4) > 0.15 ? propertyIds[leadIndex % propertyIds.length] : null;

      // Value: closed_won and negotiation leads have concrete values
      let value: number | null = null;
      if (status === 'closed_won' || status === 'negotiation' || status === 'offer_made') {
        value = [3_500_000, 4_800_000, 5_900_000, 7_200_000, 8_500_000, 9_800_000, 11_000_000, 14_500_000, 18_000_000, 25_000_000][leadIndex % 10];
      }

      // Updated date is a few days to weeks after created
      const createdDate = new Date(`${month}-${day}`);
      const daysOffset = Math.floor(seededRand(leadIndex * 13 + 5) * 30) + 1;
      const updatedDate = new Date(createdDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      const updatedStr = updatedDate.toISOString().split('T')[0];

      leads.push({
        id,
        client_id: clientId,
        property_id: propertyId,
        type,
        status,
        value,
        notes: leadNotes[leadIndex % leadNotes.length],
        created_at: `${month}-${day}`,
        updated_at: updatedStr,
      });
    }
  }
  return leads;
}

export const leads: Lead[] = generateLeads();
