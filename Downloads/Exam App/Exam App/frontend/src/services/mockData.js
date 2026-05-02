/**
 * Mock data for frontend preview (no backend required)
 */

export const MOCK_USER = {
  id: 1,
  username: 'raj_sharma',
  first_name: 'Raj',
  last_name: 'Sharma',
  email: 'raj@example.com',
  role: 'student',
  exam_type: 'CA',
  exam_level: 'Final',
  phone: '9876543210',
  institute: 'ICAI Study Circle',
};

export const MOCK_ADMIN_USER = {
  id: 2,
  username: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@example.com',
  role: 'admin',
  exam_type: null,
  exam_level: null,
};

export const MOCK_DASHBOARD_STATS = {
  total_submissions: 12,
  evaluated_submissions: 10,
  average_score: 72,
  improvement_streak: 3,
  pending_evaluations: 2,
  score_history: [
    { date: '2026-01-10', score: 52 },
    { date: '2026-01-25', score: 58 },
    { date: '2026-02-05', score: 63 },
    { date: '2026-02-18', score: 68 },
    { date: '2026-03-01', score: 72 },
  ],
};

export const MOCK_GAMIFICATION = {
  journey_text:
    'You\'ve been consistently improving! Your last 3 attempts show an upward trend. Keep up the momentum and aim for the 75% milestone.',
  achievements: [
    { name: 'First Attempt', icon: '🎯' },
    { name: 'Streak Starter', icon: '🔥' },
    { name: 'Consistent Learner', icon: '📚' },
    { name: '60% Club', icon: '⭐' },
  ],
  journey: [
    { score: 52, date: '2026-01-10' },
    { score: 58, date: '2026-01-25' },
    { score: 63, date: '2026-02-05' },
    { score: 68, date: '2026-02-18' },
    { score: 72, date: '2026-03-01' },
  ],
  improvementStreak: 3,
};

export const MOCK_SUBJECTS = [
  { id: 1, name: 'Strategic Financial Management', code: 'SFM', exam_type: 'CA', exam_level: 'Final' },
  { id: 2, name: 'Advanced Auditing & Professional Ethics', code: 'AAPE', exam_type: 'CA', exam_level: 'Final' },
  { id: 3, name: 'Corporate & Economic Laws', code: 'CEL', exam_type: 'CA', exam_level: 'Final' },
  { id: 4, name: 'Financial Reporting', code: 'FR', exam_type: 'CA', exam_level: 'Final' },
  { id: 5, name: 'Direct Tax Laws & International Taxation', code: 'DT', exam_type: 'CA', exam_level: 'Final' },
  { id: 6, name: 'Indirect Tax Laws', code: 'IDT', exam_type: 'CA', exam_level: 'Final' },
];

export const MOCK_PAPERS = [
  {
    id: 1,
    title: 'CA Final SFM - November 2025',
    subject: { id: 1, name: 'Strategic Financial Management' },
    attempt_type: 'past_paper',
    total_marks: 100,
    duration: 180,
    exam_session: 'November 2025',
    description: 'ICAI Past Exam Paper for Strategic Financial Management. Covers derivatives, forex, portfolio management and capital budgeting.',
    is_published: true,
  },
  {
    id: 2,
    title: 'CA Final FR - November 2025',
    subject: { id: 4, name: 'Financial Reporting' },
    attempt_type: 'past_paper',
    total_marks: 100,
    duration: 180,
    exam_session: 'November 2025',
    description: 'ICAI Past Exam Paper for Financial Reporting. Covers Ind AS, consolidated financial statements and valuation.',
    is_published: true,
  },
  {
    id: 3,
    title: 'SFM Mock Test - Series 1',
    subject: { id: 1, name: 'Strategic Financial Management' },
    attempt_type: 'mock',
    total_marks: 100,
    duration: 180,
    exam_session: 'Mock 2026',
    description: 'Full-length mock test for SFM covering all high-weightage topics.',
    is_published: true,
  },
  {
    id: 4,
    title: 'CA Final DT - May 2025 RTP',
    subject: { id: 5, name: 'Direct Tax Laws & International Taxation' },
    attempt_type: 'rtp',
    total_marks: 100,
    duration: 180,
    exam_session: 'May 2025',
    description: 'Revision Test Paper for Direct Tax Laws - May 2025 attempt.',
    is_published: true,
  },
  {
    id: 5,
    title: 'Auditing Practice Paper - Set A',
    subject: { id: 2, name: 'Advanced Auditing & Professional Ethics' },
    attempt_type: 'practice',
    total_marks: 100,
    duration: 180,
    exam_session: 'Practice 2026',
    description: 'Comprehensive practice paper for Advanced Auditing covering ISAs and professional ethics.',
    is_published: true,
  },
];

