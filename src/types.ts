
export type Stage = 'DISCOVER' | 'UNDERSTAND' | 'PROPOSAL' | 'NEGOTIATING' | 'CLOSED';
export type ViewMode = 'BOARD' | 'CANVAS' | 'CONTACTS' | 'SETTINGS' | 'ANALYTICS';
export type HealthStatus = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
export type UserRole = 'ADMIN' | 'SALES_REP' | 'FINANCE' | 'SALES_OPS' | 'PS_MANAGER' | 'DELIVERY_MANAGER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
export type BuyingRole = 'CHAMPION' | 'ECONOMIC_BUYER' | 'TECHNICAL_EVALUATOR' | 'USER' | 'BLOCKER' | 'COACH' | 'UNKNOWN';

export interface ExchangeRates {
    EUR: number;
    CLP: number;
    MXN: number;
    COP: number;
    [key: string]: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
}

export interface Approval {
  status: ApprovalStatus;
  approverId?: string;
  timestamp?: string;
  comments?: string;
}

// Upgraded from BANT to MEDDPICC for complex B2B sales
export interface MEDDPICC {
  metrics: string; // Quantifiable value (e.g., "Save $50k/yr")
  economicBuyer: string; // Who signs the check?
  decisionCriteria: string; // Technical/Financial requirements
  decisionProcess: string; // Steps to get signature
  paperProcess: string; // Legal/Procurement steps
  identifiedPain: string; // The problem we solve
  champion: string; // Who is selling for us internally?
  competition: string; // Who are we up against?
}

export interface Resource {
  id: string;
  type: 'RECORDING' | 'DOC' | 'EMAIL' | 'MEETING' | 'NOTE';
  title: string;
  url?: string;
  source: 'GMEET' | 'GDRIVE' | 'GMAIL' | 'GCAL' | 'GKEEP';
  date: string;
  summary?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  type: 'EMAIL' | 'CALL' | 'TASK' | 'DOC';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  avatar?: string;
  lastInteraction?: string;
  tags: string[];
  buyingRole: BuyingRole; // New field for Influence Mapping
  aiEnriched?: boolean; 
}

export interface LineItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number;
}

export interface OdooLink {
  salesOrderId: string;
  companyId: string; 
  companyName: string;
  currency: string;
  totalLocalCurrency: number;
  status: 'DRAFT' | 'SENT' | 'PAID';
  url: string;
}

export interface Deal {
  id: string;
  ownerId: string;
  title: string;
  company: string;
  country: string; 
  value: number; // Always in USD
  stage: Stage;
  probability: number;
  contactName: string; 
  contactEmail: string; 
  contactIds: string[]; 
  meddpicc: MEDDPICC; // Replaced bant with meddpicc
  description: string;
  weeklySummary?: string;
  lastSummaryUpdate?: string;
  proposalContent?: string;
  tags: string[];
  lastContact: string;
  resources: Resource[];
  health: HealthStatus;
  daysDormant: number;
  aiNextStep: string;
  pendingActions: ActionItem[];
  // Odoo & Finance Integration
  lineItems: LineItem[];
  odooLink?: OdooLink;
  exchangeRateOverride?: number; // If set, overrides the global rate for this deal
  // Approvals
  approvals: {
    finance: Approval;
    salesOps: Approval;
    ps: Approval;
    delivery: Approval;
  };
}

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'DISCOVER', label: 'Descubrimiento', color: 'bg-purple-100 text-purple-800' },
  { id: 'UNDERSTAND', label: 'Comprensión', color: 'bg-blue-100 text-blue-800' },
  { id: 'PROPOSAL', label: 'Propuesta', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'NEGOTIATING', label: 'Negociación', color: 'bg-orange-100 text-orange-800' },
  { id: 'CLOSED', label: 'Cerrado', color: 'bg-green-100 text-green-800' },
];

export const initialUsers: User[] = [
  { id: 'u1', name: 'Alex Sales', email: 'alex@edvolution.com', role: 'SALES_REP', department: 'Sales', avatar: 'https://picsum.photos/id/100/100' },
  { id: 'u2', name: 'Sarah Finance', email: 'sarah@edvolution.com', role: 'FINANCE', department: 'Finance', avatar: 'https://picsum.photos/id/101/100' },
  { id: 'u3', name: 'Mike Ops', email: 'mike@edvolution.com', role: 'SALES_OPS', department: 'Operations', avatar: 'https://picsum.photos/id/102/100' },
  { id: 'u4', name: 'Jessica PS', email: 'jess@edvolution.com', role: 'PS_MANAGER', department: 'Professional Services', avatar: 'https://picsum.photos/id/103/100' },
  { id: 'u5', name: 'David Delivery', email: 'david@edvolution.com', role: 'DELIVERY_MANAGER', department: 'Delivery', avatar: 'https://picsum.photos/id/104/100' },
  { id: 'u6', name: 'Admin User', email: 'admin@edvolution.com', role: 'ADMIN', department: 'IT', avatar: 'https://picsum.photos/id/105/100' },
];

