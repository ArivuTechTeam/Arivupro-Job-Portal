"""
Qualification/course detection from job title + description.
Ported from articleship: src/lib/sync/course-detector.ts
Keyword-first, Gemini fallback.
"""
import os
import re
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

KEYWORD_MAP: list[tuple[re.Pattern, str]] = [
    # CA
    (re.compile(r'\bca\b', re.I), 'CA'),
    (re.compile(r'chartered accountant', re.I), 'CA'),
    (re.compile(r'article assistant', re.I), 'CA'),
    (re.compile(r'article clerk', re.I), 'CA'),
    (re.compile(r'articleship', re.I), 'CA'),
    (re.compile(r'audit intern', re.I), 'CA'),
    (re.compile(r'audit associate', re.I), 'CA'),
    (re.compile(r'internal audit', re.I), 'CA'),
    (re.compile(r'statutory audit', re.I), 'CA'),
    (re.compile(r'tax associate', re.I), 'CA'),
    (re.compile(r'taxation', re.I), 'CA'),
    (re.compile(r'\bgst\b', re.I), 'CA'),
    (re.compile(r'income tax', re.I), 'CA'),
    (re.compile(r'finance analyst', re.I), 'CA'),
    (re.compile(r'financial analyst', re.I), 'CA'),
    (re.compile(r'financial reporting', re.I), 'CA'),
    (re.compile(r'accounts executive', re.I), 'CA'),
    (re.compile(r'accounts payable', re.I), 'CA'),
    (re.compile(r'accounts receivable', re.I), 'CA'),
    (re.compile(r'\bmis\b.*executive', re.I), 'CA'),
    (re.compile(r'ca fresher', re.I), 'CA'),
    (re.compile(r'ca inter', re.I), 'CA'),
    (re.compile(r'ca final', re.I), 'CA'),
    # CS
    (re.compile(r'\bcs\b(?!\w)', re.I), 'CS'),
    (re.compile(r'company secretary', re.I), 'CS'),
    (re.compile(r'secretarial', re.I), 'CS'),
    (re.compile(r'cs fresher', re.I), 'CS'),
    (re.compile(r'cs executive', re.I), 'CS'),
    (re.compile(r'cs trainee', re.I), 'CS'),
    (re.compile(r'cs inter', re.I), 'CS'),
    (re.compile(r'icsi', re.I), 'CS'),
    (re.compile(r'corporate governance', re.I), 'CS'),
    (re.compile(r'compliance officer', re.I), 'CS'),
    (re.compile(r'board secretarial', re.I), 'CS'),
    (re.compile(r'roc filing', re.I), 'CS'),
    (re.compile(r'mca filing', re.I), 'CS'),
    # CMA India
    (re.compile(r'\bcma\b(?!\s*us)', re.I), 'CMA India'),
    (re.compile(r'cost accountant', re.I), 'CMA India'),
    (re.compile(r'management accountant', re.I), 'CMA India'),
    (re.compile(r'cost audit', re.I), 'CMA India'),
    (re.compile(r'cma fresher', re.I), 'CMA India'),
    (re.compile(r'cma inter', re.I), 'CMA India'),
    (re.compile(r'icmai', re.I), 'CMA India'),
    (re.compile(r'industrial trainee', re.I), 'CMA India'),
    (re.compile(r'cost.*management.*account', re.I), 'CMA India'),
    # ACCA
    (re.compile(r'\bacca\b', re.I), 'ACCA'),
    (re.compile(r'acca affiliate', re.I), 'ACCA'),
    (re.compile(r'acca trainee', re.I), 'ACCA'),
    (re.compile(r'acca fresher', re.I), 'ACCA'),
    (re.compile(r'association.*chartered.*certified', re.I), 'ACCA'),
    # CFA
    (re.compile(r'\bcfa\b(?!\s*institute)', re.I), 'CFA'),
    (re.compile(r'cfa candidate', re.I), 'CFA'),
    (re.compile(r'cfa level', re.I), 'CFA'),
    (re.compile(r'chartered financial analyst', re.I), 'CFA'),
    (re.compile(r'investment analyst', re.I), 'CFA'),
    (re.compile(r'equity research', re.I), 'CFA'),
    (re.compile(r'portfolio analyst', re.I), 'CFA'),
    # CPA US
    (re.compile(r'\bcpa\b', re.I), 'CPA US'),
    (re.compile(r'us cpa', re.I), 'CPA US'),
    (re.compile(r'cpa candidate', re.I), 'CPA US'),
    (re.compile(r'certified public accountant', re.I), 'CPA US'),
    # CIA / FRM
    (re.compile(r'\bcia\b(?!\s*agent)', re.I), 'CIA'),
    (re.compile(r'certified internal auditor', re.I), 'CIA'),
    (re.compile(r'\bfrm\b', re.I), 'FRM'),
    (re.compile(r'financial risk manager', re.I), 'FRM'),
]


def detect_courses_keyword(title: str, description: str) -> Optional[list[str]]:
    text = f'{title} {description}'
    found: set[str] = set()
    for pattern, course in KEYWORD_MAP:
        if pattern.search(text):
            found.add(course)
    return list(found) if found else None


async def detect_courses_gemini(title: str, description: str) -> list[str]:
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return ['CA']
    try:
        from google import genai as google_genai
        client = google_genai.Client(api_key=api_key)
        prompt = (
            'Given this Indian job posting, return a JSON array of applicable professional courses from: '
            'CA, CS, CMA India, ACCA, CPA US, CIA, FRM, CFA. Finance/accounting/audit/tax roles typically suit CA. '
            'Secretarial/compliance roles suit CS. Cost/management accounting roles suit CMA India. '
            'Return ONLY the JSON array, nothing else.\n'
            f'Title: {title}\nDescription: {description[:400]}'
        )
        resp = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
        )
        raw = resp.candidates[0].content.parts[0].text if resp.candidates else '[]'
        cleaned = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.I)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, list) and parsed else ['CA']
    except Exception as e:
        logger.warning(f'Gemini course detection failed: {e}')
        return ['CA']


async def detect_courses(title: str, description: str) -> list[str]:
    kw = detect_courses_keyword(title, description)
    if kw:
        return kw
    return await detect_courses_gemini(title, description)
