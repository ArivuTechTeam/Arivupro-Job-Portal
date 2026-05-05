"""
Seed script to populate the database with initial CA/CS/CMA subjects and chapters.
Run: python manage.py shell < seed_data.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_review.settings')
django.setup()

from accounts.models import User
from exams.models import Subject, Chapter

# --- Create Admin User ---
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@arivupro.com',
        password='admin123',
        first_name='Admin',
        last_name='ArivuPro',
        role='admin',
    )
    print(f"Created admin user: {admin.username}")

# --- CA Subjects ---
CA_SUBJECTS = {
    'Foundation': [
        ('CA-F1', 'Principles and Practice of Accounting', [
            'Introduction to Accounting', 'Accounting Standards', 'Bank Reconciliation Statement',
            'Inventories', 'Depreciation', 'Final Accounts', 'Partnership Accounts',
            'Company Accounts', 'Cash Flow Statement',
        ]),
        ('CA-F2', 'Business Laws and Business Correspondence', [
            'Indian Contract Act 1872', 'Sale of Goods Act 1930', 'Indian Partnership Act 1932',
            'Limited Liability Partnership Act 2008', 'Business Correspondence',
        ]),
        ('CA-F3', 'Business Mathematics and Statistics', [
            'Ratio and Proportion', 'Simple and Compound Interest', 'Permutation and Combination',
            'Sets and Functions', 'Probability', 'Theoretical Distributions',
            'Correlation and Regression', 'Index Numbers',
        ]),
        ('CA-F4', 'Business Economics', [
            'Introduction to Business Economics', 'Theory of Demand and Supply',
            'Theory of Production and Cost', 'Price Determination', 'Indian Economy',
        ]),
    ],
    'Intermediate': [
        ('CA-I1', 'Advanced Accounting', [
            'Accounting Standards', 'Special Transactions', 'Preparation of Financial Statements',
            'Partnership Accounts', 'Company Accounts', 'Dissolution of Firms',
            'Amalgamation', 'Insurance Claims', 'Investment Accounts',
        ]),
        ('CA-I2', 'Corporate and Other Laws', [
            'Companies Act 2013', 'LLP Act 2008', 'General Clauses Act',
            'Interpretation of Statutes', 'SEBI Regulations',
        ]),
        ('CA-I3', 'Cost and Management Accounting', [
            'Overview of Cost Accounting', 'Material Cost', 'Employee Cost',
            'Overheads', 'Activity Based Costing', 'Cost Sheet',
            'Job Costing', 'Process Costing', 'Joint Products and By-Products',
            'Standard Costing', 'Marginal Costing', 'Budget and Budgetary Control',
        ]),
        ('CA-I4', 'Taxation', [
            'Income Tax Act - Basics', 'Salary Income', 'House Property',
            'Business and Profession', 'Capital Gains', 'Other Sources',
            'Deductions', 'Set Off and Carry Forward', 'Assessment Procedures',
            'GST - Overview', 'GST - Supply', 'GST - Registration', 'Input Tax Credit',
        ]),
        ('CA-I5', 'Auditing and Assurance', [
            'Auditing Concepts', 'Audit Strategy and Planning', 'Audit Documentation',
            'Audit Evidence', 'Internal Control', 'Audit Sampling',
            'Analytical Procedures', 'Company Audit', 'Audit Report',
        ]),
        ('CA-I6', 'Enterprise Information Systems and SM', [
            'Automated Business Processes', 'Financial and Accounting Systems',
            'Information Systems', 'E-Commerce', 'Strategic Management Overview',
            'Strategic Analysis', 'Strategy Formulation', 'Strategy Implementation',
        ]),
    ],
    'Final': [
        ('CA-FN1', 'Financial Reporting', [
            'Ind AS Framework', 'Ind AS 1 - Presentation', 'Ind AS 2 - Inventories',
            'Ind AS 16 - PPE', 'Ind AS 36 - Impairment', 'Ind AS 38 - Intangibles',
            'Ind AS 115 - Revenue', 'Consolidated Financial Statements',
            'Ind AS 12 - Income Taxes', 'Ind AS 19 - Employee Benefits',
        ]),
        ('CA-FN2', 'Strategic Financial Management', [
            'Financial Policy and Corporate Strategy', 'Risk Management',
            'Security Analysis', 'Portfolio Management', 'Mutual Funds',
            'Derivatives', 'Foreign Exchange Exposure', 'International Financial Management',
            'Mergers and Acquisitions', 'Corporate Valuation',
        ]),
        ('CA-FN3', 'Advanced Auditing and Professional Ethics', [
            'Auditing Standards and Guidance Notes', 'Company Audit',
            'Audit of Banks', 'Audit of Insurance Companies',
            'Audit under Fiscal Laws', 'Audit of PSU', 'Peer Review',
            'Professional Ethics', 'Digital Auditing',
        ]),
        ('CA-FN4', 'Direct Tax Laws and International Taxation', [
            'Residential Status', 'Income from Salary',
            'Profits and Gains of Business', 'Capital Gains',
            'Income from Other Sources', 'Clubbing and Set Off',
            'Assessment Procedures', 'TDS', 'Advance Tax',
            'Transfer Pricing', 'DTAA', 'BEPS', 'GAAR',
        ]),
    ],
}

# --- CS Subjects ---
CS_SUBJECTS = {
    'Foundation': [
        ('CS-F1', 'Business Environment and Law', [
            'Business Environment', 'Business Laws', 'Indian Contract Act',
            'Sale of Goods Act', 'Partnership Act',
        ]),
        ('CS-F2', 'Business Management Ethics and Entrepreneurship', [
            'Management Principles', 'Business Ethics', 'Entrepreneurship',
            'Corporate Governance',
        ]),
        ('CS-F3', 'Business Economics', [
            'Demand Analysis', 'Production and Cost', 'Market Structure',
            'Macro Economics', 'Indian Economy',
        ]),
        ('CS-F4', 'Fundamentals of Accounting and Auditing', [
            'Accounting Principles', 'Journal and Ledger', 'Final Accounts',
            'Company Accounts', 'Auditing Basics',
        ]),
    ],
    'Executive': [
        ('CS-E1', 'Jurisprudence Interpretation and General Laws', [
            'Jurisprudence', 'Constitution of India', 'Interpretation of Statutes',
            'General Clauses Act', 'Administrative Law',
        ]),
        ('CS-E2', 'Company Law', [
            'Introduction to Company Law', 'Incorporation', 'Prospectus',
            'Share Capital', 'Debentures', 'Members', 'Directors',
            'Board Meetings', 'General Meetings', 'Winding Up',
        ]),
        ('CS-E3', 'Setting Up of Business Entities and Closure', [
            'Sole Proprietorship', 'Partnership Firms', 'LLP',
            'Company Formation', 'Startups', 'Closure of Business',
        ]),
        ('CS-E4', 'Tax Laws', [
            'Income Tax', 'GST', 'Customs Duty',
        ]),
    ],
    'Professional': [
        ('CS-P1', 'Governance Risk Management and Compliance', [
            'Corporate Governance', 'Board Effectiveness', 'Risk Management',
            'Compliance Management', 'ESG',
        ]),
        ('CS-P2', 'Advanced Tax Laws', [
            'Direct Tax', 'International Taxation', 'Transfer Pricing',
            'GST Advanced', 'Tax Planning',
        ]),
        ('CS-P3', 'Drafting Pleadings and Appearances', [
            'Drafting', 'Pleadings', 'Court Appearances',
            'Arbitration', 'Mediation',
        ]),
    ],
}

# --- CMA Subjects ---
CMA_SUBJECTS = {
    'Foundation': [
        ('CMA-F1', 'Fundamentals of Business Laws and Business Communication', [
            'Indian Contract Act', 'Sale of Goods', 'Business Communication',
        ]),
        ('CMA-F2', 'Fundamentals of Financial and Cost Accounting', [
            'Financial Accounting', 'Cost Accounting Basics', 'Material Costing',
        ]),
        ('CMA-F3', 'Fundamentals of Business Mathematics and Statistics', [
            'Algebra', 'Calculus', 'Statistics', 'Probability',
        ]),
        ('CMA-F4', 'Fundamentals of Business Economics and Management', [
            'Micro Economics', 'Macro Economics', 'Management',
        ]),
    ],
    'Intermediate': [
        ('CMA-I1', 'Financial Accounting', [
            'Accounting Standards', 'Company Accounts', 'Cash Flow Statement',
            'Amalgamation', 'Special Accounts',
        ]),
        ('CMA-I2', 'Laws and Ethics', [
            'Commercial Laws', 'Industrial Laws', 'Corporate Laws', 'Ethics',
        ]),
        ('CMA-I3', 'Direct Taxation', [
            'Income Tax Basics', 'Heads of Income', 'Deductions',
            'Assessment', 'Tax Planning',
        ]),
        ('CMA-I4', 'Cost Accounting', [
            'Cost Ascertainment', 'Cost Accounting Standards',
            'Methods of Costing', 'Cost Control', 'Activity Based Costing',
        ]),
        ('CMA-I5', 'Operations Management and Strategic Management', [
            'Operations Management', 'Production Planning', 'Quality Management',
            'Strategic Management', 'SWOT', 'Competitive Strategy',
        ]),
    ],
    'Final': [
        ('CMA-FN1', 'Corporate Laws and Compliance', [
            'Companies Act', 'SEBI Regulations', 'FEMA',
            'Competition Act', 'IBC',
        ]),
        ('CMA-FN2', 'Strategic Financial Management', [
            'Investment Decisions', 'Financial Markets', 'Risk Management',
            'Corporate Restructuring', 'Mergers',
        ]),
        ('CMA-FN3', 'Strategic Cost Management', [
            'Cost Management', 'Decision Making', 'Pricing Strategy',
            'Transfer Pricing', 'Balanced Scorecard',
        ]),
        ('CMA-FN4', 'Direct Tax Laws and International Taxation', [
            'Corporate Tax', 'International Tax', 'Transfer Pricing',
            'Tax Planning', 'Assessment',
        ]),
    ],
}

EXAM_DATA = {
    'CA': CA_SUBJECTS,
    'CS': CS_SUBJECTS,
    'CMA': CMA_SUBJECTS,
}

total_subjects = 0
total_chapters = 0

for exam_type, levels in EXAM_DATA.items():
    for level, subjects in levels.items():
        for code, name, chapters in subjects:
            subject, created = Subject.objects.get_or_create(
                code=code,
                exam_type=exam_type,
                defaults={
                    'name': name,
                    'exam_level': level,
                    'is_active': True,
                }
            )
            if created:
                total_subjects += 1
                print(f"  Created subject: {code} - {name}")

            for i, ch_name in enumerate(chapters, 1):
                _, ch_created = Chapter.objects.get_or_create(
                    subject=subject,
                    chapter_number=i,
                    defaults={'name': ch_name, 'weightage': round(100 / len(chapters), 1)},
                )
                if ch_created:
                    total_chapters += 1

print(f"\nSeeded {total_subjects} subjects and {total_chapters} chapters.")
print("Admin login: username=admin, password=admin123")