export const initialContacts: Contact[] = [
  {
    id: 'c1',
    name: 'John Doe',
    role: 'CTO',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1 555-0101',
    linkedin: 'linkedin.com/in/johndoe',
    location: 'San Francisco, CA',
    avatar: 'https://picsum.photos/id/10/200/200',
    lastInteraction: '2 days ago',
    tags: ['Decision Maker', 'Technical'],
    buyingRole: 'ECONOMIC_BUYER',
    aiEnriched: true
  },
  {
    id: 'c2',
    name: 'Sarah Connor',
    role: 'VP Engineering',
    company: 'Acme Corp',
    email: 'sarah@acme.com',
    linkedin: 'linkedin.com/in/sarahc',
    location: 'Austin, TX',
    avatar: 'https://picsum.photos/id/20/200/200',
    lastInteraction: '1 week ago',
    tags: ['Influencer'],
    buyingRole: 'TECHNICAL_EVALUATOR',
    aiEnriched: false
  },
  {
    id: 'c3',
    name: 'Jane Smith',
    role: 'VP Marketing',
    company: 'Globex Inc',
    email: 'jane@globex.com',
    phone: '+1 555-0202',
    location: 'New York, NY',
    avatar: 'https://picsum.photos/id/30/200/200',
    lastInteraction: '3 days ago',
    tags: ['Budget Holder'],
    buyingRole: 'CHAMPION',
    aiEnriched: true
  },
  {
    id: 'c4',
    name: 'Harry Green',
    role: 'CISO',
    company: 'Soylent Corp',
    email: 'h.green@soylent.com',
    linkedin: 'linkedin.com/in/harryg',
    location: 'London, UK',
    avatar: 'https://picsum.photos/id/40/200/200',
    lastInteraction: 'Yesterday',
    tags: ['Blocker', 'Security'],
    buyingRole: 'BLOCKER',
    aiEnriched: true
  },
  {
    id: 'c5',
    name: 'Alice Wesker',
    role: 'Procurement Director',
    company: 'Umbrella Corp',
    email: 'alice@umbrella.com',
    phone: '+1 555-6666',
    location: 'Raccoon City',
    avatar: 'https://picsum.photos/id/50/200/200',
    lastInteraction: '4 hours ago',
    tags: ['Procurement', 'Negotiator'],
    buyingRole: 'ECONOMIC_BUYER',
    aiEnriched: true
  },
  {
    id: 'c6',
    name: 'Miles Dyson',
    role: 'Director of R&D',
    company: 'Cyberdyne',
    email: 'miles@cyberdyne.com',
    location: 'Silicon Valley',
    avatar: 'https://picsum.photos/id/60/200/200',
    lastInteraction: '1 day ago',
    tags: ['Visionary'],
    buyingRole: 'COACH',
    aiEnriched: false
  }
];

