import type {
  ClientSource,
  ClientStatus,
  ClientType,
  MonitoringFrequency,
  PropertyStatus,
  PropertyType,
  RenovationStatus,
  TaskPriority,
  TaskStatus,
} from '@/types'

export type AppLanguage = 'cs' | 'en'

export interface Translations {
  nav: {
    dashboard: string
    chat: string
    properties: string
    clients: string
    tasks: string
    monitoring: string
    newChat: string
    history: string
    collapse: string
    appCaption: string
    userRole: string
  }
  header: {
    notifications: string
    noNotifications: string
    markAllRead: string
    unread: string
    allRead: string
    toggleTheme: string
    toggleMenu: string
    toggleLanguage: string
  }
  dashboard: {
    title: string
    activeProperties: string
    newLeads: string
    dealsClosed: string
    revenue: string
    totalProperties: string
    vsPreviousMonth: string
    leadsChart: string
    transactionsChart: string
    leadsSeries: string
    transactionsSeries: string
    valueSeries: string
    portfolioChart: string
    topProperties: string
    aiRecommendations: string
    availableNow: string
    recommendationMissingData: string
    recommendationStaleListings: string
    recommendationNewLeads: string
    recommendationConversion: string
    recommendationPromptMissingData: string
    recommendationPromptStaleListings: string
    recommendationPromptNewLeads: string
    recommendationPromptConversion: string
    recentActivity: string
    tasks: string
    quickActions: string
    taskTodo: string
    taskInProgress: string
    taskDone: string
    priority: string
    noUrgentTasks: string
    activityCompleted: string
    activityInProgress: string
    activityNewTask: string
    feedEmpty: string
    badgeLead: string
    badgeTransaction: string
    badgeTask: string
    badgeNotification: string
    leadCreated: string
    leadViewingScheduled: string
    leadClosedWon: string
    leadUpdated: string
    transactionCompleted: string
    transactionPending: string
    transactionCancelled: string
    quickActionNewClient: string
    quickActionNewProperty: string
    quickActionGenerateReport: string
    quickActionOpenChat: string
    quickActionReportPrompt: string
    loadError: string
  }
  chat: {
    placeholder: string
    send: string
    listening: string
    thinking: string
    newChat: string
    stopRecording: string
    recordVoice: string
    welcomeTitle: string
    welcomeDescription: string
    welcomeSuggestions: string[]
    composerSuggestions: string[]
    errorIntro: string
    errorRetry: string
    toolLabels: Record<string, string>
    taskCreated: string
    dueDate: string
    monitoringSet: string
    frequency: string
    frequencies: Record<MonitoringFrequency, string>
    report: string
    highlights: string
    actionItems: string
    presentation: string
    comparisonTitle: string
    timelineTitle: string
    noTimeline: string
    timelineLead: string
    timelineTransaction: string
    timelineTask: string
    slides: string
    slide: string
    moreSlides: string
    downloadPptx: string
    emailDraft: string
    to: string
    subject: string
    copy: string
    copied: string
    edit: string
    done: string
    nextSteps: string
    downloadCsv: string
    records: string
    exportFilename: string
    chartLeadsSeries: string
    chartSalesSeries: string
    monitoringLocation: string
    monitoringPropertyType: string
    monitoringPriceRange: string
    monitoringStatus: string
    monitoringNextCheck: string
    monitoringAllTypes: string
    monitoringActive: string
    monitoringNoPriceLimit: string
    monitoringConfirmation: string
    reportMetrics: Record<string, string>
  }
  properties: {
    title: string
    total: string
    search: string
    allStatuses: string
    allTypes: string
    allCities: string
    edit: string
    detail: string
    keyFacts: string
    owner: string
    ownerInfo: string
    ownerMissing: string
    map: string
    addressLabel: string
    contactOwner: string
    compare: string
    contactOwnerPrompt: string
    comparePrompt: string
    editTitle: string
    noResults: string
    noResultsHint: string
    price: string
    area: string
    status: string
    renovationStatus: string
    renovationYear: string
    yearBuilt: string
    pricePerSqm: string
    constructionNotes: string
    description: string
    saveEdit: string
    savingEdit: string
    invalidPrice: string
    unspecified: string
    rental: string
    missingData: string
    missingDataShort: string
    perMonth: string
    rooms: string
    floor: string
    typeLabels: Record<PropertyType, string>
    statusLabels: Record<PropertyStatus, string>
    renovationLabels: Record<RenovationStatus, string>
    pricePlaceholder: string
    renovationYearPlaceholder: string
    constructionNotesPlaceholder: string
    descriptionPlaceholder: string
  }
  clients: {
    title: string
    total: string
    active: string
    search: string
    addNew: string
    newTitle: string
    editTitle: string
    deleteTitle: string
    confirmDelete: string
    name: string
    email: string
    phone: string
    type: string
    source: string
    status: string
    notes: string
    assignedAgent: string
    createdAt: string
    noResults: string
    noResultsHint: string
    allStatuses: string
    allTypes: string
    saveNew: string
    saveEdit: string
    savingNew: string
    savingEdit: string
    validationNameRequired: string
    validationEmailRequired: string
    validationEmailInvalid: string
    placeholders: {
      name: string
      email: string
      phone: string
      notes: string
    }
    typeLabels: Record<ClientType, string>
    sourceLabels: Record<ClientSource, string>
    statusLabels: Record<ClientStatus, string>
  }
  tasks: {
    title: string
    total: string
    addNew: string
    newTitle: string
    editTitle: string
    deleteTitle: string
    confirmDelete: string
    todo: string
    inProgress: string
    done: string
    noTasks: string
    urgent: string
    overdue: string
    taskTitle: string
    description: string
    assignedTo: string
    assignedPrefix: string
    priority: string
    dueDate: string
    status: string
    relatedProperty: string
    relatedClient: string
    noRelation: string
    saveNew: string
    saveEdit: string
    savingNew: string
    savingEdit: string
    validationTitleRequired: string
    validationDueDateRequired: string
    moveToInProgress: string
    markDone: string
    overdueLabel: string
    placeholderTitle: string
    placeholderDescription: string
    priorities: Record<TaskPriority, string>
    statusLabels: Record<TaskStatus, string>
  }
  monitoring: {
    title: string
    description: string
    newRule: string
    howItWorks: string
    howItWorksText: string
    quickActions: string
    exampleRules: string
    exampleRulesNote: string
    firstMonitoringTitle: string
    firstMonitoringText: string
    startChat: string
    active: string
    paused: string
    quickPrompts: string[]
    firstMonitoringPrompt: string
    frequencies: Record<MonitoringFrequency, string>
    propertyTypeLabels: Record<PropertyType, string>
    fromPrice: string
    toPrice: string
    minRooms: string
    maxRooms: string
  }
  common: {
    save: string
    cancel: string
    confirm: string
    confirmation: string
    close: string
    download: string
    export: string
    loading: string
    noData: string
    actions: string
    parameter: string
    create: string
    edit: string
    delete: string
    unknownError: string
  }
}

