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

interface WelcomeSectionTranslation {
  title: string
  items: string[]
}

interface QuickCommandTranslation {
  id: string
  name: string
  description: string
  prompt: string
}

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
    historySortLabel: string
    historySortManual: string
    historySortRecent: string
    historySortOldest: string
    historySortAlphabetical: string
    historyMoveUp: string
    historyMoveDown: string
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
    welcomeSections: WelcomeSectionTranslation[]
    composerSuggestions: string[]
    quickCommands: QuickCommandTranslation[]
    quickCommandsTitle: string
    noQuickCommandFound: string
    errorIntro: string
    errorRetry: string
    providersUnavailable: string
    proactiveGreetingText: string
    proactiveGreetingBadge: string
    proactiveGreetingSendDrafts: string
    proactiveGreetingRequestLabel: string
    proactiveGreetingResolveLater: string
    toolLabels: Record<string, string>
    toolSuggestions: Record<string, string[]>
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
    sendEmail: string
    sendingEmail: string
    emailSent: string
    emailGoogleRequired: string
    emailConnectGoogle: string
    emailSendFailed: string
    nextSteps: string
    downloadCsv: string
    records: string
    exportFilename: string
    presentationDefaultTopic: string
    presentationFilename: string
    presentationDownloadFailed: string
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
    monitoringInitialResults: string
    openOnPortal: string
    reportMetrics: Record<string, string>
  }
  properties: {
    title: string
    total: string
    addNew: string
    newTitle: string
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
    name: string
    type: string
    price: string
    area: string
    status: string
    street: string
    city: string
    district: string
    zip: string
    renovationStatus: string
    renovationYear: string
    yearBuilt: string
    totalFloors: string
    pricePerSqm: string
    constructionNotes: string
    description: string
    saveNew: string
    saveEdit: string
    savingNew: string
    savingEdit: string
    validationNameRequired: string
    invalidPrice: string
    validationAreaRequired: string
    validationAddressRequired: string
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
    newRulePrompt: string
    firstMonitoringPrompt: string
    googleIntegrationTitle: string
    googleConnectedDescription: string
    googleDisconnectedDescription: string
    googleConnectedBadge: string
    googleNotConfigured: string
    connectGoogle: string
    yourRules: string
    yourRulesDescription: string
    createdAt: string
    frequencyLabel: string
    propertyTypeLabel: string
    priceRangeLabel: string
    statusLabel: string
    pause: string
    activate: string
    checkNow: string
    createRuleFirst: string
    activateRuleFirst: string
    emptyRules: string
    currentListingsFor: string
    updatedAt: string
    sourceExtensionRequired: string
    liveLoading: string
    openListing: string
    emptyListings: string
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
    retry: string
    loadError: string
    connectionError: string
    unknownError: string
  }
}