export const MOCK_SUBMISSIONS = [
  {
    id: 1,
    exam_paper: { id: 1, title: 'CA Final SFM - November 2025', subject: { name: 'SFM' } },
    status: 'evaluated',
    created_at: '2026-03-01T10:00:00Z',
    time_taken_minutes: 150,
  },
  {
    id: 2,
    exam_paper: { id: 4, title: 'CA Final FR - November 2025', subject: { name: 'Financial Reporting' } },
    status: 'evaluated',
    created_at: '2026-02-18T09:30:00Z',
    time_taken_minutes: 165,
  },
  {
    id: 3,
    exam_paper: { id: 3, title: 'SFM Mock Test - Series 1', subject: { name: 'SFM' } },
    status: 'completed',
    created_at: '2026-02-05T11:00:00Z',
    time_taken_minutes: 140,
  },
  {
    id: 4,
    exam_paper: { id: 5, title: 'Auditing Practice Paper - Set A', subject: { name: 'Auditing' } },
    status: 'processing',
    created_at: '2026-03-10T14:00:00Z',
    time_taken_minutes: null,
  },
  {
    id: 5,
    exam_paper: { id: 2, title: 'CA Final DT - May 2025 RTP', subject: { name: 'Direct Tax' } },
    status: 'pending',
    created_at: '2026-03-12T16:00:00Z',
    time_taken_minutes: null,
  },
];

export const MOCK_EVALUATION_HISTORY = [
  {
    id: 1,
    submission: { id: 1, exam_paper: { title: 'CA Final SFM - November 2025' } },
    score: 72,
    status: 'approved',
    created_at: '2026-03-01T11:00:00Z',
    paper_title: 'CA Final SFM - November 2025',
    date: '2026-03-01',
  },
  {
    id: 2,
    submission: { id: 2, exam_paper: { title: 'CA Final FR - November 2025' } },
    score: 68,
    status: 'approved',
    created_at: '2026-02-18T10:30:00Z',
    paper_title: 'CA Final FR - November 2025',
    date: '2026-02-18',
  },
  {
    id: 3,
    submission: { id: 3, exam_paper: { title: 'SFM Mock Test - Series 1' } },
    score: 63,
    status: 'completed',
    created_at: '2026-02-05T12:00:00Z',
    paper_title: 'SFM Mock Test - Series 1',
    date: '2026-02-05',
  },
];