const cs: Translations = {
  nav: {
    dashboard: 'Dashboard',
    chat: 'Chat s agentem',
    properties: 'Nemovitosti',
    clients: 'Klienti',
    tasks: 'Ukoly',
    monitoring: 'Monitoring',
    newChat: 'Novy chat',
    history: 'Historie',
    collapse: 'Sbalit',
    appCaption: 'Back Office',
    userRole: 'Back Office Manager',
  },
  header: {
    notifications: 'Notifikace',
    noNotifications: 'Zadne nove notifikace',
    markAllRead: 'Oznacit vse jako prectene',
    unread: 'neprectene',
    allRead: 'Vse je prectene',
    toggleTheme: 'Prepnout motiv',
    toggleMenu: 'Prepnout menu',
    toggleLanguage: 'Prepnout jazyk',
  },
  dashboard: {
    title: 'Dashboard',
    activeProperties: 'Aktivni nemovitosti',
    newLeads: 'Nove leady',
    dealsClosed: 'Uzavrene obchody',
    revenue: 'Trzby tento mesic',
    totalProperties: 'z celkem',
    vsPreviousMonth: 'vs. minuly mesic',
    leadsChart: 'Vyvoj leadu - poslednich 6 mesicu',
    transactionsChart: 'Transakce - poslednich 6 mesicu',
    leadsSeries: 'Leady',
    transactionsSeries: 'Transakce',
    valueSeries: 'Hodnota',
    portfolioChart: 'Rozlozeni portfolia',
    topProperties: 'Top nemovitosti',
    aiRecommendations: 'Agent AI doporuceni',
    availableNow: 'Aktualne v nabidce',
    recommendationMissingData: '{count} nemovitosti s chybejicimi udaji',
    recommendationStaleListings: '{count} stagnujicich inzeratu (>90 dni)',
    recommendationNewLeads: '{count} nezkontaktovanych leadu',
    recommendationConversion: 'Konverzni pomer: {rate}%',
    recommendationPromptMissingData: 'Ukaz mi nemovitosti s chybejicimi udaji a navrhni dalsi kroky',
    recommendationPromptStaleListings: 'Analyzuj stagnujici inzeraty starsi nez 90 dni a navrhni plan oziveni',
    recommendationPromptNewLeads: 'Vyhodnot nezkontaktovane leady a navrhni prioritu follow-upu',
    recommendationPromptConversion: 'Vysvetli konverzni pomer leadu a navrhni jak ho zlepsit',
    recentActivity: 'Posledni aktivita',
    tasks: 'Ukoly',
    quickActions: 'Rychle akce',
    taskTodo: 'K reseni',
    taskInProgress: 'Probiha',
    taskDone: 'Hotovo',
    priority: 'Prioritni',
    noUrgentTasks: 'Zadne urgentni ukoly',
    activityCompleted: 'Dokonceno:',
    activityInProgress: 'Probiha:',
    activityNewTask: 'Novy ukol:',
    feedEmpty: 'Zatim tu neni zadna aktivita.',
    badgeLead: 'Lead',
    badgeTransaction: 'Transakce',
    badgeTask: 'Ukol',
    badgeNotification: 'Notifikace',
    leadCreated: 'Novy lead:',
    leadViewingScheduled: 'Potvrzena prohlidka:',
    leadClosedWon: 'Uzavreny lead:',
    leadUpdated: 'Aktualizovany lead:',
    transactionCompleted: 'Dokoncena transakce:',
    transactionPending: 'Rozpracovana transakce:',
    transactionCancelled: 'Zrusena transakce:',
    quickActionNewClient: 'Novy klient',
    quickActionNewProperty: 'Nova nemovitost',
    quickActionGenerateReport: 'Generovat report',
    quickActionOpenChat: 'Otevrit chat',
    quickActionReportPrompt: 'Generuj tydenni report',
    loadError: 'Chyba pri nacitani dat:',
  },
  chat: {
    placeholder: 'Napiste zpravu...',
    send: 'Odeslat',
    listening: 'Posloucham...',
    thinking: 'RE:Agent premysli...',
    newChat: 'Novy chat',
    stopRecording: 'Zastavit nahravani',
    recordVoice: 'Nahrat hlasem',
    welcomeTitle: 'Jak vam mohu pomoci?',
    welcomeDescription: 'Zeptejte se me na nemovitosti, klienty, statistiky nebo me nechte pripravit report.',
    welcomeSuggestions: [
      'Novi klienti za Q1 2026',
      'Graf leadu za 6 mesicu',
      'Nemovitosti s chybejicimi daty',
      'Tydenni report pro vedeni',
      'Napis email zajemci o nemovitost',
      'Monitoring nabidek v Holesovicich',
    ],
    composerSuggestions: ['Zobraz jako graf', 'Exportuj do CSV', 'Vice detailu'],
    errorIntro: 'Omlouvam se, nastala chyba:',
    errorRetry: 'Zkuste to prosim znovu.',
    toolLabels: {
      query_clients: 'Vyhledavani klientu',
      query_leads: 'Analyza leadu',
      query_properties: 'Prohledavani nemovitosti',
      query_transactions: 'Analyza transakci',
      find_missing_data: 'Hledani chybejicich dat',
      generate_chart: 'Tvorba grafu',
      draft_email: 'Priprava emailu',
      check_calendar: 'Kontrola kalendare',
      create_task: 'Vytvareni ukolu',
      generate_report: 'Generovani reportu',
      generate_presentation: 'Priprava prezentace',
      setup_monitoring: 'Nastaveni monitoringu',
      get_dashboard_metrics: 'Nacitani metrik',
      get_weekly_summary: 'Tydenni prehled',
      compare_properties: 'Porovnani nemovitosti',
      generate_property_description: 'Popis nemovitosti',
      analyze_portfolio: 'Analyza portfolia',
      client_activity_timeline: 'Historie klienta',
      market_overview: 'Prehled trhu',
    },
    taskCreated: 'Ukol vytvoren',
    dueDate: 'Termin',
    monitoringSet: 'Monitoring nastaven',
    frequency: 'Frekvence',
    frequencies: {
      daily: 'denne',
      weekly: 'tydne',
    },
    report: 'Report',
    highlights: 'Highlights',
    actionItems: 'Akcni kroky',
    presentation: 'Prezentace',
    comparisonTitle: 'Porovnani nemovitosti',
    timelineTitle: 'Historie klienta',
    noTimeline: 'Zatim nejsou k dispozici zadne udalosti.',
    timelineLead: 'Lead',
    timelineTransaction: 'Transakce',
    timelineTask: 'Ukol',
    slides: 'snimku',
    slide: 'Snimek',
    moreSlides: 'dalsich',
    downloadPptx: 'Stahnout PPTX',
    emailDraft: 'Navrh emailu',
    to: 'Komu',
    subject: 'Predmet',
    copy: 'Kopirovat',
    copied: 'Zkopirovano',
    edit: 'Upravit',
    done: 'Hotovo',
    nextSteps: 'Pokracovat',
    downloadCsv: 'Stahnout CSV',
    records: 'zaznamu',
    exportFilename: 'export',
    chartLeadsSeries: 'Leady',
    chartSalesSeries: 'Prodeje',
    monitoringLocation: 'Lokalita',
    monitoringPropertyType: 'Typ',
    monitoringPriceRange: 'Cenove rozpeti',
    monitoringStatus: 'Status',
    monitoringNextCheck: 'Dalsi kontrola',
    monitoringAllTypes: 'Vsechny typy',
    monitoringActive: 'aktivni',
    monitoringNoPriceLimit: 'Bez cenoveho omezeni',
    monitoringConfirmation: 'Monitoring nastaven. Budete informovani o novych nabidkach.',
    reportMetrics: {
      revenue: 'Trzby',
      commission: 'Provize',
      deals_closed: 'Uzavrene obchody',
      new_leads: 'Nove leady',
      new_clients: 'Novi klienti',
      viewings_scheduled: 'Prohlidky',
      pending_deals: 'Rozpracovane obchody',
      pending_value: 'Hodnota rozpracovanych',
      avg_deal_size: 'Prumerna hodnota',
      total_revenue: 'Trzby',
      total_commission: 'Provize',
    },
  },
  properties: {
    title: 'Nemovitosti',
    total: 'nemovitosti',
    search: 'Hledat nemovitosti...',
    allStatuses: 'Vsechny stavy',
    allTypes: 'Vsechny typy',
    allCities: 'Vsechna mesta',
    edit: 'Upravit',
    detail: 'Detail',
    keyFacts: 'Klicove informace',
    owner: 'Vlastnik',
    ownerInfo: 'Informace o vlastnikovi',
    ownerMissing: 'Vlastnik nebyl nalezen',
    map: 'Mapa lokality',
    addressLabel: 'Adresa',
    contactOwner: 'Kontaktovat vlastnika',
    compare: 'Porovnat',
    contactOwnerPrompt: 'Napis email vlastnikovi nemovitosti {name}',
    comparePrompt: 'Porovnej nemovitost {name} s podobnymi',
    editTitle: 'Upravit nemovitost',
    noResults: 'Zadne nemovitosti nenalezeny',
    noResultsHint: 'Zkuste upravit filtry nebo vyhledavaci dotaz',
    price: 'Cena',
    area: 'Plocha',
    status: 'Stav',
    renovationStatus: 'Stav rekonstrukce',
    renovationYear: 'Rok rekonstrukce',
    yearBuilt: 'Rok vystavby',
    pricePerSqm: 'Cena za m²',
    constructionNotes: 'Stavebni poznamky',
    description: 'Popis',
    saveEdit: 'Ulozit zmeny',
    savingEdit: 'Ukladam zmeny...',
    invalidPrice: 'Cena musi byt kladne cislo.',
    unspecified: 'Neuvedeno',
    rental: 'Pronajem',
    missingData: 's chybejicimi daty',
    missingDataShort: 'Chybejici data',
    perMonth: '/ mesic',
    rooms: 'pokoje',
    floor: 'patro',
    typeLabels: {
      apartment: 'Byt',
      house: 'Dum',
      land: 'Pozemek',
      commercial: 'Komerce',
      office: 'Kancelar',
    },
    statusLabels: {
      available: 'Volna',
      reserved: 'Rezervovana',
      sold: 'Prodana',
      rented: 'Pronajata',
    },
    renovationLabels: {
      original: 'Puvodni stav',
      partial: 'Castecna rekonstrukce',
      full: 'Kompletni rekonstrukce',
    },
    pricePlaceholder: '8500000',
    renovationYearPlaceholder: 'Napriklad 2022',
    constructionNotesPlaceholder: 'Napriklad cihlova stavba, nove rozvody, puvodni podlahy...',
    descriptionPlaceholder: 'Doplnte popis nemovitosti...',
  },
  clients: {
    title: 'Klienti',
    total: 'klientu celkem',
    active: 'aktivnich',
    search: 'Hledat klienty...',
    addNew: 'Novy klient',
    newTitle: 'Novy klient',
    editTitle: 'Upravit klienta',
    deleteTitle: 'Smazat klienta',
    confirmDelete: 'Opravdu smazat klienta',
    name: 'Jmeno',
    email: 'E-mail',
    phone: 'Telefon',
    type: 'Typ',
    source: 'Zdroj',
    status: 'Stav',
    notes: 'Poznamky',
    assignedAgent: 'Prirazeny agent',
    createdAt: 'Pridan',
    noResults: 'Zadni klienti nenalezeni',
    noResultsHint: 'Zkuste upravit filtry',
    allStatuses: 'Vsechny stavy',
    allTypes: 'Vsechny typy',
    saveNew: 'Vytvorit klienta',
    saveEdit: 'Ulozit zmeny',
    savingNew: 'Vytvarim klienta...',
    savingEdit: 'Ukladam zmeny...',
    validationNameRequired: 'Zadejte jmeno klienta.',
    validationEmailRequired: 'Zadejte e-mail klienta.',
    validationEmailInvalid: 'E-mail nema spravny format.',
    placeholders: {
      name: 'Napriklad Jan Novak',
      email: 'jan.novak@email.cz',
      phone: '+420 777 123 456',
      notes: 'Poznamky ke klientovi...',
    },
    typeLabels: {
      buyer: 'Kupujici',
      seller: 'Prodavajici',
      investor: 'Investor',
      tenant: 'Najemnik',
    },
    sourceLabels: {
      website: 'Web',
      referral: 'Doporuceni',
      sreality: 'Sreality',
      bezrealitky: 'Bezrealitky',
      instagram: 'Instagram',
      facebook: 'Facebook',
      cold_call: 'Cold call',
      walk_in: 'Walk-in',
      other: 'Jine',
    },
    statusLabels: {
      active: 'Aktivni',
      inactive: 'Neaktivni',
      closed: 'Uzavreny',
    },
  },
  tasks: {
    title: 'Ukoly',
    total: 'ukolu celkem',
    addNew: 'Novy ukol',
    newTitle: 'Novy ukol',
    editTitle: 'Upravit ukol',
    deleteTitle: 'Smazat ukol',
    confirmDelete: 'Opravdu smazat ukol',
    todo: 'K provedeni',
    inProgress: 'Probiha',
    done: 'Hotovo',
    noTasks: 'Zadne ukoly',
    urgent: 'urgentnich',
    overdue: 'po terminu',
    taskTitle: 'Nazev ukolu',
    description: 'Popis',
    assignedTo: 'Priradit agentovi',
    assignedPrefix: 'Resi:',
    priority: 'Priorita',
    dueDate: 'Termin splneni',
    status: 'Stav',
    relatedProperty: 'Souvisejici nemovitost',
    relatedClient: 'Souvisejici klient',
    noRelation: 'Bez vazby',
    saveNew: 'Vytvorit ukol',
    saveEdit: 'Ulozit zmeny',
    savingNew: 'Vytvarim ukol...',
    savingEdit: 'Ukladam zmeny...',
    validationTitleRequired: 'Zadejte nazev ukolu.',
    validationDueDateRequired: 'Vyberte termin splneni.',
    moveToInProgress: 'Presunout do sloupce Probiha',
    markDone: 'Oznacit jako hotove',
    overdueLabel: 'Po terminu',
    placeholderTitle: 'Napriklad Doplnit chybejici data',
    placeholderDescription: 'Co je potreba udelat?',
    priorities: {
      low: 'Nizka',
      medium: 'Stredni',
      high: 'Vysoka',
      urgent: 'Urgentni',
    },
    statusLabels: {
      todo: 'K provedeni',
      in_progress: 'Probiha',
      done: 'Hotovo',
    },
  },
  monitoring: {
    title: 'Monitoring',
    description: 'Sledujte trh v realnem case. Pravidla monitoringu nastavite pres chat s agentem.',
    newRule: 'Nove pravidlo',
    howItWorks: 'Jak to funguje',
    howItWorksText: 'Popiste agentovi, co chcete sledovat - lokalitu, typ nemovitosti, cenove rozmezi nebo pocet pokoju. Agent nastavi monitoring a bude vas informovat o novych nabidkach.',
    quickActions: 'Rychle akce',
    exampleRules: 'Priklad pravidel',
    exampleRulesNote: 'Tato pravidla jsou jen ukazkova',
    firstMonitoringTitle: 'Nastavte svuj prvni monitoring',
    firstMonitoringText: 'Reknete agentovi, jaky trh chcete sledovat, a my se postarame o zbytek.',
    startChat: 'Spustit chat',
    active: 'Aktivni',
    paused: 'Pozastaveno',
    quickPrompts: [
      'Monitoring nabidek v Holesovicich',
      'Sleduj byty 2+1 v Praze do 6 mil',
      'Upozorni na nove domy v Brne',
      'Monitoring komercnich prostor Praha 2',
    ],
    firstMonitoringPrompt: 'Nastav monitoring novych nabidek v Praze',
    frequencies: {
      daily: 'Denne',
      weekly: 'Tydne',
    },
    propertyTypeLabels: {
      apartment: 'Byty',
      house: 'Domy',
      land: 'Pozemky',
      commercial: 'Komerce',
      office: 'Kancelare',
    },
    fromPrice: 'od',
    toPrice: 'do',
    minRooms: 'min.',
    maxRooms: 'max.',
  },
  common: {
    save: 'Ulozit',
    cancel: 'Zrusit',
    confirm: 'Potvrdit',
    confirmation: 'Potvrzeni',
    close: 'Zavrit',
    download: 'Stahnout',
    export: 'Export',
    loading: 'Nacitam...',
    noData: 'Zadna data',
    actions: 'Akce',
    parameter: 'Parametr',
    create: 'Vytvorit',
    edit: 'Upravit',
    delete: 'Smazat',
    unknownError: 'Neznama chyba',
  },
}