export const initialDeals: Deal[] = [
  {
    id: '1',
    ownerId: 'u1',
    title: 'Enterprise Cloud Migration',
    company: 'Acme Corp',
    country: 'United States',
    value: 125000,
    stage: 'UNDERSTAND',
    probability: 40,
    contactName: 'John Doe',
    contactEmail: 'john@acme.com',
    contactIds: ['c1', 'c2'],
    meddpicc: {
      metrics: 'Reduce TCO by 20% ($500k/yr)',
      economicBuyer: 'John Doe (CTO) has signing authority',
      decisionCriteria: 'Security (SOC2), Latency < 20ms, Hybrid support',
      decisionProcess: 'Tech Eval -> Architecture Review -> Board Approval',
      paperProcess: 'Standard MSA, 30 days net',
      identifiedPain: 'Current legacy ERP is crashing during peak loads',
      champion: 'Sarah Connor (VP Eng) is pushing for us',
      competition: 'AWS Direct, Azure'
    },
    description: 'The client is undertaking a major digital transformation initiative. Their legacy ERP system is causing performance bottlenecks and security risks. They aim to migrate to a hybrid cloud architecture. Key drivers are scalability and compliance (SOC2).',
    weeklySummary: '• Meeting with CTO confirmed budget allocation.\n• Architecture team reviewed initial diagrams.\n• Pending: Security compliance questionnaire.',
    lastSummaryUpdate: '2023-10-25',
    tags: ['Cloud', 'Enterprise'],
    lastContact: '2 days ago',
    resources: [
      { id: 'r1', type: 'RECORDING', title: 'Initial Discovery Call', source: 'GMEET', date: '2023-10-20', url: 'https://meet.google.com/abc-defg-hij', summary: 'Discussed timeline and security requirements.' },
      { id: 'r2', type: 'DOC', title: 'Technical Requirements v1', source: 'GDRIVE', date: '2023-10-21', url: '#' }
    ],
    health: 'HEALTHY',
    daysDormant: 2,
    aiNextStep: 'Schedule technical deep dive with architects.',
    pendingActions: [
      { id: 'a1', title: 'Send architecture diagram', type: 'DOC', priority: 'HIGH' },
      { id: 'a2', title: 'Confirm budget cycle', type: 'EMAIL', priority: 'MEDIUM' }
    ],
    lineItems: [
        { id: 'l1', sku: 'SRV-ENT-01', name: 'Enterprise Cloud Server Instance', quantity: 5, unitPrice: 15000, tax: 0 },
        { id: 'l2', sku: 'SVC-MIG-01', name: 'Migration Services (Hours)', quantity: 200, unitPrice: 200, tax: 0 },
        { id: 'l3', sku: 'SUP-247-01', name: '24/7 Premium Support', quantity: 1, unitPrice: 10000, tax: 0 }
    ],
    approvals: {
      finance: { status: 'PENDING' },
      salesOps: { status: 'APPROVED', approverId: 'u3', timestamp: '2023-10-25' },
      ps: { status: 'PENDING' },
      delivery: { status: 'PENDING' }
    }
  },
  {
    id: '2',
    ownerId: 'u1',
    title: 'Q3 Marketing Automation',
    company: 'Globex Inc',
    country: 'United Kingdom',
    value: 45000,
    stage: 'DISCOVER',
    probability: 20,
    contactName: 'Jane Smith',
    contactEmail: 'jane@globex.com',
    contactIds: ['c3'],
    meddpicc: {
      metrics: 'Save 20hrs/week of manual entry',
      economicBuyer: 'TBD',
      decisionCriteria: 'Integration with Salesforce, Ease of use',
      decisionProcess: 'Demo -> Trial -> Purchase',
      paperProcess: 'Credit Card / Online T&C',
      identifiedPain: 'Manual email nurture is error prone',
      champion: 'Jane Smith',
      competition: 'HubSpot, Mailchimp'
    },
    description: 'Client is frustrated with current manual processes for email marketing. Looking for a solution that integrates with their existing CRM to automate nurture sequences.',
    weeklySummary: '• Initial outreach email sent.\n• Received response requesting demo.\n• Competitor analysis notes added.',
    lastSummaryUpdate: '2023-10-24',
    tags: ['Marketing', 'SaaS'],
    lastContact: '1 week ago',
    resources: [
       { id: 'r3', type: 'EMAIL', title: 'Re: Intro / Scheduling', source: 'GMAIL', date: '2023-10-24', summary: 'Jane asked for a demo next Tuesday.' },
       { id: 'r4', type: 'NOTE', title: 'Competitor Analysis', source: 'GKEEP', date: '2023-10-24', summary: 'They are currently using MailChimp and Hubspot.' }
    ],
    health: 'AT_RISK',
    daysDormant: 7,
    aiNextStep: 'Re-engage Jane with competitor comparison deck.',
    pendingActions: [
      { id: 'a3', title: 'Reply to demo request', type: 'EMAIL', priority: 'HIGH', dueDate: 'Today' },
      { id: 'a4', title: 'Upload case study', type: 'DOC', priority: 'LOW' }
    ],
    lineItems: [
        { id: 'l1', sku: 'SAAS-MKT-PRO', name: 'Marketing Pro License (Annual)', quantity: 1, unitPrice: 45000, tax: 20 }
    ],
    approvals: {
      finance: { status: 'PENDING' },
      salesOps: { status: 'PENDING' },
      ps: { status: 'PENDING' },
      delivery: { status: 'PENDING' }
    }
  },
  {
    id: '3',
    ownerId: 'u2',
    title: 'Security Audit 2024',
    company: 'Soylent Corp',
    country: 'Spain',
    value: 15000,
    stage: 'PROPOSAL',
    probability: 70,
    contactName: 'Harry Green',
    contactEmail: 'h.green@soylent.com',
    contactIds: ['c4'],
    meddpicc: {
      metrics: 'Compliance with ISO 27001',
      economicBuyer: 'CFO',
      decisionCriteria: 'Price, Speed',
      decisionProcess: 'Direct Award',
      paperProcess: 'PO',
      identifiedPain: 'Audit due next month',
      champion: 'Harry Green',
      competition: 'None'
    },
    description: 'Routine annual security audit. Includes penetration testing and compliance reporting for ISO 27001.',
    tags: ['Security', 'Service'],
    lastContact: 'Yesterday',
    resources: [],
    health: 'HEALTHY',
    daysDormant: 1,
    aiNextStep: 'Follow up on proposal receipt.',
    pendingActions: [],
    lineItems: [
        { id: 'l1', sku: 'SVC-SEC-AUD', name: 'Security Audit Package', quantity: 1, unitPrice: 15000, tax: 21 }
    ],
    approvals: {
      finance: { status: 'APPROVED', approverId: 'u2', timestamp: '2023-10-26' },
      salesOps: { status: 'APPROVED', approverId: 'u3', timestamp: '2023-10-26' },
      ps: { status: 'PENDING' },
      delivery: { status: 'APPROVED', approverId: 'u5', timestamp: '2023-10-26' }
    }
  },
  {
    id: '4',
    ownerId: 'u1',
    title: '500 User License Deal',
    company: 'Umbrella Corp',
    country: 'Germany',
    value: 500000,
    stage: 'NEGOTIATING',
    probability: 90,
    contactName: 'Alice Wesker',
    contactEmail: 'alice@umbrella.com',
    contactIds: ['c5'],
    meddpicc: {
      metrics: 'Consolidate 4 vendors into 1',
      economicBuyer: 'Board of Directors',
      decisionCriteria: 'Global support, SLA',
      decisionProcess: 'Legal Review',
      paperProcess: 'Custom Contract',
      identifiedPain: 'Fragmented IT landscape',
      champion: 'Alice Wesker',
      competition: 'Oracle, SAP'
    },
    description: 'Large volume license deal for global subsidiaries. Critical strategic account.',
    tags: ['License', 'Global'],
    lastContact: '4 hours ago',
    resources: [],
    health: 'HEALTHY',
    daysDormant: 0,
    aiNextStep: 'Finalize payment terms contract clause.',
    pendingActions: [
      { id: 'a5', title: 'Review redlines from legal', type: 'TASK', priority: 'HIGH' }
    ],
    lineItems: [
        { id: 'l1', sku: 'LIC-ENT-VOL', name: 'Enterprise Volume License', quantity: 500, unitPrice: 1000, tax: 19 }
    ],
    approvals: {
      finance: { status: 'APPROVED' },
      salesOps: { status: 'APPROVED' },
      ps: { status: 'APPROVED' },
      delivery: { status: 'APPROVED' }
    }
  },
  {
    id: '5',
    ownerId: 'u3',
    title: 'AI Consulting Retainer',
    company: 'Cyberdyne',
    country: 'United States',
    value: 200000,
    stage: 'CLOSED',
    probability: 100,
    contactName: 'Miles Dyson',
    contactEmail: 'miles@cyberdyne.com',
    contactIds: ['c6'],
    meddpicc: {
      metrics: 'Develop Skynet V1',
      economicBuyer: 'Miles Dyson',
      decisionCriteria: 'Innovation capability',
      decisionProcess: 'Single Signer',
      paperProcess: 'Completed',
      identifiedPain: 'Need advanced neural nets',
      champion: 'Miles Dyson',
      competition: 'None'
    },
    description: 'Research partnership for advanced AI development.',
    tags: ['AI', 'Consulting'],
    lastContact: '1 day ago',
    resources: [],
    health: 'HEALTHY',
    daysDormant: 1,
    aiNextStep: 'Schedule kickoff meeting.',
    pendingActions: [],
    lineItems: [
        { id: 'l1', sku: 'SVC-AI-RET', name: 'AI Research Retainer (Q4)', quantity: 1, unitPrice: 200000, tax: 0 }
    ],
    approvals: {
      finance: { status: 'APPROVED' },
      salesOps: { status: 'APPROVED' },
      ps: { status: 'APPROVED' },
      delivery: { status: 'APPROVED' }
    }
  }
];