export const MOCK_REPORT = {
  id: 1,
  exam_paper: { id: 1, title: 'CA Final SFM - November 2025' },
  total_marks: 100,
  obtained_marks: 72,
  percentage: 72,
  status: 'approved',
  submitted_at: '2026-03-01T10:00:00Z',
  evaluated_at: '2026-03-01T11:00:00Z',
  overall_feedback:
    'Good performance overall. Strong understanding of derivatives and forex. Focus more on portfolio management calculations and working note presentation.',
  presentation_score: 8,
  presentation_total: 10,
  question_evaluations: [
    {
      id: 1,
      question_number: 1,
      question_text: 'Calculate the NPV of the project with the given cash flows and discount rate.',
      marks_awarded: 16,
      total_marks: 20,
      status: 'approved',
      step_evaluations: [
        { step_number: 1, description: 'Set up discounting framework', marks_awarded: 3, total_marks: 3, is_correct: true },
        { step_number: 2, description: 'Calculate PV of each cash flow', marks_awarded: 6, total_marks: 8, is_correct: false },
        { step_number: 3, description: 'Sum up to get NPV', marks_awarded: 4, total_marks: 4, is_correct: true },
        { step_number: 4, description: 'Working notes and presentation', marks_awarded: 3, total_marks: 5, is_correct: false },
      ],
      mistakes: [
        { type: 'calculation', description: 'Minor arithmetic error in Year 3 discounting', marks_lost: 2 },
        { type: 'presentation', description: 'Working notes incomplete - missing intermediate steps', marks_lost: 2 },
      ],
      feedback: 'Good conceptual understanding. Work on showing complete working notes.',
    },
    {
      id: 2,
      question_number: 2,
      question_text: 'A company wants to hedge its forex exposure. Calculate the net payoff using forward contracts.',
      marks_awarded: 18,
      total_marks: 20,
      status: 'approved',
      step_evaluations: [
        { step_number: 1, description: 'Identify exposure and direction', marks_awarded: 4, total_marks: 4, is_correct: true },
        { step_number: 2, description: 'Calculate forward rate', marks_awarded: 6, total_marks: 6, is_correct: true },
        { step_number: 3, description: 'Net payoff computation', marks_awarded: 5, total_marks: 6, is_correct: false },
        { step_number: 4, description: 'Conclusion', marks_awarded: 3, total_marks: 4, is_correct: false },
      ],
      mistakes: [
        { type: 'step_loss', description: 'Minor rounding difference in payoff', marks_lost: 1 },
        { type: 'presentation', description: 'Conclusion could be more explicit', marks_lost: 1 },
      ],
      feedback: 'Excellent understanding of forex hedging. Minor presentation issues.',
    },
    {
      id: 3,
      question_number: 3,
      question_text: 'Calculate Sharpe Ratio, Treynor Ratio and Jensen Alpha for the given portfolio.',
      marks_awarded: 12,
      total_marks: 20,
      status: 'approved',
      step_evaluations: [
        { step_number: 1, description: 'Calculate excess return', marks_awarded: 4, total_marks: 4, is_correct: true },
        { step_number: 2, description: 'Compute Sharpe Ratio', marks_awarded: 2, total_marks: 4, is_correct: false },
        { step_number: 3, description: 'Compute Treynor Ratio', marks_awarded: 3, total_marks: 4, is_correct: false },
        { step_number: 4, description: 'Compute Jensen Alpha', marks_awarded: 3, total_marks: 8, is_correct: false },
      ],
      mistakes: [
        { type: 'conceptual', description: 'Confused standard deviation with beta in Sharpe ratio denominator', marks_lost: 2 },
        { type: 'conceptual', description: 'Used wrong formula for Jensen Alpha - missing market risk premium term', marks_lost: 5 },
        { type: 'presentation', description: 'No tabular summary of results', marks_lost: 1 },
      ],
      feedback: 'Weak area identified: Portfolio performance measures. Revise formulas thoroughly.',
    },
    {
      id: 4,
      question_number: 4,
      question_text: 'Options pricing - Calculate Call and Put option values using Black-Scholes model.',
      marks_awarded: 14,
      total_marks: 20,
      status: 'approved',
      step_evaluations: [
        { step_number: 1, description: 'Calculate d1 and d2', marks_awarded: 6, total_marks: 6, is_correct: true },
        { step_number: 2, description: 'Look up N(d1) and N(d2) from table', marks_awarded: 4, total_marks: 4, is_correct: true },
        { step_number: 3, description: 'Calculate Call option value', marks_awarded: 3, total_marks: 5, is_correct: false },
        { step_number: 4, description: 'Calculate Put option using Put-Call Parity', marks_awarded: 1, total_marks: 5, is_correct: false },
      ],
      mistakes: [
        { type: 'calculation', description: 'Arithmetic error in Call value computation', marks_lost: 2 },
        { type: 'conceptual', description: 'Put-Call Parity formula applied incorrectly', marks_lost: 3 },
      ],
      feedback: 'Good start with BS model. Review Put-Call Parity formula application.',
    },
    {
      id: 5,
      question_number: 5,
      question_text: 'Mutual fund performance evaluation and selection criteria.',
      marks_awarded: 12,
      total_marks: 20,
      status: 'approved',
      step_evaluations: [
        { step_number: 1, description: 'Identify evaluation criteria', marks_awarded: 4, total_marks: 4, is_correct: true },
        { step_number: 2, description: 'Calculate NAV and returns', marks_awarded: 4, total_marks: 5, is_correct: false },
        { step_number: 3, description: 'Risk-adjusted performance', marks_awarded: 2, total_marks: 6, is_correct: false },
        { step_number: 4, description: 'Recommendation with justification', marks_awarded: 2, total_marks: 5, is_correct: false },
      ],
      mistakes: [
        { type: 'calculation', description: 'NAV calculation has an error in units outstanding', marks_lost: 1 },
        { type: 'conceptual', description: 'Risk-adjusted return formula missing expense ratio adjustment', marks_lost: 4 },
        { type: 'presentation', description: 'Recommendation lacks proper justification', marks_lost: 3 },
      ],
      feedback: 'Needs improvement in mutual fund performance metrics. Focus on risk-adjusted returns.',
    },
  ],
};

export const MOCK_RANKING = {
  rank: 5,
  total_students: 24,
  percentile: 79,
  your_score: 72,
  top_score: 91,
  average_score: 65,
};