const en: Translations = {
  nav: {
    dashboard: 'Dashboard',
    chat: 'Agent chat',
    properties: 'Properties',
    clients: 'Clients',
    tasks: 'Tasks',
    monitoring: 'Monitoring',
    newChat: 'New chat',
    history: 'History',
    collapse: 'Collapse',
    appCaption: 'Back Office',
    userRole: 'Back Office Manager',
  },
  header: {
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    markAllRead: 'Mark all as read',
    unread: 'unread',
    allRead: 'Everything is read',
    toggleTheme: 'Toggle theme',
    toggleMenu: 'Toggle menu',
    toggleLanguage: 'Toggle language',
  },
  dashboard: {
    title: 'Dashboard',
    activeProperties: 'Active properties',
    newLeads: 'New leads',
    dealsClosed: 'Closed deals',
    revenue: 'Revenue this month',
    totalProperties: 'out of',
    vsPreviousMonth: 'vs previous month',
    leadsChart: 'Lead trend - last 6 months',
    transactionsChart: 'Transactions - last 6 months',
    leadsSeries: 'Leads',
    transactionsSeries: 'Transactions',
    valueSeries: 'Value',
    portfolioChart: 'Portfolio distribution',
    topProperties: 'Top properties',
    aiRecommendations: 'Agent AI recommendations',
    availableNow: 'Currently available',
    recommendationMissingData: '{count} properties with missing data',
    recommendationStaleListings: '{count} stale listings (>90 days)',
    recommendationNewLeads: '{count} uncontacted leads',
    recommendationConversion: 'Conversion rate: {rate}%',
    recommendationPromptMissingData: 'Show me properties with missing data and suggest next steps',
    recommendationPromptStaleListings: 'Analyze stale listings older than 90 days and suggest a recovery plan',
    recommendationPromptNewLeads: 'Evaluate uncontacted leads and suggest follow-up priorities',
    recommendationPromptConversion: 'Explain the lead conversion rate and suggest how to improve it',
    recentActivity: 'Recent activity',
    tasks: 'Tasks',
    quickActions: 'Quick actions',
    taskTodo: 'To do',
    taskInProgress: 'In progress',
    taskDone: 'Done',
    priority: 'Priority',
    noUrgentTasks: 'No urgent tasks',
    activityCompleted: 'Completed:',
    activityInProgress: 'In progress:',
    activityNewTask: 'New task:',
    feedEmpty: 'No activity yet.',
    badgeLead: 'Lead',
    badgeTransaction: 'Transaction',
    badgeTask: 'Task',
    badgeNotification: 'Notification',
    leadCreated: 'New lead:',
    leadViewingScheduled: 'Viewing scheduled:',
    leadClosedWon: 'Won lead:',
    leadUpdated: 'Lead updated:',
    transactionCompleted: 'Transaction completed:',
    transactionPending: 'Transaction in progress:',
    transactionCancelled: 'Transaction cancelled:',
    quickActionNewClient: 'New client',
    quickActionNewProperty: 'New property',
    quickActionGenerateReport: 'Generate report',
    quickActionOpenChat: 'Open chat',
    quickActionReportPrompt: 'Generate a weekly report',
    loadError: 'Failed to load data:',
  },
  chat: {
    placeholder: 'Write a message...',
    send: 'Send',
    listening: 'Listening...',
    thinking: 'RE:Agent is thinking...',
    newChat: 'New chat',
    stopRecording: 'Stop recording',
    recordVoice: 'Record voice',
    welcomeTitle: 'How can I help you?',
    welcomeDescription: 'Ask about properties, clients, stats, or let me prepare a report.',
    welcomeSuggestions: [
      'New clients in Q1 2026',
      'Lead chart for 6 months',
      'Properties with missing data',
      'Weekly management report',
      'Draft an email to a property lead',
      'Set monitoring for listings in Holesovice',
    ],
    composerSuggestions: ['Show as chart', 'Export to CSV', 'More details'],
    errorIntro: 'Sorry, an error occurred:',
    errorRetry: 'Please try again.',
    toolLabels: {
      query_clients: 'Client search',
      query_leads: 'Lead analysis',
      query_properties: 'Property search',
      query_transactions: 'Transaction analysis',
      find_missing_data: 'Missing data scan',
      generate_chart: 'Chart generation',
      draft_email: 'Email draft',
      check_calendar: 'Calendar check',
      create_task: 'Task creation',
      generate_report: 'Report generation',
      generate_presentation: 'Presentation prep',
      setup_monitoring: 'Monitoring setup',
      get_dashboard_metrics: 'Metrics loading',
      get_weekly_summary: 'Weekly summary',
      compare_properties: 'Property comparison',
      generate_property_description: 'Property description',
      analyze_portfolio: 'Portfolio analysis',
      client_activity_timeline: 'Client timeline',
      market_overview: 'Market overview',
    },
    taskCreated: 'Task created',
    dueDate: 'Due date',
    monitoringSet: 'Monitoring enabled',
    frequency: 'Frequency',
    frequencies: {
      daily: 'daily',
      weekly: 'weekly',
    },
    report: 'Report',
    highlights: 'Highlights',
    actionItems: 'Action items',
    presentation: 'Presentation',
    comparisonTitle: 'Property comparison',
    timelineTitle: 'Client timeline',
    noTimeline: 'No events available yet.',
    timelineLead: 'Lead',
    timelineTransaction: 'Transaction',
    timelineTask: 'Task',
    slides: 'slides',
    slide: 'Slide',
    moreSlides: 'more',
    downloadPptx: 'Download PPTX',
    emailDraft: 'Email draft',
    to: 'To',
    subject: 'Subject',
    copy: 'Copy',
    copied: 'Copied',
    edit: 'Edit',
    done: 'Done',
    nextSteps: 'Next steps',
    downloadCsv: 'Download CSV',
    records: 'records',
    exportFilename: 'export',
    chartLeadsSeries: 'Leads',
    chartSalesSeries: 'Sales',
    monitoringLocation: 'Location',
    monitoringPropertyType: 'Property type',
    monitoringPriceRange: 'Price range',
    monitoringStatus: 'Status',
    monitoringNextCheck: 'Next check',
    monitoringAllTypes: 'All property types',
    monitoringActive: 'active',
    monitoringNoPriceLimit: 'No price limit',
    monitoringConfirmation: 'Monitoring is active. You will be informed about new listings.',
    reportMetrics: {
      revenue: 'Revenue',
      commission: 'Commission',
      deals_closed: 'Closed deals',
      new_leads: 'New leads',
      new_clients: 'New clients',
      viewings_scheduled: 'Viewings',
      pending_deals: 'Pending deals',
      pending_value: 'Pending value',
      avg_deal_size: 'Average deal value',
      total_revenue: 'Total revenue',
      total_commission: 'Total commission',
    },
  },
  properties: {
    title: 'Properties',
    total: 'properties',
    search: 'Search properties...',
    allStatuses: 'All statuses',
    allTypes: 'All types',
    allCities: 'All cities',
    edit: 'Edit',
    detail: 'Detail',
    keyFacts: 'Key facts',
    owner: 'Owner',
    ownerInfo: 'Owner information',
    ownerMissing: 'Owner was not found',
    map: 'Location map',
    addressLabel: 'Address',
    contactOwner: 'Contact owner',
    compare: 'Compare',
    contactOwnerPrompt: 'Write an email to the owner of property {name}',
    comparePrompt: 'Compare property {name} with similar ones',
    editTitle: 'Edit property',
    noResults: 'No properties found',
    noResultsHint: 'Try adjusting filters or the search query',
    price: 'Price',
    area: 'Area',
    status: 'Status',
    renovationStatus: 'Renovation status',
    renovationYear: 'Renovation year',
    yearBuilt: 'Year built',
    pricePerSqm: 'Price per m²',
    constructionNotes: 'Construction notes',
    description: 'Description',
    saveEdit: 'Save changes',
    savingEdit: 'Saving changes...',
    invalidPrice: 'Price must be a positive number.',
    unspecified: 'Not specified',
    rental: 'Rental',
    missingData: 'with missing data',
    missingDataShort: 'Missing data',
    perMonth: '/ month',
    rooms: 'rooms',
    floor: 'floor',
    typeLabels: {
      apartment: 'Apartment',
      house: 'House',
      land: 'Land',
      commercial: 'Commercial',
      office: 'Office',
    },
    statusLabels: {
      available: 'Available',
      reserved: 'Reserved',
      sold: 'Sold',
      rented: 'Rented',
    },
    renovationLabels: {
      original: 'Original condition',
      partial: 'Partial renovation',
      full: 'Full renovation',
    },
    pricePlaceholder: '8500000',
    renovationYearPlaceholder: 'For example 2022',
    constructionNotesPlaceholder: 'For example brick building, new wiring, original floors...',
    descriptionPlaceholder: 'Add a property description...',
  },
  clients: {
    title: 'Clients',
    total: 'clients total',
    active: 'active',
    search: 'Search clients...',
    addNew: 'New client',
    newTitle: 'New client',
    editTitle: 'Edit client',
    deleteTitle: 'Delete client',
    confirmDelete: 'Delete client',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    type: 'Type',
    source: 'Source',
    status: 'Status',
    notes: 'Notes',
    assignedAgent: 'Assigned agent',
    createdAt: 'Added',
    noResults: 'No clients found',
    noResultsHint: 'Try adjusting the filters',
    allStatuses: 'All statuses',
    allTypes: 'All types',
    saveNew: 'Create client',
    saveEdit: 'Save changes',
    savingNew: 'Creating client...',
    savingEdit: 'Saving changes...',
    validationNameRequired: 'Enter the client name.',
    validationEmailRequired: 'Enter the client email.',
    validationEmailInvalid: 'Email format is invalid.',
    placeholders: {
      name: 'For example Jan Novak',
      email: 'jan.novak@email.com',
      phone: '+420 777 123 456',
      notes: 'Client notes...',
    },
    typeLabels: {
      buyer: 'Buyer',
      seller: 'Seller',
      investor: 'Investor',
      tenant: 'Tenant',
    },
    sourceLabels: {
      website: 'Website',
      referral: 'Referral',
      sreality: 'Sreality',
      bezrealitky: 'Bezrealitky',
      instagram: 'Instagram',
      facebook: 'Facebook',
      cold_call: 'Cold call',
      walk_in: 'Walk-in',
      other: 'Other',
    },
    statusLabels: {
      active: 'Active',
      inactive: 'Inactive',
      closed: 'Closed',
    },
  },
  tasks: {
    title: 'Tasks',
    total: 'tasks total',
    addNew: 'New task',
    newTitle: 'New task',
    editTitle: 'Edit task',
    deleteTitle: 'Delete task',
    confirmDelete: 'Delete task',
    todo: 'To do',
    inProgress: 'In progress',
    done: 'Done',
    noTasks: 'No tasks',
    urgent: 'urgent',
    overdue: 'overdue',
    taskTitle: 'Task title',
    description: 'Description',
    assignedTo: 'Assign to agent',
    assignedPrefix: 'Owner:',
    priority: 'Priority',
    dueDate: 'Due date',
    status: 'Status',
    relatedProperty: 'Related property',
    relatedClient: 'Related client',
    noRelation: 'No relation',
    saveNew: 'Create task',
    saveEdit: 'Save changes',
    savingNew: 'Creating task...',
    savingEdit: 'Saving changes...',
    validationTitleRequired: 'Enter the task title.',
    validationDueDateRequired: 'Select a due date.',
    moveToInProgress: 'Move to In progress',
    markDone: 'Mark as done',
    overdueLabel: 'Overdue',
    placeholderTitle: 'For example Fill in missing data',
    placeholderDescription: 'What needs to be done?',
    priorities: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    },
    statusLabels: {
      todo: 'To do',
      in_progress: 'In progress',
      done: 'Done',
    },
  },
  monitoring: {
    title: 'Monitoring',
    description: 'Track the market in real time. Monitoring rules are configured through the chat with the agent.',
    newRule: 'New rule',
    howItWorks: 'How it works',
    howItWorksText: 'Tell the agent what to watch - location, property type, price range, or room count. The agent will configure monitoring and keep you informed about new matching listings.',
    quickActions: 'Quick actions',
    exampleRules: 'Example rules',
    exampleRulesNote: 'These rules are illustrative only',
    firstMonitoringTitle: 'Set up your first monitoring rule',
    firstMonitoringText: 'Tell the agent which market you want to follow and we will take care of the rest.',
    startChat: 'Start chat',
    active: 'Active',
    paused: 'Paused',
    quickPrompts: [
      'Monitor listings in Holesovice',
      'Track 2-bedroom apartments in Prague up to 6M CZK',
      'Alert me about new houses in Brno',
      'Monitor commercial spaces in Prague 2',
    ],
    firstMonitoringPrompt: 'Set up monitoring for new listings in Prague',
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
    },
    propertyTypeLabels: {
      apartment: 'Apartments',
      house: 'Houses',
      land: 'Land',
      commercial: 'Commercial',
      office: 'Offices',
    },
    fromPrice: 'from',
    toPrice: 'to',
    minRooms: 'min.',
    maxRooms: 'max.',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    confirmation: 'Confirmation',
    close: 'Close',
    download: 'Download',
    export: 'Export',
    loading: 'Loading...',
    noData: 'No data',
    actions: 'Actions',
    parameter: 'Parameter',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    unknownError: 'Unknown error',
  },
}

export const translations: Record<AppLanguage, Translations> = {
  cs,
  en,
}