const cs: Translations = {
  nav: {
    dashboard: 'Dashboard',
    chat: 'Chat s agentem',
    properties: 'Nemovitosti',
    clients: 'Klienti',
    tasks: 'Úkoly',
    monitoring: 'Monitoring',
    newChat: 'Nový chat',
    history: 'Historie',
    historySortLabel: 'Řazení historie',
    historySortManual: 'Ruční pořadí',
    historySortRecent: 'Nejnovější nahoře',
    historySortOldest: 'Nejstarší nahoře',
    historySortAlphabetical: 'Abecedně',
    historyMoveUp: 'Posunout nahoru',
    historyMoveDown: 'Posunout dolů',
    collapse: 'Sbalit',
    appCaption: 'Back Office',
    userRole: 'Back Office Manager',
  },
  header: {
    notifications: 'Notifikace',
    noNotifications: 'Žádné nové notifikace',
    markAllRead: 'Označit vše jako přečtené',
    unread: 'nepřečtené',
    allRead: 'Vše je přečtené',
    toggleTheme: 'Přepnout motiv',
    toggleMenu: 'Přepnout menu',
    toggleLanguage: 'Přepnout jazyk',
  },
  dashboard: {
    title: 'Dashboard',
    activeProperties: 'Aktivní nemovitosti',
    newLeads: 'Nové leady',
    dealsClosed: 'Uzavřené obchody',
    revenue: 'Tržby tento měsíc',
    totalProperties: 'z celkem',
    vsPreviousMonth: 'vs. minulý měsíc',
    leadsChart: 'Vývoj leadů - posledních 6 měsíců',
    transactionsChart: 'Transakce - posledních 6 měsíců',
    leadsSeries: 'Leady',
    transactionsSeries: 'Transakce',
    valueSeries: 'Hodnota',
    portfolioChart: 'Rozložení portfolia',
    topProperties: 'Top nemovitosti',
    aiRecommendations: 'Agent AI doporučení',
    availableNow: 'Aktuálně v nabídce',
    recommendationMissingData: '{count} nemovitostí s chybějícími údaji',
    recommendationStaleListings: '{count} stagnujících inzerátů (>90 dní)',
    recommendationNewLeads: '{count} nezkontaktovaných leadů',
    recommendationConversion: 'Konverzní poměr: {rate}%',
    recommendationPromptMissingData: 'Ukaž mi nemovitosti s chybějícími údaji a navrhni další kroky',
    recommendationPromptStaleListings: 'Analyzuj stagnující inzeráty starší než 90 dní a navrhni plán oživení',
    recommendationPromptNewLeads: 'Vyhodnoť nezkontaktované leady a navrhni prioritu follow-upu',
    recommendationPromptConversion: 'Vysvětli konverzní poměr leadů a navrhni, jak ho zlepšit',
    recentActivity: 'Poslední aktivita',
    tasks: 'Úkoly',
    quickActions: 'Rychlé akce',
    taskTodo: 'K řešení',
    taskInProgress: 'Probíhá',
    taskDone: 'Hotovo',
    priority: 'Prioritní',
    noUrgentTasks: 'Žádné urgentní úkoly',
    activityCompleted: 'Dokončeno:',
    activityInProgress: 'Probíhá:',
    activityNewTask: 'Nový úkol:',
    feedEmpty: 'Zatím tu není žádná aktivita.',
    badgeLead: 'Lead',
    badgeTransaction: 'Transakce',
    badgeTask: 'Úkol',
    badgeNotification: 'Notifikace',
    leadCreated: 'Nový lead:',
    leadViewingScheduled: 'Potvrzená prohlídka:',
    leadClosedWon: 'Uzavřený lead:',
    leadUpdated: 'Aktualizovaný lead:',
    transactionCompleted: 'Dokončená transakce:',
    transactionPending: 'Rozpracovaná transakce:',
    transactionCancelled: 'Zrušená transakce:',
    quickActionNewClient: 'Nový klient',
    quickActionNewProperty: 'Nová nemovitost',
    quickActionGenerateReport: 'Generovat report',
    quickActionOpenChat: 'Otevřít chat',
    quickActionReportPrompt: 'Generuj týdenní report',
    loadError: 'Chyba při načítání dat:',
  },
  chat: {
    placeholder: 'Napište zprávu...',
    send: 'Odeslat',
    listening: 'Poslouchám...',
    thinking: 'RE:Agent přemýšlí...',
    newChat: 'Nový chat',
    stopRecording: 'Zastavit nahrávání',
    recordVoice: 'Nahrát hlasem',
    welcomeTitle: 'Jak vám mohu pomoci?',
    welcomeDescription: 'Zeptejte se mě na nemovitosti, klienty, statistiky nebo mě nechte připravit report.',
    welcomeSuggestions: [
      'Noví klienti za Q1 2026',
      'Graf leadů za 6 měsíců',
      'Nemovitosti s chybějícími daty',
      'Týdenní report pro vedení',
      'Napiš email zájemci o nemovitost',
      'Monitoring nabídek v Holešovicích',
    ],
    welcomeSections: [
      {
        title: 'Data a analýzy',
        items: [
          'Noví klienti za Q1 2026 - graf podle zdroje',
          'Vývoj leadů a prodejů za 6 měsíců',
          'Analyzuj portfolio nemovitostí',
        ],
      },
      {
        title: 'Komunikace',
        items: [
          'Napiš e-mail zájemci o nemovitost',
          'Shrň výsledky týdne pro vedení',
        ],
      },
      {
        title: 'Správa dat',
        items: [
          'Najdi nemovitosti s chybějícími údaji',
          'Monitoring nabídek v Holešovicích',
          'Porovnej dvě nejdražší nemovitosti',
        ],
      },
    ],
    composerSuggestions: ['Zobraz jako graf', 'Exportuj do CSV', 'Více detailů'],
    quickCommands: [
      { id: 'clients', name: '/klienti', description: 'Zobraz přehled klientů', prompt: 'Zobraz přehled klientů' },
      { id: 'leads', name: '/leady', description: 'Kolik máme nových leadů?', prompt: 'Kolik máme nových leadů?' },
      { id: 'properties', name: '/nemovitosti', description: 'Zobraz dostupné nemovitosti', prompt: 'Zobraz dostupné nemovitosti' },
      { id: 'missing', name: '/chybějící', description: 'Najdi nemovitosti s chybějícími daty', prompt: 'Najdi nemovitosti s chybějícími daty' },
      { id: 'report', name: '/report', description: 'Vygeneruj týdenní report', prompt: 'Vygeneruj týdenní report' },
      { id: 'presentation', name: '/prezentace', description: 'Vytvoř prezentaci se 3 slidy', prompt: 'Vytvoř prezentaci se 3 slidy' },
      { id: 'email', name: '/email', description: 'Napiš e-mail zájemci', prompt: 'Napiš e-mail zájemci' },
      { id: 'monitoring', name: '/monitoring', description: 'Nastav monitoring pro Holešovice', prompt: 'Nastav monitoring pro Holešovice' },
      { id: 'portfolio', name: '/portfolio', description: 'Analyzuj portfolio nemovitostí', prompt: 'Analyzuj portfolio nemovitostí' },
      { id: 'dashboard', name: '/dashboard', description: 'Zobraz aktuální metriky', prompt: 'Zobraz aktuální metriky' },
    ],
    quickCommandsTitle: 'Rychlé příkazy',
    noQuickCommandFound: 'Žádný příkaz nenalezen.',
    errorIntro: 'Omlouvám se, nastala chyba:',
    errorRetry: 'Zkuste to prosím znovu.',
    providersUnavailable: 'AI poskytovatelé jsou momentálně nedostupní. Zkuste to prosím znovu za chvíli.',
    proactiveGreetingText: 'Dobré ráno. Přes noc přišlo několik poptávek na ten loft v Holešovicích. Rovnou jsem zkontroloval tvůj kalendář a připravil do Gmailu koncepty s návrhem volných oken na úterý a středu. Mám je odeslat? A mimochodem, u včerejší nabrané nemovitosti chybí energetický štítek, mám vyžádat doplnění od majitele?',
    proactiveGreetingBadge: 'Připraveno přes noc',
    proactiveGreetingSendDrafts: 'Odeslat koncepty',
    proactiveGreetingRequestLabel: 'Vyžádat štítek',
    proactiveGreetingResolveLater: 'Vyřešit později',
    toolLabels: {
      query_clients: 'Vyhledávání klientů',
      query_leads: 'Analýza leadů',
      query_properties: 'Hledání nemovitostí',
      estimate_property_value: 'Ocenění nemovitosti',
      query_transactions: 'Analýza transakcí',
      find_missing_data: 'Hledání chybějících dat',
      generate_chart: 'Tvorba grafu',
      draft_email: 'Příprava emailu',
      check_calendar: 'Kontrola kalendáře',
      create_task: 'Vytváření úkolu',
      generate_report: 'Generování reportu',
      generate_presentation: 'Příprava prezentace',
      setup_monitoring: 'Nastavení monitoringu',
      get_dashboard_metrics: 'Načítání metrik',
      get_weekly_summary: 'Týdenní přehled',
      compare_properties: 'Porovnání nemovitostí',
      generate_property_description: 'Popis nemovitosti',
      analyze_portfolio: 'Analýza portfolia',
      client_activity_timeline: 'Historie klienta',
      market_overview: 'Přehled trhu',
      web_search: 'Webové vyhledávání',
      search_listings: 'Vyhledávání nabídek',
    },
    toolSuggestions: {
      query_clients: ['Zobraz jako graf', 'Exportuj do CSV', 'Rozděl podle typu'],
      query_leads: ['Graf za 6 měsíců', 'Konverzní poměr', 'Nezkontaktované leady'],
      query_properties: ['Porovnej vybrané', 'Najdi chybějící data', 'Seřaď podle ceny za m²'],
      estimate_property_value: ['Zobraz srovnatelné nabídky', 'Porovnej cenu za m²'],
      find_missing_data: ['Exportuj seznam', 'Přiřaď úkoly k doplnění'],
      generate_chart: ['Jiný typ grafu', 'Přidej do reportu'],
      draft_email: ['Uprav tón', 'Přidej termín prohlídky'],
      generate_report: ['Vytvoř prezentaci', 'Pošli e-mailem'],
      generate_presentation: ['Přidej další slide', 'Stáhnout PPTX'],
      setup_monitoring: ['Nastav další lokality', 'Změň frekvenci'],
    },
    taskCreated: 'Úkol vytvořen',
    dueDate: 'Termín',
    monitoringSet: 'Monitoring nastaven',
    frequency: 'Frekvence',
    frequencies: {
      daily: 'denně',
      weekly: 'týdně',
    },
    report: 'Report',
    highlights: 'Klíčové body',
    actionItems: 'Akční položky',
    presentation: 'Prezentace',
    comparisonTitle: 'Porovnání nemovitostí',
    timelineTitle: 'Historie klienta',
    noTimeline: 'Zatím nejsou k dispozici žádné události.',
    timelineLead: 'Lead',
    timelineTransaction: 'Transakce',
    timelineTask: 'Úkol',
    slides: 'snímků',
    slide: 'Snímek',
    moreSlides: 'dalších',
    downloadPptx: 'Stáhnout PPTX',
    emailDraft: 'Návrh e-mailu',
    to: 'Komu',
    subject: 'Předmět',
    copy: 'Kopírovat',
    copied: 'Zkopírováno',
    edit: 'Upravit',
    done: 'Hotovo',
    sendEmail: 'Odeslat e-mail',
    sendingEmail: 'Odesílám...',
    emailSent: 'E-mail byl odeslán.',
    emailGoogleRequired: 'Pro odesílání e-mailu propojte Google účet.',
    emailConnectGoogle: 'Propojit Google účet',
    emailSendFailed: 'Odeslání e-mailu selhalo. Zkuste to znovu.',
    nextSteps: 'Další kroky',
    downloadCsv: 'Stáhnout CSV',
    records: 'záznamů',
    exportFilename: 'export',
    presentationDefaultTopic: 'RE:Agent report',
    presentationFilename: 're-agent-report',
    presentationDownloadFailed: 'Stažení prezentace selhalo. Zkuste to znovu.',
    chartLeadsSeries: 'Leady',
    chartSalesSeries: 'Prodeje',
    monitoringLocation: 'Lokalita',
    monitoringPropertyType: 'Typ',
    monitoringPriceRange: 'Cenové rozpětí',
    monitoringStatus: 'Status',
    monitoringNextCheck: 'Další kontrola',
    monitoringAllTypes: 'Všechny typy',
    monitoringActive: 'aktivní',
    monitoringNoPriceLimit: 'Bez cenového omezení',
    monitoringConfirmation: 'Monitoring nastaven. Budete informováni o nových nabídkách.',
    monitoringInitialResults: 'Aktuální nabídky z portálů',
    openOnPortal: 'Otevřít na portálu',
    reportMetrics: {
      revenue: 'Tržby',
      commission: 'Provize',
      deals_closed: 'Uzavřené obchody',
      new_leads: 'Nové leady',
      new_clients: 'Noví klienti',
      viewings_scheduled: 'Prohlídky',
      pending_deals: 'Rozpracované obchody',
      pending_value: 'Hodnota rozpracovaných',
      avg_deal_size: 'Průměrná hodnota',
      total_revenue: 'Tržby',
      total_commission: 'Provize',
    },
  },
  properties: {
    title: 'Nemovitosti',
    total: 'nemovitosti',
    addNew: 'Přidat nemovitost',
    newTitle: 'Nová nemovitost',
    search: 'Hledat nemovitosti...',
    allStatuses: 'Všechny stavy',
    allTypes: 'Všechny typy',
    allCities: 'Všechna města',
    edit: 'Upravit',
    detail: 'Detail',
    keyFacts: 'Klíčové informace',
    owner: 'Vlastník',
    ownerInfo: 'Informace o vlastníkovi',
    ownerMissing: 'Vlastník nebyl nalezen',
    map: 'Mapa lokality',
    addressLabel: 'Adresa',
    contactOwner: 'Kontaktovat vlastníka',
    compare: 'Porovnat',
    contactOwnerPrompt: 'Napiš email vlastníkovi nemovitosti {name}',
    comparePrompt: 'Porovnej nemovitost {name} s podobnými',
    editTitle: 'Upravit nemovitost',
    noResults: 'Žádné nemovitosti nenalezeny',
    noResultsHint: 'Zkuste upravit filtry nebo vyhledávací dotaz',
    name: 'Název nemovitosti',
    type: 'Typ',
    price: 'Cena',
    area: 'Plocha',
    status: 'Stav',
    street: 'Ulice',
    city: 'Město',
    district: 'Městská část',
    zip: 'PSČ',
    renovationStatus: 'Stav rekonstrukce',
    renovationYear: 'Rok rekonstrukce',
    yearBuilt: 'Rok výstavby',
    totalFloors: 'Celkem pater',
    pricePerSqm: 'Cena za m²',
    constructionNotes: 'Stavební poznámky',
    description: 'Popis',
    saveNew: 'Vytvořit nemovitost',
    saveEdit: 'Uložit změny',
    savingNew: 'Vytvářím nemovitost...',
    savingEdit: 'Ukládám změny...',
    validationNameRequired: 'Zadejte název nemovitosti.',
    invalidPrice: 'Cena musí být kladné číslo.',
    validationAreaRequired: 'Plocha musí být kladné číslo.',
    validationAddressRequired: 'Vyplňte ulici, město a městskou část.',
    unspecified: 'Neuvedeno',
    rental: 'Pronájem',
    missingData: 's chybějícími daty',
    missingDataShort: 'Chybějící data',
    perMonth: '/ měsíc',
    rooms: 'pokoje',
    floor: 'patro',
    typeLabels: {
      apartment: 'Byt',
      house: 'Dům',
      land: 'Pozemek',
      commercial: 'Komerce',
      office: 'Kancelář',
    },
    statusLabels: {
      available: 'Volná',
      reserved: 'Rezervovaná',
      sold: 'Prodaná',
      rented: 'Pronajatá',
    },
    renovationLabels: {
      original: 'Původní stav',
      partial: 'Částečná rekonstrukce',
      full: 'Kompletní rekonstrukce',
    },
    pricePlaceholder: '8500000',
    renovationYearPlaceholder: 'Například 2022',
    constructionNotesPlaceholder: 'Například cihlová stavba, nové rozvody, původní podlahy...',
    descriptionPlaceholder: 'Doplňte popis nemovitosti...',
  },
  clients: {
    title: 'Klienti',
    total: 'klientů celkem',
    active: 'aktivních',
    search: 'Hledat klienty...',
    addNew: 'Nový klient',
    newTitle: 'Nový klient',
    editTitle: 'Upravit klienta',
    deleteTitle: 'Smazat klienta',
    confirmDelete: 'Opravdu smazat klienta',
    name: 'Jméno',
    email: 'E-mail',
    phone: 'Telefon',
    type: 'Typ',
    source: 'Zdroj',
    status: 'Stav',
    notes: 'Poznámky',
    assignedAgent: 'Přiřazený agent',
    createdAt: 'Přidán',
    noResults: 'Žádní klienti nenalezeni',
    noResultsHint: 'Zkuste upravit filtry',
    allStatuses: 'Všechny stavy',
    allTypes: 'Všechny typy',
    saveNew: 'Vytvořit klienta',
    saveEdit: 'Uložit změny',
    savingNew: 'Vytvářím klienta...',
    savingEdit: 'Ukládám změny...',
    validationNameRequired: 'Zadejte jméno klienta.',
    validationEmailRequired: 'Zadejte e-mail klienta.',
    validationEmailInvalid: 'E-mail nemá správný formát.',
    placeholders: {
      name: 'Například Jan Novák',
      email: 'jan.novak@email.cz',
      phone: '+420 777 123 456',
      notes: 'Poznámky ke klientovi...',
    },
    typeLabels: {
      buyer: 'Kupující',
      seller: 'Prodávající',
      investor: 'Investor',
      tenant: 'Nájemník',
    },
    sourceLabels: {
      website: 'Web',
      referral: 'Doporučení',
      sreality: 'Sreality',
      bezrealitky: 'Bezrealitky',
      instagram: 'Instagram',
      facebook: 'Facebook',
      cold_call: 'Cold call',
      walk_in: 'Walk-in',
      other: 'Jiné',
    },
    statusLabels: {
      active: 'Aktivní',
      inactive: 'Neaktivní',
      closed: 'Uzavřený',
    },
  },
  tasks: {
    title: 'Úkoly',
    total: 'úkolů celkem',
    addNew: 'Nový úkol',
    newTitle: 'Nový úkol',
    editTitle: 'Upravit úkol',
    deleteTitle: 'Smazat úkol',
    confirmDelete: 'Opravdu smazat úkol',
    todo: 'K provedení',
    inProgress: 'Probíhá',
    done: 'Hotovo',
    noTasks: 'Žádné úkoly',
    urgent: 'urgentních',
    overdue: 'po termínu',
    taskTitle: 'Název úkolu',
    description: 'Popis',
    assignedTo: 'Přiřadit agentovi',
    assignedPrefix: 'Řeší:',
    priority: 'Priorita',
    dueDate: 'Termín splnění',
    status: 'Stav',
    relatedProperty: 'Související nemovitost',
    relatedClient: 'Související klient',
    noRelation: 'Bez vazby',
    saveNew: 'Vytvořit úkol',
    saveEdit: 'Uložit změny',
    savingNew: 'Vytvářím úkol...',
    savingEdit: 'Ukládám změny...',
    validationTitleRequired: 'Zadejte název úkolu.',
    validationDueDateRequired: 'Vyberte termín splnění.',
    moveToInProgress: 'Přesunout do sloupce Probíhá',
    markDone: 'Označit jako hotové',
    overdueLabel: 'Po termínu',
    placeholderTitle: 'Například Doplnit chybějící data',
    placeholderDescription: 'Co je potřeba udělat?',
    priorities: {
      low: 'Nízká',
      medium: 'Střední',
      high: 'Vysoká',
      urgent: 'Urgentní',
    },
    statusLabels: {
      todo: 'K provedení',
      in_progress: 'Probíhá',
      done: 'Hotovo',
    },
  },
  monitoring: {
    title: 'Monitoring',
    description: 'Sledujte trh v reálném čase. Pravidla monitoringu nastavíte přes chat s agentem.',
    newRule: 'Nové pravidlo',
    howItWorks: 'Jak to funguje',
    howItWorksText: 'Popište agentovi, co chcete sledovat - lokalitu, typ nemovitosti, cenové rozmezí nebo počet pokojů. Agent nastaví monitoring a bude vás informovat o nových nabídkách.',
    quickActions: 'Rychlé akce',
    exampleRules: 'Ukázková pravidla',
    exampleRulesNote: 'Tato pravidla jsou jen ukázková',
    firstMonitoringTitle: 'Nastavte svůj první monitoring',
    firstMonitoringText: 'Řekněte agentovi, jaký trh chcete sledovat, a my se postaráme o zbytek.',
    startChat: 'Spustit chat',
    active: 'Aktivní',
    paused: 'Pozastaveno',
    quickPrompts: [
      'Monitoring nabídek v Holešovicích',
      'Sleduj byty 2+1 v Praze do 6 mil',
      'Upozorni na nové domy v Brně',
      'Monitoring komerčních prostor Praha 2',
    ],
    newRulePrompt: 'Nastav nový monitoring nemovitostí',
    firstMonitoringPrompt: 'Nastav monitoring nových nabídek v Praze',
    googleIntegrationTitle: 'Google integrace',
    googleConnectedDescription: 'Google Calendar je připojen a Gmail drafty i odesílání jsou k dispozici.',
    googleDisconnectedDescription: 'Propojte Google pro práci s reálným kalendářem a Gmailem.',
    googleConnectedBadge: 'Google Calendar a Gmail jsou připojené',
    googleNotConfigured: 'Google OAuth není nakonfigurován',
    connectGoogle: 'Propojit Google účet',
    yourRules: 'Vaše pravidla monitoringu',
    yourRulesDescription: 'Pravidla vytvořená přes chat s agentem se zobrazují tady.',
    createdAt: 'Vytvořeno',
    frequencyLabel: 'Frekvence',
    propertyTypeLabel: 'Typ nemovitosti',
    priceRangeLabel: 'Cenové rozpětí',
    statusLabel: 'Status',
    pause: 'Pozastavit',
    activate: 'Aktivovat',
    checkNow: 'Zkontrolovat nyní',
    createRuleFirst: 'Nejprve si v chatu vytvořte pravidlo monitoringu.',
    activateRuleFirst: 'Pro spuštění kontroly aktivujte některé pravidlo.',
    emptyRules: 'Zatím nemáte vytvořená žádná pravidla monitoringu. Spusťte je přes chat a objeví se tady.',
    currentListingsFor: 'Aktuální nabídky pro {location}',
    updatedAt: 'Aktualizováno',
    sourceExtensionRequired: 'vyžaduje rozšíření',
    liveLoading: 'Načítám aktuální nabídky...',
    openListing: 'Otevřít inzerát',
    emptyListings: 'Pro tuto kontrolu nebyly nalezeny žádné nabídky.',
    frequencies: {
      daily: 'Denně',
      weekly: 'Týdně',
    },
    propertyTypeLabels: {
      apartment: 'Byty',
      house: 'Domy',
      land: 'Pozemky',
      commercial: 'Komerce',
      office: 'Kanceláře',
    },
    fromPrice: 'od',
    toPrice: 'do',
    minRooms: 'min.',
    maxRooms: 'max.',
  },
  common: {
    save: 'Uložit',
    cancel: 'Zrušit',
    confirm: 'Potvrdit',
    confirmation: 'Potvrzení',
    close: 'Zavřít',
    download: 'Stáhnout',
    export: 'Export',
    loading: 'Načítám...',
    noData: 'Žádná data',
    actions: 'Akce',
    parameter: 'Parametr',
    create: 'Vytvořit',
    edit: 'Upravit',
    delete: 'Smazat',
    retry: 'Zkusit znovu',
    loadError: 'Chyba při načítání dat.',
    connectionError: 'Chyba připojení. Zkuste to znovu.',
    unknownError: 'Neznámá chyba',
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
    historySortLabel: 'History sorting',
    historySortManual: 'Manual order',
    historySortRecent: 'Newest first',
    historySortOldest: 'Oldest first',
    historySortAlphabetical: 'Alphabetical',
    historyMoveUp: 'Move up',
    historyMoveDown: 'Move down',
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
      'Set monitoring for listings in Holešovice',
    ],
    welcomeSections: [
      {
        title: 'Data & Analytics',
        items: [
          'New clients in Q1 2026 - chart by source',
          'Lead and sales trend for 6 months',
          'Analyze the property portfolio',
        ],
      },
      {
        title: 'Communication',
        items: [
          'Write an email to a property lead',
          'Summarize this week for leadership',
        ],
      },
      {
        title: 'Data Management',
        items: [
          'Properties with missing data',
          'Set up listing monitoring in Holešovice',
          'Compare the two most expensive properties',
        ],
      },
    ],
    composerSuggestions: ['Show as chart', 'Export to CSV', 'More details'],
    quickCommands: [
      { id: 'clients', name: '/clients', description: 'Show client overview', prompt: 'Show client overview' },
      { id: 'leads', name: '/leads', description: 'How many new leads do we have?', prompt: 'How many new leads do we have?' },
      { id: 'properties', name: '/properties', description: 'Show available properties', prompt: 'Show available properties' },
      { id: 'missing', name: '/missing', description: 'Find properties with missing data', prompt: 'Find properties with missing data' },
      { id: 'report', name: '/report', description: 'Generate a weekly report', prompt: 'Generate a weekly report' },
      { id: 'presentation', name: '/presentation', description: 'Create a 3-slide presentation', prompt: 'Create a 3-slide presentation' },
      { id: 'email', name: '/email', description: 'Write an email to a prospect', prompt: 'Write an email to a prospect' },
      { id: 'monitoring', name: '/monitoring', description: 'Set up monitoring for Holešovice', prompt: 'Set up monitoring for Holešovice' },
      { id: 'portfolio', name: '/portfolio', description: 'Analyze the property portfolio', prompt: 'Analyze the property portfolio' },
      { id: 'dashboard', name: '/dashboard', description: 'Show current metrics', prompt: 'Show current metrics' },
    ],
    quickCommandsTitle: 'Quick commands',
    noQuickCommandFound: 'No command found.',
    errorIntro: 'Sorry, an error occurred:',
    errorRetry: 'Please try again.',
    providersUnavailable: 'All AI providers are temporarily unavailable. Please try again in a moment.',
    proactiveGreetingText: 'Good morning. Several inquiries came in overnight for that loft in Holešovice. I already checked your calendar and prepared Gmail drafts proposing open slots for Tuesday and Wednesday. Should I send them? Also, the property we onboarded yesterday is missing the energy label. Should I request it from the owner?',
    proactiveGreetingBadge: 'Prepared overnight',
    proactiveGreetingSendDrafts: 'Send drafts',
    proactiveGreetingRequestLabel: 'Request label',
    proactiveGreetingResolveLater: 'Handle later',
    toolLabels: {
      query_clients: 'Client search',
      query_leads: 'Lead analysis',
      query_properties: 'Property search',
      estimate_property_value: 'Property valuation',
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
      web_search: 'Web search',
      search_listings: 'Listing search',
    },
    toolSuggestions: {
      query_clients: ['Show as chart', 'Export to CSV', 'Break down by type'],
      query_leads: ['Chart for 6 months', 'Conversion rate', 'Uncontacted leads'],
      query_properties: ['Compare selected', 'Find missing data', 'Sort by price per m²'],
      estimate_property_value: ['Show comparable listings', 'Compare price per m²'],
      find_missing_data: ['Export list', 'Assign tasks to fill in'],
      generate_chart: ['Try a different chart type', 'Add to report'],
      draft_email: ['Adjust the tone', 'Add a viewing date'],
      generate_report: ['Create a presentation', 'Send by email'],
      generate_presentation: ['Add another slide', 'Download PPTX'],
      setup_monitoring: ['Add more locations', 'Change frequency'],
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
    sendEmail: 'Send email',
    sendingEmail: 'Sending...',
    emailSent: 'Email sent successfully.',
    emailGoogleRequired: 'Connect your Google account to send email.',
    emailConnectGoogle: 'Connect Google account',
    emailSendFailed: 'Sending the email failed. Please try again.',
    nextSteps: 'Next steps',
    downloadCsv: 'Download CSV',
    records: 'records',
    exportFilename: 'export',
    presentationDefaultTopic: 'RE:Agent report',
    presentationFilename: 're-agent-report',
    presentationDownloadFailed: 'Downloading the presentation failed. Please try again.',
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
    monitoringInitialResults: 'Current listings from portals',
    openOnPortal: 'Open on portal',
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
    addNew: 'Add property',
    newTitle: 'New property',
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
    name: 'Property name',
    type: 'Type',
    price: 'Price',
    area: 'Area',
    status: 'Status',
    street: 'Street',
    city: 'City',
    district: 'District',
    zip: 'ZIP code',
    renovationStatus: 'Renovation status',
    renovationYear: 'Renovation year',
    yearBuilt: 'Year built',
    totalFloors: 'Total floors',
    pricePerSqm: 'Price per m²',
    constructionNotes: 'Construction notes',
    description: 'Description',
    saveNew: 'Create property',
    saveEdit: 'Save changes',
    savingNew: 'Creating property...',
    savingEdit: 'Saving changes...',
    validationNameRequired: 'Enter the property name.',
    invalidPrice: 'Price must be a positive number.',
    validationAreaRequired: 'Area must be a positive number.',
    validationAddressRequired: 'Fill in street, city, and district.',
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
      'Monitor listings in Holešovice',
      'Track 2-bedroom apartments in Prague up to 6M CZK',
      'Alert me about new houses in Brno',
      'Monitor commercial spaces in Prague 2',
    ],
    newRulePrompt: 'Set up a new property monitoring rule',
    firstMonitoringPrompt: 'Set up monitoring for new listings in Prague',
    googleIntegrationTitle: 'Google integration',
    googleConnectedDescription: 'Google Calendar is connected and Gmail drafts and sending are available.',
    googleDisconnectedDescription: 'Connect Google to use your real calendar and Gmail.',
    googleConnectedBadge: 'Google Calendar and Gmail are connected',
    googleNotConfigured: 'Google OAuth is not configured',
    connectGoogle: 'Connect Google account',
    yourRules: 'Your monitoring rules',
    yourRulesDescription: 'Rules created through the agent chat appear here.',
    createdAt: 'Created',
    frequencyLabel: 'Frequency',
    propertyTypeLabel: 'Property type',
    priceRangeLabel: 'Price range',
    statusLabel: 'Status',
    pause: 'Pause',
    activate: 'Activate',
    checkNow: 'Check now',
    createRuleFirst: 'Create a monitoring rule in chat first.',
    activateRuleFirst: 'Activate a rule to run a live check.',
    emptyRules: 'No monitoring rules have been created yet. Start from chat and they will appear here.',
    currentListingsFor: 'Current listings for {location}',
    updatedAt: 'Updated',
    sourceExtensionRequired: 'requires extension',
    liveLoading: 'Loading live listings...',
    openListing: 'Open listing',
    emptyListings: 'No listings were found for this check.',
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
    retry: 'Retry',
    loadError: 'Failed to load data.',
    connectionError: 'Connection error. Please try again.',
    unknownError: 'Unknown error',
  },
}

export const translations: Record<AppLanguage, Translations> = {
  cs,
  en,
}