export const MOCK_EVALUATIONS_ADMIN = [
  {
    id: 1,
    submission: {
      id: 1,
      student: { username: 'raj_sharma', first_name: 'Raj', last_name: 'Sharma' },
      exam_paper: { title: 'CA Final SFM - November 2025' },
    },
    total_marks: 100,
    obtained_marks: 72,
    status: 'approved',
    is_ai_evaluated: true,
    created_at: '2026-03-01T11:00:00Z',
  },
  {
    id: 2,
    submission: {
      id: 2,
      student: { username: 'priya_m', first_name: 'Priya', last_name: 'Mehta' },
      exam_paper: { title: 'CA Final FR - November 2025' },
    },
    total_marks: 100,
    obtained_marks: 81,
    status: 'approved',
    is_ai_evaluated: true,
    created_at: '2026-02-18T10:30:00Z',
  },
  {
    id: 3,
    submission: {
      id: 6,
      student: { username: 'arjun_k', first_name: 'Arjun', last_name: 'Kumar' },
      exam_paper: { title: 'SFM Mock Test - Series 1' },
    },
    total_marks: 100,
    obtained_marks: 58,
    status: 'pending',
    is_ai_evaluated: true,
    created_at: '2026-03-08T09:00:00Z',
  },
  {
    id: 4,
    submission: {
      id: 7,
      student: { username: 'sneha_r', first_name: 'Sneha', last_name: 'Reddy' },
      exam_paper: { title: 'CA Final DT - May 2025 RTP' },
    },
    total_marks: 100,
    obtained_marks: 65,
    status: 'pending',
    is_ai_evaluated: false,
    created_at: '2026-03-10T14:00:00Z',
  },
  {
    id: 5,
    submission: {
      id: 8,
      student: { username: 'vikram_s', first_name: 'Vikram', last_name: 'Singh' },
      exam_paper: { title: 'Auditing Practice Paper - Set A' },
    },
    total_marks: 100,
    obtained_marks: 75,
    status: 'completed',
    is_ai_evaluated: true,
    created_at: '2026-03-05T16:00:00Z',
  },
];

export const MOCK_MISTAKES = [
  {
    id: 1,
    category: 'conceptual',
    isRecurring: true,
    marksLost: 5,
    description: 'Confused Sharpe Ratio denominator - used beta instead of standard deviation',
    paperTitle: 'CA Final SFM - November 2025',
    questionNumber: 'Q3',
    suggestion: 'Sharpe Ratio = (Rp - Rf) / σp. Always use portfolio standard deviation, not beta. Beta is used in Treynor Ratio.',
    topicsToCover: ['Portfolio Performance Measures', 'Risk Measures'],
  },
  {
    id: 2,
    category: 'conceptual',
    isRecurring: true,
    marksLost: 4,
    description: 'Jensen Alpha formula applied incorrectly - missing market risk premium term',
    paperTitle: 'CA Final SFM - November 2025',
    questionNumber: 'Q3',
    suggestion: 'Jensen Alpha = Rp - [Rf + β(Rm - Rf)]. The full CAPM formula is required, not just Rf + β×Rm.',
    topicsToCover: ["Jensen's Alpha", 'CAPM', 'Portfolio Theory'],
  },
  {
    id: 3,
    category: 'calculation',
    isRecurring: false,
    marksLost: 3,
    description: 'Put-Call Parity formula application error',
    paperTitle: 'CA Final SFM - November 2025',
    questionNumber: 'Q4',
    suggestion: 'Put-Call Parity: C + PV(K) = P + S. Remember to discount the strike price at risk-free rate.',
    topicsToCover: ['Options Pricing', 'Put-Call Parity', 'Black-Scholes'],
  },
  {
    id: 4,
    category: 'presentation',
    isRecurring: true,
    marksLost: 3,
    description: 'Working notes incomplete - missing intermediate calculation steps',
    paperTitle: 'CA Final SFM - November 2025',
    questionNumber: 'Q1',
    suggestion: 'ICAI expects complete working notes. Show all intermediate steps. Each step should be labeled and numbered.',
    topicsToCover: ['Presentation Skills', 'ICAI Format'],
  },
  {
    id: 5,
    category: 'calculation',
    isRecurring: false,
    marksLost: 2,
    description: 'NAV calculation error - wrong units outstanding figure used',
    paperTitle: 'CA Final FR - November 2025',
    questionNumber: 'Q5',
    suggestion: 'NAV = (Total Assets - Total Liabilities) / Units Outstanding. Be careful to use closing units, not opening.',
    topicsToCover: ['Mutual Funds', 'NAV Calculation'],
  },
  {
    id: 6,
    category: 'step_loss',
    isRecurring: false,
    marksLost: 2,
    description: 'Skipped the conclusion step in forex hedging question',
    paperTitle: 'SFM Mock Test - Series 1',
    questionNumber: 'Q2',
    suggestion: 'Always conclude: state whether to hedge or not, and the net gain/loss from hedging strategy.',
    topicsToCover: ['Forex Management', 'Hedging Strategies'],
  },
];

