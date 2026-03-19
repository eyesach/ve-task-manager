import type { Task, Profile, ChecklistItem, TaskPeriod, TaskAssignee, TaskComment, TaskDepartment, CalendarEvent, PrintRequest } from './types'

export const MOCK_PERIOD: TaskPeriod = {
  id: '00000000-0000-0000-0002-000000000003',
  companyId: '00000000-0000-0000-0000-000000000001',
  name: 'Period 3 (Jan/Feb)',
  startDate: '2026-01-06',
  endDate: '2026-02-27',
  isActive: true,
}

export const MOCK_PROFILES: Profile[] = [
  { id: '00000000-0000-0000-0003-000000000001', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000001', fullName: 'Maya Chen', email: 'maya@siply.ve', role: 'department_lead', jobTitle: 'CEO' },
  { id: '00000000-0000-0000-0003-000000000002', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000001', fullName: 'Jordan Rivera', email: 'jordan@siply.ve', role: 'member', jobTitle: 'COO' },
  { id: '00000000-0000-0000-0003-000000000003', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000002', fullName: 'Alex Kim', email: 'alex@siply.ve', role: 'department_lead', jobTitle: 'CFO' },
  { id: '00000000-0000-0000-0003-000000000004', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000002', fullName: 'Priya Patel', email: 'priya@siply.ve', role: 'member', jobTitle: 'Financial Analyst' },
  { id: '00000000-0000-0000-0003-000000000005', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000003', fullName: 'Sam Torres', email: 'sam@siply.ve', role: 'department_lead', jobTitle: 'VP of Branding & Design' },
  { id: '00000000-0000-0000-0003-000000000006', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000003', fullName: 'Riley Brooks', email: 'riley@siply.ve', role: 'member', jobTitle: 'Graphic Designer' },
  { id: '00000000-0000-0000-0003-000000000007', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000004', fullName: 'Taylor Nguyen', email: 'taylor@siply.ve', role: 'department_lead', jobTitle: 'VP of Digital Operations' },
  { id: '00000000-0000-0000-0003-000000000008', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000004', fullName: 'Casey Johnson', email: 'casey@siply.ve', role: 'member', jobTitle: 'Web Developer' },
  { id: '00000000-0000-0000-0003-000000000009', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000005', fullName: 'Morgan Lee', email: 'morgan@siply.ve', role: 'department_lead', jobTitle: 'CHRO' },
  { id: '00000000-0000-0000-0003-000000000010', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000005', fullName: 'Jamie Garcia', email: 'jamie@siply.ve', role: 'member', jobTitle: 'HR Coordinator' },
  { id: '00000000-0000-0000-0003-000000000011', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000006', fullName: 'Drew Martinez', email: 'drew@siply.ve', role: 'department_lead', jobTitle: 'CMO' },
  { id: '00000000-0000-0000-0003-000000000012', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000006', fullName: 'Avery Singh', email: 'avery@siply.ve', role: 'member', jobTitle: 'Marketing Associate' },
  { id: '00000000-0000-0000-0003-000000000013', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000007', fullName: 'Quinn Wright', email: 'quinn@siply.ve', role: 'department_lead', jobTitle: 'CSO' },
  { id: '00000000-0000-0000-0003-000000000014', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000007', fullName: 'Blake Foster', email: 'blake@siply.ve', role: 'member', jobTitle: 'Sales Associate' },
  { id: '00000000-0000-0000-0003-000000000015', companyId: '00000000-0000-0000-0000-000000000001', departmentId: '00000000-0000-0000-0001-000000000001', fullName: 'Ms. Thompson', email: 'thompson@tustin.k12.ca.us', role: 'teacher' },
]

export const MOCK_TASKS: Task[] = [
  // Administration tasks
  {
    id: 't1', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000001',
    taskCode: 'AD 3.1', title: 'Department Meeting and Task Assignment',
    description: '<p>Hold department meeting to review <strong>Period 3 tasks</strong>. Assign all tasks to team members with deadlines.</p><ul><li>Review carried-over items from Period 2</li><li>Distribute new task assignments</li><li>Set clear deadlines for each deliverable</li></ul>',
    category: 'department', priority: 'high', status: 'completed',
    dueDate: '2026-01-10', responsibilityNote: 'Department Lead + All Members',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 't2', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000001',
    taskCode: 'AD 3.2', title: 'Company-Wide Progress Report',
    description: '<p>Compile progress reports from all departments. Create <strong>executive summary</strong> for teacher advisor.</p><h2>Requirements</h2><ol><li>Collect status from all <strong>7 departments</strong></li><li>Draft executive summary highlighting key achievements</li><li>Include financial overview from A&amp;F</li><li>Present findings to the full company</li></ol><blockquote><p>This report is reviewed by the teacher advisor before distribution.</p></blockquote>',
    category: 'department', priority: 'high', status: 'in_progress',
    dueDate: '2026-01-31', responsibilityNote: 'Both Chief Officers',
    isOptional: false, isHighPriority: true, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 't3', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000001',
    taskCode: 'AD 3.3', title: 'Board of Directors Meeting Preparation',
    description: '<p>Prepare agenda, financial reports, and department updates for the <strong>Board of Directors</strong> meeting.</p><ul><li>Draft meeting agenda with time allocations</li><li>Compile financial reports from A&amp;F</li><li>Gather department update slides</li></ul>',
    category: 'department', priority: 'normal', status: 'not_started',
    dueDate: '2026-02-14', responsibilityNote: 'CEO + COO',
    isOptional: false, isHighPriority: false, sortOrder: 2,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 't4', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000001',
    taskCode: 'AD 3.4', title: 'Employee Performance Reviews',
    description: 'Conduct mid-year performance reviews with all department leads. Document feedback and improvement plans.',
    category: 'department', priority: 'normal', status: 'not_started',
    dueDate: '2026-02-21', responsibilityNote: 'CEO + HR Lead',
    isOptional: false, isHighPriority: false, sortOrder: 3,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Accounting & Finance tasks
  {
    id: 't5', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000002',
    taskCode: 'AF 3.1', title: 'Monthly Financial Statements',
    description: '<p>Prepare January financial statements including:</p><ol><li><strong>Income Statement</strong> — revenue, expenses, net income</li><li><strong>Balance Sheet</strong> — assets, liabilities, equity</li><li><strong>Cash Flow Statement</strong> — operating, investing, financing activities</li></ol><p>All statements must be exported from <em>QuickBooks</em> and saved to the shared Drive folder.</p>',
    category: 'department', priority: 'high', status: 'in_review',
    dueDate: '2026-01-24', responsibilityNote: 'CFO + Accounting Team',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-22T00:00:00Z',
  },
  {
    id: 't6', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000002',
    taskCode: 'AF 3.2', title: 'Budget Variance Analysis',
    description: 'Compare actual spending against budget. Identify variances and prepare explanations for each department.',
    category: 'department', priority: 'normal', status: 'in_progress',
    dueDate: '2026-02-07', responsibilityNote: 'CFO',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: 't7', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000002',
    taskCode: 'AF 3.3', title: 'QuickBooks Reconciliation',
    description: '<p>Reconcile <strong>all QuickBooks accounts</strong>. Ensure all transactions are properly categorized and documented.</p><h2>Accounts to Reconcile</h2><ul><li>Checking account</li><li>Savings account</li><li>Vendor payments</li></ul><p><strong>Critical:</strong> All uncategorized transactions must be resolved before the reconciliation report is generated.</p>',
    category: 'department', priority: 'critical', status: 'in_progress',
    dueDate: '2026-01-17', responsibilityNote: 'All Team Members',
    isOptional: false, isHighPriority: true, sortOrder: 2,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  },
  // Branding & Design tasks
  {
    id: 't8', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000003',
    taskCode: 'BD 3.1', title: 'Trade Show Booth Design',
    description: '<p>Design booth layout, banners, and promotional materials for the <strong>Regional Trade Show</strong>.</p><h2>Deliverables</h2><ul><li>Booth layout with dimensions (8x10 space)</li><li>2x banner designs (pull-up banners)</li><li>Promotional flyers (front &amp; back)</li><li>Product display cards for each SKU</li></ul><blockquote><p>All designs must follow the Siply brand guide. Final approval required from teacher advisor.</p></blockquote>',
    category: 'department', priority: 'high', status: 'in_progress',
    dueDate: '2026-02-01', responsibilityNote: 'Creative Director + Design Team',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-19T00:00:00Z',
  },
  {
    id: 't9', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000003',
    taskCode: 'BD 3.2', title: 'Social Media Content Calendar',
    description: 'Create February social media content calendar with branded templates and copy.',
    category: 'department', priority: 'normal', status: 'not_started',
    dueDate: '2026-01-28', responsibilityNote: 'Design Team',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Digital Operations tasks
  {
    id: 't10', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000004',
    taskCode: 'DO 3.1', title: 'Website Analytics Report',
    description: 'Generate monthly website analytics. Track visitor engagement, conversion rates, and top pages.',
    category: 'department', priority: 'normal', status: 'completed',
    dueDate: '2026-01-15', responsibilityNote: 'CTO + Web Team',
    isOptional: false, isHighPriority: false, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 't11', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000004',
    taskCode: 'DO 3.2', title: 'E-Commerce Platform Updates',
    description: 'Update product listings, pricing, and promotional banners on the company website.',
    category: 'department', priority: 'high', status: 'in_progress',
    dueDate: '2026-02-07', responsibilityNote: 'Web Team',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z',
  },
  // Human Resources tasks
  {
    id: 't12', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000005',
    taskCode: 'HR 3.1', title: 'Employee Satisfaction Survey',
    description: 'Create and distribute mid-year employee satisfaction survey. Compile results and present findings.',
    category: 'department', priority: 'normal', status: 'in_progress',
    dueDate: '2026-01-31', responsibilityNote: 'HR Lead + All HR Members',
    isOptional: false, isHighPriority: false, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 't13', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000005',
    taskCode: 'HR 3.2', title: 'Training Workshop Series',
    description: 'Organize and deliver professional development workshops for all employees.',
    category: 'department', priority: 'low', status: 'not_started',
    dueDate: '2026-02-14', responsibilityNote: 'HR Team',
    isOptional: true, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Marketing tasks
  {
    id: 't14', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000006',
    taskCode: 'MK 3.1', title: 'Trade Show Marketing Campaign',
    description: '<p>Develop comprehensive marketing campaign for the <strong>Regional Trade Show</strong> including pre-show promotion.</p><h2>Campaign Components</h2><ol><li>Define objectives and <strong>KPIs</strong></li><li>Create social media content calendar (2 weeks pre-show)</li><li>Design email blast template for customer outreach</li><li>Prepare press kit materials</li></ol><p>Coordinate with <em>Branding &amp; Design</em> for all visual materials. Campaign launch must be approved by teacher advisor.</p>',
    category: 'department', priority: 'critical', status: 'in_progress',
    dueDate: '2026-02-01', responsibilityNote: 'CMO + Marketing Team',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-21T00:00:00Z',
  },
  {
    id: 't15', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000006',
    taskCode: 'MK 3.2', title: 'Customer Outreach Program',
    description: 'Launch email marketing campaign to existing and potential customers.',
    category: 'department', priority: 'normal', status: 'not_started',
    dueDate: '2026-02-14', responsibilityNote: 'Marketing Team',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Sales & Product Development tasks
  {
    id: 't16', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000007',
    taskCode: 'SP 3.1', title: 'Product Catalog Update',
    description: 'Update product catalog with new items, pricing, and descriptions for trade show distribution.',
    category: 'department', priority: 'high', status: 'in_review',
    dueDate: '2026-01-28', responsibilityNote: 'Sales Lead + Product Team',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-25T00:00:00Z',
  },
  {
    id: 't17', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000007',
    taskCode: 'SP 3.2', title: 'Sales Forecast Q3',
    description: 'Prepare quarterly sales forecast based on trade show projections and ongoing customer relationships.',
    category: 'department', priority: 'normal', status: 'not_started',
    dueDate: '2026-02-07', responsibilityNote: 'Sales Lead',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Inter-department tasks
  {
    id: 't18', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: null,
    taskCode: 'ID 3.1', title: 'Regional Trade Show Preparation',
    description: '<p>Coordinate all departments for <strong>Regional Trade Show</strong>. Each department has specific deliverables:</p><ul><li><strong>Administration</strong> — Logistics, scheduling, transport</li><li><strong>Accounting</strong> — Budget, cash handling, pricing</li><li><strong>Branding</strong> — Booth design, banners, display cards</li><li><strong>Digital Ops</strong> — Website updates, QR codes</li><li><strong>Marketing</strong> — Pre-show campaign, press kit</li><li><strong>Sales</strong> — Product catalog, pitch decks, demos</li><li><strong>HR</strong> — Staff scheduling, dress code memo</li></ul>',
    category: 'inter_department', priority: 'critical', status: 'in_progress',
    dueDate: '2026-02-08', responsibilityNote: 'All Departments',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-21T00:00:00Z',
  },
  {
    id: 't19', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: null,
    taskCode: 'ID 3.2', title: 'Company Newsletter — February Edition',
    description: 'Create monthly company newsletter with contributions from all departments.',
    category: 'inter_department', priority: 'normal', status: 'not_started',
    dueDate: '2026-02-03', responsibilityNote: 'Marketing Lead, All Dept Leads',
    isOptional: false, isHighPriority: false, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Trade show tasks
  {
    id: 't20', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: null,
    taskCode: 'TS 3.1', title: 'Trade Show Booth Setup Plan',
    description: 'Finalize booth layout, equipment list, and setup schedule for Regional Trade Show.',
    category: 'trade_show', priority: 'high', status: 'in_progress',
    dueDate: '2026-02-05', responsibilityNote: 'COO + Branding Lead',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: 't21', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: null,
    taskCode: 'TS 3.2', title: 'Sales Pitch & Demo Preparation',
    description: 'Prepare and rehearse product demonstrations and sales pitches for trade show visitors.',
    category: 'trade_show', priority: 'high', status: 'not_started',
    dueDate: '2026-02-06', responsibilityNote: 'Sales Team + Marketing',
    isOptional: false, isHighPriority: true, sortOrder: 1,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
  // Competition task
  {
    id: 't22', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: null,
    taskCode: 'CP 3.1', title: 'Business Plan Competition Submission',
    description: '<p>Finalize and submit business plan for the <strong>VE Business Plan Competition</strong>.</p><h2>Required Sections</h2><ol><li>Executive Summary</li><li>Company Overview &amp; Mission</li><li>Market Analysis</li><li>Marketing Plan</li><li>Operations Plan</li><li>Financial Projections (3-year)</li><li>Appendices</li></ol><p>The team must complete <strong>3 practice presentation rounds</strong> before the final submission. Each round requires teacher observation.</p>',
    category: 'competition', priority: 'critical', status: 'in_progress',
    dueDate: '2026-02-15', responsibilityNote: 'CEO + CFO + All Dept Leads',
    isOptional: false, isHighPriority: true, sortOrder: 0,
    createdAt: '2026-01-06T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z',
  },
  // Carried over task
  {
    id: 't23', companyId: '00000000-0000-0000-0000-000000000001', taskPeriodId: '00000000-0000-0000-0002-000000000003', departmentId: '00000000-0000-0000-0001-000000000006',
    taskCode: 'MK 2.4', title: 'Brand Style Guide Finalization',
    description: 'Complete and distribute the official Siply brand style guide to all departments.',
    category: 'department', priority: 'normal', status: 'carried_over',
    dueDate: '2026-01-15', responsibilityNote: 'CMO + Branding Lead',
    isOptional: false, isHighPriority: false, sortOrder: 2, carriedFromPeriod: '00000000-0000-0000-0002-000000000002',
    createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-01-06T00:00:00Z',
  },
]

export const MOCK_ASSIGNEES: TaskAssignee[] = [
  { id: 'a1', taskId: 't1', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a2', taskId: 't1', profileId: '00000000-0000-0000-0003-000000000002', isPrimary: false },
  { id: 'a3', taskId: 't2', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a4', taskId: 't2', profileId: '00000000-0000-0000-0003-000000000002', isPrimary: true },
  { id: 'a5', taskId: 't3', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a6', taskId: 't4', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a7', taskId: 't4', profileId: '00000000-0000-0000-0003-000000000009', isPrimary: true },
  { id: 'a8', taskId: 't5', profileId: '00000000-0000-0000-0003-000000000003', isPrimary: true },
  { id: 'a9', taskId: 't5', profileId: '00000000-0000-0000-0003-000000000004', isPrimary: false },
  { id: 'a10', taskId: 't6', profileId: '00000000-0000-0000-0003-000000000003', isPrimary: true },
  { id: 'a11', taskId: 't7', profileId: '00000000-0000-0000-0003-000000000003', isPrimary: true },
  { id: 'a12', taskId: 't7', profileId: '00000000-0000-0000-0003-000000000004', isPrimary: false },
  { id: 'a13', taskId: 't8', profileId: '00000000-0000-0000-0003-000000000005', isPrimary: true },
  { id: 'a14', taskId: 't8', profileId: '00000000-0000-0000-0003-000000000006', isPrimary: false },
  { id: 'a15', taskId: 't9', profileId: '00000000-0000-0000-0003-000000000006', isPrimary: true },
  { id: 'a16', taskId: 't10', profileId: '00000000-0000-0000-0003-000000000007', isPrimary: true },
  { id: 'a17', taskId: 't11', profileId: '00000000-0000-0000-0003-000000000007', isPrimary: true },
  { id: 'a18', taskId: 't11', profileId: '00000000-0000-0000-0003-000000000008', isPrimary: false },
  { id: 'a19', taskId: 't12', profileId: '00000000-0000-0000-0003-000000000009', isPrimary: true },
  { id: 'a20', taskId: 't12', profileId: '00000000-0000-0000-0003-000000000010', isPrimary: false },
  { id: 'a21', taskId: 't13', profileId: '00000000-0000-0000-0003-000000000010', isPrimary: true },
  { id: 'a22', taskId: 't14', profileId: '00000000-0000-0000-0003-000000000011', isPrimary: true },
  { id: 'a23', taskId: 't14', profileId: '00000000-0000-0000-0003-000000000012', isPrimary: false },
  { id: 'a24', taskId: 't15', profileId: '00000000-0000-0000-0003-000000000012', isPrimary: true },
  { id: 'a25', taskId: 't16', profileId: '00000000-0000-0000-0003-000000000013', isPrimary: true },
  { id: 'a26', taskId: 't16', profileId: '00000000-0000-0000-0003-000000000014', isPrimary: false },
  { id: 'a27', taskId: 't17', profileId: '00000000-0000-0000-0003-000000000013', isPrimary: true },
  { id: 'a28', taskId: 't18', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a29', taskId: 't18', profileId: '00000000-0000-0000-0003-000000000011', isPrimary: false },
  { id: 'a30', taskId: 't20', profileId: '00000000-0000-0000-0003-000000000002', isPrimary: true },
  { id: 'a31', taskId: 't20', profileId: '00000000-0000-0000-0003-000000000005', isPrimary: false },
  { id: 'a32', taskId: 't22', profileId: '00000000-0000-0000-0003-000000000001', isPrimary: true },
  { id: 'a33', taskId: 't22', profileId: '00000000-0000-0000-0003-000000000003', isPrimary: false },
  { id: 'a34', taskId: 't23', profileId: '00000000-0000-0000-0003-000000000011', isPrimary: true },
  { id: 'a35', taskId: 't23', profileId: '00000000-0000-0000-0003-000000000005', isPrimary: false },
]

export const MOCK_CHECKLISTS: ChecklistItem[] = [
  // AD 3.1 checklist (completed)
  { id: 'c1', taskId: 't1', label: 'Schedule department meeting', requiredEvidence: 'Calendar invite sent', evidenceValue: 'Meeting held 1/8', evidenceType: 'text', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000001', sortOrder: 0 },
  { id: 'c2', taskId: 't1', label: 'Create task assignment spreadsheet', requiredEvidence: 'Doc linked in Drive', evidenceValue: 'https://docs.google.com/spreadsheets/d/abc123', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000001', sortOrder: 1 },
  { id: 'c3', taskId: 't1', label: 'Distribute tasks to all members', requiredEvidence: 'Teacher Observation', evidenceValue: '2026-01-09T14:30:00', evidenceType: 'teacher_observation', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000015', sortOrder: 2 },

  // AD 3.2 checklist (in progress)
  { id: 'c4', taskId: 't2', label: 'Collect department status reports', requiredEvidence: 'All 7 departments submitted', evidenceValue: '5 of 7 received', evidenceType: 'text', isCompleted: false, sortOrder: 0 },
  { id: 'c5', taskId: 't2', label: 'Draft executive summary', requiredEvidence: 'Doc in Drive', evidenceType: 'link', isCompleted: false, sortOrder: 1 },
  { id: 'c6', taskId: 't2', label: 'Review with teacher advisor', requiredEvidence: 'Teacher Observation', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 2 },
  { id: 'c7', taskId: 't2', label: 'Present to company', requiredEvidence: 'Presentation delivered', evidenceType: 'date', isCompleted: false, sortOrder: 3 },

  // AF 3.1 checklist (in review)
  { id: 'c8', taskId: 't5', label: 'Generate income statement', requiredEvidence: 'QuickBooks export', evidenceValue: 'https://docs.google.com/spreadsheets/d/fin1', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000003', sortOrder: 0 },
  { id: 'c9', taskId: 't5', label: 'Generate balance sheet', requiredEvidence: 'QuickBooks export', evidenceValue: 'https://docs.google.com/spreadsheets/d/fin2', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000003', sortOrder: 1 },
  { id: 'c10', taskId: 't5', label: 'Generate cash flow statement', requiredEvidence: 'QuickBooks export', evidenceValue: 'https://docs.google.com/spreadsheets/d/fin3', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000004', sortOrder: 2 },
  { id: 'c11', taskId: 't5', label: 'Teacher review and sign-off', requiredEvidence: 'Teacher Observation', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 3 },

  // AF 3.3 checklist (critical, in progress)
  { id: 'c12', taskId: 't7', label: 'Reconcile checking account', requiredEvidence: 'Screenshot of reconciled account', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000003', sortOrder: 0 },
  { id: 'c13', taskId: 't7', label: 'Reconcile savings account', requiredEvidence: 'Screenshot of reconciled account', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000004', sortOrder: 1 },
  { id: 'c14', taskId: 't7', label: 'Categorize uncategorized transactions', requiredEvidence: 'All transactions categorized', evidenceType: 'text', isCompleted: false, sortOrder: 2 },
  { id: 'c15', taskId: 't7', label: 'Verify vendor payments', requiredEvidence: 'Payment log updated', evidenceType: 'link', isCompleted: false, sortOrder: 3 },
  { id: 'c16', taskId: 't7', label: 'Generate reconciliation report', requiredEvidence: 'Report in Drive', evidenceType: 'link', isCompleted: false, sortOrder: 4 },

  // BD 3.1 checklist
  { id: 'c17', taskId: 't8', label: 'Draft booth layout sketches', requiredEvidence: 'Design file in Drive', evidenceValue: 'https://drive.google.com/file/booth-v2', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000005', sortOrder: 0 },
  { id: 'c18', taskId: 't8', label: 'Design banner artwork', requiredEvidence: 'Print-ready PDF', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000006', sortOrder: 1 },
  { id: 'c19', taskId: 't8', label: 'Create promotional flyers', requiredEvidence: 'Print-ready PDF', evidenceType: 'link', isCompleted: false, sortOrder: 2 },
  { id: 'c20', taskId: 't8', label: 'Design product display cards', requiredEvidence: 'Print-ready PDF', evidenceType: 'link', isCompleted: false, sortOrder: 3 },
  { id: 'c21', taskId: 't8', label: 'Get teacher approval on all designs', requiredEvidence: 'Teacher Observation', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 4 },

  // MK 3.1 checklist (critical, in progress)
  { id: 'c22', taskId: 't14', label: 'Define campaign objectives and KPIs', requiredEvidence: 'Strategy doc', evidenceValue: 'Doc completed', evidenceType: 'text', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000011', sortOrder: 0 },
  { id: 'c23', taskId: 't14', label: 'Create pre-show social media posts', requiredEvidence: 'Content calendar', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000012', sortOrder: 1 },
  { id: 'c24', taskId: 't14', label: 'Design email blast template', requiredEvidence: 'Email template in Drive', evidenceType: 'link', isCompleted: false, sortOrder: 2 },
  { id: 'c25', taskId: 't14', label: 'Prepare press kit materials', requiredEvidence: 'Press kit PDF', evidenceType: 'link', isCompleted: false, sortOrder: 3 },
  { id: 'c26', taskId: 't14', label: 'Coordinate with Branding on materials', requiredEvidence: 'All materials approved', evidenceType: 'text', isCompleted: false, sortOrder: 4 },
  { id: 'c27', taskId: 't14', label: 'Schedule campaign launch', requiredEvidence: 'Launch date confirmed', evidenceType: 'date', isCompleted: false, sortOrder: 5 },
  { id: 'c28', taskId: 't14', label: 'Teacher review of campaign plan', requiredEvidence: 'Teacher Observation', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 6 },

  // SP 3.1 checklist (in review)
  { id: 'c29', taskId: 't16', label: 'Update product descriptions', requiredEvidence: 'All products updated', evidenceValue: 'All 12 products updated', evidenceType: 'text', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000014', sortOrder: 0 },
  { id: 'c30', taskId: 't16', label: 'Update pricing sheet', requiredEvidence: 'Pricing approved by CFO', evidenceValue: 'Approved 1/23', evidenceType: 'text', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000013', sortOrder: 1 },
  { id: 'c31', taskId: 't16', label: 'Product photography', requiredEvidence: 'Photos in Drive', evidenceValue: 'https://drive.google.com/folder/products', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000014', sortOrder: 2 },
  { id: 'c32', taskId: 't16', label: 'Final catalog layout review', requiredEvidence: 'Teacher Observation', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 3 },

  // Business plan competition checklist
  { id: 'c33', taskId: 't22', label: 'Executive summary draft', requiredEvidence: 'Doc in Drive', evidenceValue: 'Draft v2 complete', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000001', sortOrder: 0 },
  { id: 'c34', taskId: 't22', label: 'Financial projections section', requiredEvidence: 'Spreadsheet with 3-year projections', evidenceType: 'link', isCompleted: true, completedBy: '00000000-0000-0000-0003-000000000003', sortOrder: 1 },
  { id: 'c35', taskId: 't22', label: 'Marketing plan section', requiredEvidence: 'Doc in Drive', evidenceType: 'link', isCompleted: false, sortOrder: 2 },
  { id: 'c36', taskId: 't22', label: 'Operations plan section', requiredEvidence: 'Doc in Drive', evidenceType: 'link', isCompleted: false, sortOrder: 3 },
  { id: 'c37', taskId: 't22', label: 'Presentation slides', requiredEvidence: 'Google Slides link', evidenceType: 'link', isCompleted: false, sortOrder: 4 },
  { id: 'c38', taskId: 't22', label: 'Practice presentation (3 rounds)', requiredEvidence: 'Teacher Observation each round', evidenceType: 'teacher_observation', isCompleted: false, sortOrder: 5 },
  { id: 'c39', taskId: 't22', label: 'Final submission', requiredEvidence: 'Submission confirmation', evidenceType: 'text', isCompleted: false, sortOrder: 6 },
]

export const MOCK_COMMENTS: TaskComment[] = [
  { id: 'cm1', taskId: 't2', profileId: '00000000-0000-0000-0003-000000000001', content: 'Still waiting on Branding and Digital Ops status reports. Following up today.', createdAt: '2026-01-20T09:30:00Z' },
  { id: 'cm2', taskId: 't2', profileId: '00000000-0000-0000-0003-000000000002', content: 'I can help chase down the remaining reports.', createdAt: '2026-01-20T10:15:00Z' },
  { id: 'cm3', taskId: 't7', profileId: '00000000-0000-0000-0003-000000000003', content: 'Found 3 uncategorized transactions from December. Checking with vendor.', createdAt: '2026-01-15T14:00:00Z' },
  { id: 'cm4', taskId: 't14', profileId: '00000000-0000-0000-0003-000000000011', content: 'Campaign objectives doc is ready for review. Need BD to confirm banner timeline.', createdAt: '2026-01-21T11:00:00Z' },
  { id: 'cm5', taskId: 't22', profileId: '00000000-0000-0000-0003-000000000001', content: 'Practice round 1 scheduled for Feb 3. Everyone needs to have their sections ready.', createdAt: '2026-01-20T16:00:00Z' },
]

export const MOCK_TASK_DEPARTMENTS: TaskDepartment[] = [
  { id: 'td1', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000001', roleDescription: 'Logistics, scheduling, transport', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td2', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000002', roleDescription: 'Budget, cash handling, pricing', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td3', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000003', roleDescription: 'Booth design, banners, display cards', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td4', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000004', roleDescription: 'Website updates, QR codes', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td5', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000006', roleDescription: 'Pre-show campaign, press kit', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td6', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000007', roleDescription: 'Product catalog, pitch decks, demos', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td7', taskId: 't18', departmentId: '00000000-0000-0000-0001-000000000005', roleDescription: 'Staff scheduling, dress code memo', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td8', taskId: 't19', departmentId: '00000000-0000-0000-0001-000000000006', roleDescription: 'Lead content compilation and layout', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td9', taskId: 't19', departmentId: '00000000-0000-0000-0001-000000000003', roleDescription: 'Newsletter design and branding', createdAt: '2026-01-06T00:00:00Z' },
]

export const MOCK_PERIODS: TaskPeriod[] = [
  { id: '00000000-0000-0000-0002-000000000001', companyId: '00000000-0000-0000-0000-000000000001', name: 'Period 1 (Sep/Oct)', startDate: '2025-09-08', endDate: '2025-10-31', isActive: false },
  { id: '00000000-0000-0000-0002-000000000002', companyId: '00000000-0000-0000-0000-000000000001', name: 'Period 2 (Nov/Dec)', startDate: '2025-11-03', endDate: '2025-12-19', isActive: false },
  MOCK_PERIOD,
]

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'ev1', companyId: '00000000-0000-0000-0000-000000000001', title: 'Regional Trade Show', eventType: 'trade_show', startDate: '2026-02-08', endDate: '2026-02-09', relatedTaskId: 't18', description: 'Annual VE Regional Trade Show at convention center' },
  { id: 'ev2', companyId: '00000000-0000-0000-0000-000000000001', title: 'Business Plan Competition', eventType: 'competition', startDate: '2026-02-15', relatedTaskId: 't22', description: 'VE Business Plan Competition submission deadline' },
  { id: 'ev3', companyId: '00000000-0000-0000-0000-000000000001', title: 'Presidents Day — No School', eventType: 'no_school', startDate: '2026-02-16' },
  { id: 'ev4', companyId: '00000000-0000-0000-0000-000000000001', title: 'Board of Directors Meeting', eventType: 'meeting', startDate: '2026-02-14', relatedTaskId: 't3' },
  { id: 'ev5', companyId: '00000000-0000-0000-0000-000000000001', title: 'Financial Statements Due', eventType: 'deadline', startDate: '2026-01-24', relatedTaskId: 't5' },
  { id: 'ev6', companyId: '00000000-0000-0000-0000-000000000001', title: 'MLK Day — No School', eventType: 'no_school', startDate: '2026-01-19' },
  { id: 'ev7', companyId: '00000000-0000-0000-0000-000000000001', title: 'Practice Presentation Round 1', eventType: 'meeting', startDate: '2026-02-03', relatedTaskId: 't22' },
]

export const MOCK_PRINT_REQUESTS: PrintRequest[] = [
  { id: 'pr1', companyId: '00000000-0000-0000-0000-000000000001', itemName: 'Trade Show Banners (2x)', linkToPdf: 'https://drive.google.com/file/banners', requestedBy: '00000000-0000-0000-0003-000000000005', departmentId: '00000000-0000-0000-0001-000000000003', quantity: 2, sided: 'single', paperType: 'cardstock', status: 'approved', createdAt: '2026-01-20T00:00:00Z' },
  { id: 'pr2', companyId: '00000000-0000-0000-0000-000000000001', itemName: 'Product Catalog Booklets', linkToPdf: 'https://drive.google.com/file/catalog', requestedBy: '00000000-0000-0000-0003-000000000013', departmentId: '00000000-0000-0000-0001-000000000007', quantity: 50, sided: 'double', paperType: 'cardstock', status: 'pending', createdAt: '2026-01-25T00:00:00Z' },
  { id: 'pr3', companyId: '00000000-0000-0000-0000-000000000001', itemName: 'Promotional Flyers', requestedBy: '00000000-0000-0000-0003-000000000006', departmentId: '00000000-0000-0000-0001-000000000003', quantity: 100, sided: 'double', paperType: 'plain', status: 'pending', createdAt: '2026-01-22T00:00:00Z' },
]
