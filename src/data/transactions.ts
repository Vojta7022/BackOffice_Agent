import { Transaction } from '../types';

export const transactions: Transaction[] = [
  // 2025 Q2 (April - June): 8 transactions
  { id: 'tx-001', property_id: 'prop-003', client_id: 'client-018', type: 'sale', amount: 4_200_000, commission: 126_000, status: 'completed', date: '2025-04-15', notes: 'Prodej garsonky v Holešovicích. Rychlý obchod.' },
  { id: 'tx-002', property_id: 'prop-012', client_id: 'client-052', type: 'rental', amount: 18_000, commission: 18_000, status: 'completed', date: '2025-04-20', notes: 'Pronájem investičního bytu, roční smlouva.' },
  { id: 'tx-003', property_id: 'prop-043', client_id: 'client-007', type: 'sale', amount: 3_600_000, commission: 108_000, status: 'completed', date: '2025-05-10', notes: 'Prodej garsonky na Žižkově. Klient platil hotově.' },
  { id: 'tx-004', property_id: 'prop-060', client_id: 'client-046', type: 'sale', amount: 3_800_000, commission: 114_000, status: 'completed', date: '2025-05-25', notes: 'Prodej bytu v Olomouci. Hypotéka schválena.' },
  { id: 'tx-005', property_id: 'prop-030', client_id: 'client-090', type: 'sale', amount: 4_800_000, commission: 144_000, status: 'completed', date: '2025-06-05', notes: 'Garsonka na Vinohradech. Investiční nákup.' },
  { id: 'tx-006', property_id: 'prop-006', client_id: 'client-015', type: 'rental', amount: 35_000, commission: 35_000, status: 'completed', date: '2025-06-12', notes: 'Pronájem kanceláře v Holešovické tržnici.' },
  { id: 'tx-007', property_id: 'prop-052', client_id: 'client-027', type: 'sale', amount: 2_900_000, commission: 87_000, status: 'completed', date: '2025-06-20', notes: 'Nejlevnější prodej sezóny. Garsonka v Brně.' },
  { id: 'tx-008', property_id: 'prop-035', client_id: 'client-100', type: 'sale', amount: 3_950_000, commission: 118_500, status: 'completed', date: '2025-06-28', notes: 'Garsonka u Anděla. Rychlý prodej za 3 týdny.' },

  // 2025 Q3 (July - September): 10 transactions
  { id: 'tx-009', property_id: 'prop-045', client_id: 'client-011', type: 'rental', amount: 32_000, commission: 32_000, status: 'completed', date: '2025-07-01', notes: 'Pronájem bytu u Flory. Rodina s dětmi.' },
  { id: 'tx-010', property_id: 'prop-051', client_id: 'client-025', type: 'rental', amount: 40_000, commission: 40_000, status: 'completed', date: '2025-07-15', notes: 'Pronájem kanceláře v Brně. IT firma.' },
  { id: 'tx-011', property_id: 'prop-010', client_id: 'client-048', type: 'sale', amount: 7_800_000, commission: 234_000, status: 'completed', date: '2025-08-05', notes: 'Prodej cihlového bytu v Holešovicích. Výborná cena.' },
  { id: 'tx-012', property_id: 'prop-024', client_id: 'client-078', type: 'sale', amount: 11_200_000, commission: 336_000, status: 'completed', date: '2025-08-20', notes: 'Prodej bytu u Riegrových sadů. Nadprůměrná provize.' },
  { id: 'tx-013', property_id: 'prop-017', client_id: 'client-064', type: 'rental', amount: 45_000, commission: 45_000, status: 'completed', date: '2025-08-25', notes: 'Pronájem obchodu na Sokolovské. Kavárna.' },
  { id: 'tx-014', property_id: 'prop-032', client_id: 'client-094', type: 'rental', amount: 28_000, commission: 28_000, status: 'completed', date: '2025-09-01', notes: 'Pronájem na Vinohradech. Dlouhodobý nájemce.' },
  { id: 'tx-015', property_id: 'prop-039', client_id: 'client-108', type: 'rental', amount: 24_000, commission: 24_000, status: 'completed', date: '2025-09-10', notes: 'Pronájem cihlového bytu na Smíchově.' },
  { id: 'tx-016', property_id: 'prop-058', client_id: 'client-041', type: 'rental', amount: 15_000, commission: 15_000, status: 'completed', date: '2025-09-15', notes: 'Pronájem investičního bytu v Brně. Stabilní nájemce.' },
  { id: 'tx-017', property_id: 'prop-015', client_id: 'client-060', type: 'sale', amount: 7_200_000, commission: 216_000, status: 'completed', date: '2025-09-20', notes: 'Prodej bytu v Karlíně. Cihlový dům.' },
  { id: 'tx-018', property_id: 'prop-022', client_id: 'client-074', type: 'sale', amount: 8_900_000, commission: 267_000, status: 'completed', date: '2025-09-28', notes: 'Prodej moderního bytu u Florenc.' },

  // 2025 Q4 (October - December): 12 transactions — busier period
  { id: 'tx-019', property_id: 'prop-041', client_id: 'client-001', type: 'sale', amount: 5_800_000, commission: 174_000, status: 'completed', date: '2025-10-05', notes: 'Prodej bytu na Žižkově. Dobrá cena pro kupujícího.' },
  { id: 'tx-020', property_id: 'prop-047', client_id: 'client-016', type: 'sale', amount: 4_900_000, commission: 147_000, status: 'completed', date: '2025-10-12', notes: 'Byt s balkónem na Žižkově. Kupující z referentu.' },
  { id: 'tx-021', property_id: 'prop-053', client_id: 'client-029', type: 'sale', amount: 5_500_000, commission: 165_000, status: 'completed', date: '2025-10-20', notes: 'Novostavba v Brně. Mladý pár.' },
  { id: 'tx-022', property_id: 'prop-049', client_id: 'client-021', type: 'sale', amount: 6_800_000, commission: 204_000, status: 'completed', date: '2025-10-28', notes: 'Byt v centru Brna. Investor.' },
  { id: 'tx-023', property_id: 'prop-042', client_id: 'client-003', type: 'sale', amount: 9_900_000, commission: 297_000, status: 'completed', date: '2025-11-05', notes: 'Loft na Žižkově. Unikátní nemovitost, rychlý prodej.' },
  { id: 'tx-024', property_id: 'prop-029', client_id: 'client-088', type: 'sale', amount: 13_500_000, commission: 405_000, status: 'completed', date: '2025-11-15', notes: 'Mezonet na Vinohradech. Nejvyšší provize měsíce.' },
  { id: 'tx-025', property_id: 'prop-037', client_id: 'client-104', type: 'sale', amount: 12_800_000, commission: 384_000, status: 'completed', date: '2025-11-22', notes: 'Byt s výhledem na Vltavu. Smíchov.' },
  { id: 'tx-026', property_id: 'prop-059', client_id: 'client-043', type: 'sale', amount: 7_500_000, commission: 225_000, status: 'completed', date: '2025-12-02', notes: 'Rodinný dům v Plzni.' },
  { id: 'tx-027', property_id: 'prop-055', client_id: 'client-033', type: 'sale', amount: 9_800_000, commission: 294_000, status: 'completed', date: '2025-12-10', notes: 'Dům v Bystrci, Brno. Rodina s dětmi.' },
  { id: 'tx-028', property_id: 'prop-023', client_id: 'client-076', type: 'sale', amount: 19_500_000, commission: 585_000, status: 'completed', date: '2025-12-15', notes: 'Velký byt na Vinohradech. Nejvyšší obchod kvartálu.' },
  { id: 'tx-029', property_id: 'prop-013', client_id: 'client-055', type: 'sale', amount: 16_500_000, commission: 495_000, status: 'completed', date: '2025-12-18', notes: 'Luxusní byt v Karlín Parku.' },
  { id: 'tx-030', property_id: 'prop-050', client_id: 'client-023', type: 'sale', amount: 32_000_000, commission: 960_000, status: 'completed', date: '2025-12-22', notes: 'Vila v Brně. Největší obchod roku!' },

  // 2026 Q1 (January - March): 10 transactions — strong start
  { id: 'tx-031', property_id: 'prop-033', client_id: 'client-096', type: 'sale', amount: 10_500_000, commission: 315_000, status: 'completed', date: '2026-01-08', notes: 'Novostavba Smíchov City. Smart home.' },
  { id: 'tx-032', property_id: 'prop-016', client_id: 'client-062', type: 'sale', amount: 25_000_000, commission: 750_000, status: 'completed', date: '2026-01-15', notes: 'Penthouse Karlín. Nejdražší prodej Q1!' },
  { id: 'tx-033', property_id: 'prop-007', client_id: 'client-035', type: 'sale', amount: 9_200_000, commission: 276_000, status: 'completed', date: '2026-01-22', notes: 'Byt v Riverparku. Výhled na Vltavu.' },
  { id: 'tx-034', property_id: 'prop-057', client_id: 'client-038', type: 'sale', amount: 5_900_000, commission: 177_000, status: 'completed', date: '2026-01-28', notes: 'Panelák Brno Lesná po rekonstrukci.' },
  { id: 'tx-035', property_id: 'prop-048', client_id: 'client-019', type: 'sale', amount: 8_200_000, commission: 246_000, status: 'pending', date: '2026-02-05', notes: 'Novostavba u Parukářky. Čeká se na zápis do KN.' },
  { id: 'tx-036', property_id: 'prop-026', client_id: 'client-082', type: 'sale', amount: 8_800_000, commission: 264_000, status: 'pending', date: '2026-02-12', notes: 'Byt u náměstí Míru. Smlouva podepsána.' },
  { id: 'tx-037', property_id: 'prop-019', client_id: 'client-068', type: 'sale', amount: 11_900_000, commission: 357_000, status: 'pending', date: '2026-02-20', notes: 'River Lofts Karlín. Smlouva v přípravě.' },
  { id: 'tx-038', property_id: 'prop-005', client_id: 'client-030', type: 'sale', amount: 14_800_000, commission: 444_000, status: 'pending', date: '2026-03-01', notes: 'Mezonet DOX rezidence. Finalizace.' },
  { id: 'tx-039', property_id: 'prop-040', client_id: 'client-110', type: 'rental', amount: 120_000, commission: 120_000, status: 'completed', date: '2026-03-05', notes: 'Kancelář Smíchov Gate. Velký pronájem.' },
  { id: 'tx-040', property_id: 'prop-061', client_id: 'client-049', type: 'sale', amount: 4_200_000, commission: 126_000, status: 'cancelled', date: '2026-03-10', notes: 'Chalupa Český ráj. Kupující odstoupil kvůli špatnému stavu.' },
];
