"""
Stipend and duration extraction from free-form text.
Ported from articleship project: src/lib/sync/parse-utils.ts
"""
import re


def extract_stipend(text: str) -> int:
    if not text:
        return 0
    if re.search(r'\bnegotiable\b', text, re.I):
        return 0
    if re.search(r'\bunpaid\b', text, re.I):
        return 0

    t = text.replace(',', '')

    # k-suffix range: "5k-10k"
    m = re.search(r'(\d+(?:\.\d+)?)\s*k\s*[-–—to]+\s*(\d+(?:\.\d+)?)\s*k', t, re.I)
    if m:
        return round(((float(m.group(1)) + float(m.group(2))) / 2) * 1000)

    # k-suffix single: "10k"
    m = re.search(r'(\d+(?:\.\d+)?)\s*k\b', t, re.I)
    if m:
        return round(float(m.group(1)) * 1000)

    # LPA range: "3-5 LPA"
    m = re.search(r'(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?\s*(?:per\s*annum|p\.?a\.?)|lakh)', t, re.I)
    if m:
        mid = (float(m.group(1)) + float(m.group(2))) / 2
        return round((mid * 100000) / 12)

    # LPA single
    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?\s*(?:per\s*annum|p\.?a\.?)|lakh)', t, re.I)
    if m:
        return round((float(m.group(1)) * 100000) / 12)

    # Range: "10000 - 20000"
    m = re.search(r'(?:Rs\.?\s*|₹\s*)?(\d{3,6})\s*[-–—to]+\s*(?:Rs\.?\s*|₹\s*)?(\d{3,6})', t, re.I)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        return round((a + b) / 2)

    # Keyword + single value
    m = re.search(r'(?:stipend|salary|ctc|pay|compensation)\s*[:\s₹]*(?:Rs\.?\s*|₹\s*)?(\d{3,6})', t, re.I)
    if m:
        return int(m.group(1))

    # ₹ or Rs.
    m = re.search(r'(?:₹|Rs\.?\s*)(\d{3,6})', t, re.I)
    if m:
        return int(m.group(1))

    # bare "X per month"
    m = re.search(r'(\d{3,6})\s*(?:/\s*month|per\s+month)', t, re.I)
    if m:
        return int(m.group(1))

    return 0


def extract_duration(text: str) -> str:
    if not text:
        return ''
    if re.search(r'\b(?:ongoing|permanent|open.?ended|no\s+fixed\s+term)\b', text, re.I):
        return ''

    cleaned = re.sub(r'\(\s*\d+\s*(?:yr|year)s?\s*\)', '', text, flags=re.I)
    cleaned = re.sub(r'\d+\s*(?:yr|year)s?\s*(?:of\s+)?(?:experience|old\s+firm|established|exp\.?)', '', cleaned, flags=re.I)
    cleaned = re.sub(r'(?:established|since|founded)\s*(?:in\s*)?\d{2,4}', '', cleaned, flags=re.I)
    cleaned = re.sub(r'\(\s*\d{4}\s*\)', '', cleaned)

    m = re.search(r'(\d+\.?\d*)\s*(?:year|yr)s?\s*(?:articleship|training|internship)', cleaned, re.I)
    if m:
        n = float(m.group(1))
        if n <= 5:
            return f'{m.group(1)} year{"s" if n != 1 else ""}'

    m = re.search(r'(\d+)\s*months?\s*(?:articleship|training|internship)', cleaned, re.I)
    if m:
        mo = int(m.group(1))
        if mo <= 60:
            if mo >= 12:
                yrs = mo // 12
                return f'{yrs} year{"s" if yrs != 1 else ""}'
            return f'{mo} months'

    m = re.search(r'(\d+)\s*(?:year|yr)s?\s*(?:and\s*)?(\d+)\s*months?', cleaned, re.I)
    if m:
        y = int(m.group(1))
        if y <= 5:
            return f'{y} year{"s" if y != 1 else ""} {m.group(2)} months'

    m = re.search(r'(\d+)\s*[-–—]\s*(\d+)\s*months?', cleaned, re.I)
    if m:
        return f'{m.group(1)}–{m.group(2)} months'

    m = re.search(r'(\d+)\s*months?', cleaned, re.I)
    if m:
        mo = int(m.group(1))
        if mo <= 60:
            if mo >= 12:
                yrs = mo // 12
                return f'{yrs} year{"s" if yrs != 1 else ""}'
            return f'{mo} months'

    m = re.search(r'(\d+\.?\d*)\s*(?:year|yr)s?', cleaned, re.I)
    if m:
        n = float(m.group(1))
        if 1 <= n <= 5:
            return f'{m.group(1)} year{"s" if n != 1 else ""}'

    return ''


def extract_articleship_duration(text: str) -> str:
    return extract_duration(text) or '2 years'