export const MOCK_MISTAKE_SUMMARY = {
  totalCount: 15,
  totalMarksLost: 28,
  categories: [
    { category: 'conceptual', count: 6, marksLost: 12 },
    { category: 'presentation', count: 4, marksLost: 8 },
    { category: 'calculation', count: 3, marksLost: 5 },
    { category: 'step_loss', count: 2, marksLost: 3 },
  ],
};

export const MOCK_OVERVIEW = {
  level: 'proficient',
  totalAttempts: 10,
  overallAverage: 72,
  subjectsStudied: 4,
};

export const MOCK_WEAK_AREAS = [
  { id: 1, subject: 'SFM', chapter: 'Portfolio Performance Measures', score: 40, attempts: 3 },
  { id: 2, subject: 'SFM', chapter: 'Options & Derivatives', score: 48, attempts: 4 },
  { id: 3, subject: 'FR', chapter: 'Ind AS 115 - Revenue Recognition', score: 52, attempts: 2 },
  { id: 4, subject: 'DT', chapter: 'Transfer Pricing', score: 55, attempts: 2 },
];

export const MOCK_REVISION_DATA = {
  totalItems: 8,
  resolvedCount: 2,
  highPriorityCount: 3,
  highPriorityItems: [
    {
      id: 1,
      title: 'Portfolio Performance Measures (Sharpe, Treynor, Jensen)',
      description: 'You\'ve made this mistake 3 times. The formulas are frequently confused. Make a formula sheet and practice at least 5 problems.',
      priority: 'high',
      subject: 'SFM',
      chapter: 'Portfolio Management',
      occurrenceCount: 3,
    },
    {
      id: 2,
      title: 'Put-Call Parity & Options Pricing',
      description: 'Recurring error in applying Put-Call Parity. The discounting of strike price is consistently missed.',
      priority: 'high',
      subject: 'SFM',
      chapter: 'Derivatives',
      occurrenceCount: 2,
    },
    {
      id: 3,
      title: 'ICAI Presentation Format - Working Notes',
      description: 'Marks lost in almost every paper due to incomplete working notes. This is an easy win - just be systematic.',
      priority: 'high',
      subject: 'All',
      chapter: 'Presentation',
      occurrenceCount: 4,
    },
  ],
  allItems: [
    {
      id: 1,
      title: 'Portfolio Performance Measures',
      priority: 'high',
      subject: 'SFM',
    },
    {
      id: 2,
      title: 'Put-Call Parity',
      priority: 'high',
      subject: 'SFM',
    },
    {
      id: 3,
      title: 'Working Notes Format',
      priority: 'high',
      subject: 'All',
    },
    {
      id: 4,
      title: 'NAV Calculation for Mutual Funds',
      priority: 'medium',
      subject: 'SFM',
    },
    {
      id: 5,
      title: 'Ind AS 115 Revenue Recognition',
      priority: 'medium',
      subject: 'FR',
    },
    {
      id: 6,
      title: 'Transfer Pricing Adjustments',
      priority: 'medium',
      subject: 'DT',
    },
    {
      id: 7,
      title: 'Forex Forward Contract Conclusion',
      priority: 'low',
      subject: 'SFM',
    },
    {
      id: 8,
      title: 'Capital Budgeting with Inflation',
      priority: 'low',
      subject: 'SFM',
    },
  ],
};

export const MOCK_PROGRESS_CHART = {
  subject: 'SFM',
  data: [
    { date: '2026-01-10', score: 52, paper: 'Mock 1' },
    { date: '2026-01-25', score: 58, paper: 'Practice A' },
    { date: '2026-02-05', score: 63, paper: 'Mock 2' },
    { date: '2026-02-18', score: 68, paper: 'Past Nov 2025' },
    { date: '2026-03-01', score: 72, paper: 'Past Nov 2025 (Retake)' },
  ],
};
