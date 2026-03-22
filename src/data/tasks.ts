import { Task } from '../types';

export const tasks: Task[] = [
  {
    id: 'task-001', title: 'Doplnit údaje o rekonstrukci — Komunardů 32',
    description: 'U nemovitosti prop-001 chybí detailní údaje o stavebních úpravách. Kontaktovat vlastníka a doplnit.',
    assigned_to: 'agent-003', related_property_id: 'prop-001', related_client_id: null,
    status: 'todo', priority: 'high', due_date: '2026-03-25', created_at: '2026-03-18',
  },
  {
    id: 'task-002', title: 'Připravit podklady pro vedení — týdenní report',
    description: 'Zpracovat přehled prodejů, leadů a nových klientů za uplynulý týden.',
    assigned_to: 'agent-002', related_property_id: null, related_client_id: null,
    status: 'in_progress', priority: 'high', due_date: '2026-03-24', created_at: '2026-03-20',
  },
  {
    id: 'task-003', title: 'Prohlídka — Penthouse Karlín',
    description: 'Naplánovat prohlídku penthouse prop-016 s klientem client-062. Ověřit dostupnost klíčů.',
    assigned_to: 'agent-004', related_property_id: 'prop-016', related_client_id: 'client-062',
    status: 'done', priority: 'urgent', due_date: '2026-03-20', created_at: '2026-03-15',
  },
  {
    id: 'task-004', title: 'Aktualizace fotek — Vila Havlíčkovy sady',
    description: 'Objednat profesionální focení nemovitosti prop-031. Vila je na trhu dlouho, nové fotky by mohly pomoci.',
    assigned_to: 'agent-006', related_property_id: 'prop-031', related_client_id: null,
    status: 'todo', priority: 'medium', due_date: '2026-03-28', created_at: '2026-03-15',
  },
  {
    id: 'task-005', title: 'Ověřit stav hypotéky — River Lofts',
    description: 'Klient client-068 čeká na schválení hypotéky pro prop-019. Kontaktovat banku.',
    assigned_to: 'agent-005', related_property_id: 'prop-019', related_client_id: 'client-068',
    status: 'in_progress', priority: 'high', due_date: '2026-03-23', created_at: '2026-03-17',
  },
  {
    id: 'task-006', title: 'Zpracovat smlouvu — Mezonet DOX',
    description: 'Připravit kupní smlouvu pro prop-005. Odeslat právníkovi ke kontrole.',
    assigned_to: 'agent-002', related_property_id: 'prop-005', related_client_id: 'client-030',
    status: 'in_progress', priority: 'urgent', due_date: '2026-03-22', created_at: '2026-03-14',
  },
  {
    id: 'task-007', title: 'Follow-up nových leadů z webu',
    description: 'Kontaktovat 8 nových leadů z minulého týdne, kteří ještě nebyli osloveni.',
    assigned_to: 'agent-007', related_property_id: null, related_client_id: null,
    status: 'todo', priority: 'high', due_date: '2026-03-24', created_at: '2026-03-20',
  },
  {
    id: 'task-008', title: 'Nacenit nemovitost — Činžovní dům Anděl',
    description: 'Připravit cenovou analýzu pro prop-034. Porovnat s podobnými objekty na trhu.',
    assigned_to: 'agent-003', related_property_id: 'prop-034', related_client_id: 'client-098',
    status: 'todo', priority: 'medium', due_date: '2026-03-28', created_at: '2026-03-18',
  },
  {
    id: 'task-009', title: 'Předat klíče — byt Florenc',
    description: 'Předání klíčů novému majiteli prop-022. Domluvit termín a připravit protokol.',
    assigned_to: 'agent-004', related_property_id: 'prop-022', related_client_id: 'client-074',
    status: 'done', priority: 'medium', due_date: '2026-03-19', created_at: '2026-03-12',
  },
  {
    id: 'task-010', title: 'Inzerát — Penzion Šumava',
    description: 'Vytvořit inzerát na realitní portály pro prop-064. Zdůraznit turistický potenciál.',
    assigned_to: 'agent-008', related_property_id: 'prop-064', related_client_id: null,
    status: 'todo', priority: 'low', due_date: '2026-03-30', created_at: '2026-03-20',
  },
  {
    id: 'task-011', title: 'Kontrola nájemní smlouvy — Smíchov',
    description: 'Nájemní smlouva pro prop-039 expiruje za 2 měsíce. Ověřit zájem nájemce o prodloužení.',
    assigned_to: 'agent-005', related_property_id: 'prop-039', related_client_id: 'client-108',
    status: 'todo', priority: 'medium', due_date: '2026-04-01', created_at: '2026-03-18',
  },
  {
    id: 'task-012', title: 'Marketing report — Q1 2026',
    description: 'Zpracovat přehled marketingových kanálů a jejich efektivity za Q1. Připravit pro poradu.',
    assigned_to: 'agent-002', related_property_id: null, related_client_id: null,
    status: 'todo', priority: 'medium', due_date: '2026-04-05', created_at: '2026-03-20',
  },
  {
    id: 'task-013', title: 'Virtuální prohlídka — Loft Holešovice',
    description: 'Zajistit natočení virtuální prohlídky pro prop-001. Kontaktovat fotografa.',
    assigned_to: 'agent-006', related_property_id: 'prop-001', related_client_id: null,
    status: 'in_progress', priority: 'low', due_date: '2026-03-27', created_at: '2026-03-15',
  },
  {
    id: 'task-014', title: 'Doplnit chybějící data — hromadná akce',
    description: 'Projít všechny nemovitosti s chybějícími údaji o rekonstrukci a kontaktovat vlastníky.',
    assigned_to: 'agent-003', related_property_id: null, related_client_id: null,
    status: 'todo', priority: 'high', due_date: '2026-03-31', created_at: '2026-03-19',
  },
  {
    id: 'task-015', title: 'Onboarding nového agenta',
    description: 'Připravit materiály a provést zaškolení nového kolegy, který nastupuje 1. dubna.',
    assigned_to: 'agent-001', related_property_id: null, related_client_id: null,
    status: 'todo', priority: 'medium', due_date: '2026-03-31', created_at: '2026-03-17',
  },
];
