export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function buildJobUrl(section: 'jobs' | 'internships' | 'articleship', job: { id: string; company: string; title: string }): string {
  return `/${section}/${slugify(job.company)}/${slugify(job.title)}/${job.id}`;
}
