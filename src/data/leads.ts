import { Lead } from '../types';

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
  'Klient se ptal na dostupnost a cenu nemovitosti',
  'Zájem o prohlídku, preferuje víkend',
  'Chce více informací o lokalitě a občanské vybavenosti',
  'Žádá o podrobný energetický štítek',
  'Má schválenou hypotéku, připraven jednat',
  'Porovnává s konkurenční nabídkou',
  'Chce vidět byt před rekonstrukcí',
  'Ptá se na možnost slevy při rychlém jednání',
  'Zájemce z portálu, první kontakt',
  'Opakovaný zájemce, byl už na prohlídce jiné nemovitosti',
  'Doporučen od stávajícího klienta',
  'Firma zvažuje pronájem pro zaměstnance',
  'Investor ptající se na výnosnost',
  'Chce znát historii nemovitosti a případné právní zátěže',
  'Preferuje osobní schůzku v kanceláři',
  'Komunikuje pouze emailem',
  'Žádá o virtuální prohlídku',
  'Zajímá se o financování a spolupráci s bankou',
  'Chce nabídku na více nemovitostí najednou',
  'Urgentní — potřebuje bydlení do konce měsíce',
];

function generateLeads(): Lead[] {
  const leads: Lead[] = [];
  let leadIndex = 0;
  let statusIndex = 0;

  for (const { month, count } of monthlyLeadCounts) {
    for (let i = 0; i < count; i++) {
      leadIndex++;
      const id = `lead-${String(leadIndex).padStart(3, '0')}`;
      const day = String(Math.min(28, Math.floor(Math.random() * 28) + 1)).padStart(2, '0');

      const status = statusDistribution[statusIndex % statusDistribution.length];
      statusIndex++;

      const type = leadTypes[leadIndex % leadTypes.length];
      const clientId = `client-${String(Math.min(120, Math.floor(Math.random() * 120) + 1)).padStart(3, '0')}`;
      const propertyId = Math.random() > 0.15 ? propertyIds[leadIndex % propertyIds.length] : null;

      // Value: closed_won and negotiation leads have concrete values
      let value: number | null = null;
      if (status === 'closed_won' || status === 'negotiation' || status === 'offer_made') {
        value = [3_500_000, 4_800_000, 5_900_000, 7_200_000, 8_500_000, 9_800_000, 11_000_000, 14_500_000, 18_000_000, 25_000_000][leadIndex % 10];
      }

      // Updated date is a few days to weeks after created
      const createdDate = new Date(`${month}-${day}`);
      const daysOffset = Math.floor(Math.random() * 30) + 1;
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
