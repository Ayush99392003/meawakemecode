const fs = require('fs');
const path = require('path');

const csModules = require('../src/data/curriculum/cs_fundamentals_daily.json');
const sdModules = require('../src/data/curriculum/system_design_daily.json');
const days = require('../src/data/curriculum/days_30.json');

const domainToSection = {
  'Operating Systems': 'os',
  'Computer Networks': 'cn',
  'Database Management': 'dbms',
  'Distributed Systems & OOP': 'oop',
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

const libraryArticles = [];

// 1. Add CS Fundamentals (30 articles)
csModules.forEach((m, idx) => {
  const section = domainToSection[m.domain] || 'os';
  const cleanSlug = `day-${m.dayNumber}-${slugify(m.title)}`;
  libraryArticles.push({
    slug: `${section}/${cleanSlug}`,
    section: section,
    title: `[Day ${m.dayNumber}] ${m.title}`,
    orderIndex: m.dayNumber,
    tags: [m.domain, `Day ${m.dayNumber}`, m.dsaTheme],
    readTimeMinutes: 7,
    content: `${m.summary}\n\n### Mental Model & Core Invariant\n${m.mentalModel}\n\n${m.details}\n\n### Production Incident & Failure Mode\n${m.failureCase}`,
    interviewQuestions: m.interviewQuestions || []
  });
});

// 2. Add System Design (30 articles)
sdModules.forEach((m, idx) => {
  const section = 'system_design';
  const cleanSlug = `day-${m.dayNumber}-${slugify(m.title)}`;
  libraryArticles.push({
    slug: `${section}/${cleanSlug}`,
    section: section,
    title: `[Day ${m.dayNumber}] ${m.title}`,
    orderIndex: m.dayNumber,
    tags: ['System Design', `Day ${m.dayNumber}`, 'Scalability'],
    readTimeMinutes: 9,
    content: `${m.summary}\n\n${m.architecture}\n\n### Bottlenecks & Critical Trade-offs\n${m.tradeoffs}`,
    interviewQuestions: m.interviewQuestions || []
  });
});

// 3. Add DSA Core Master Guides (30 articles)
days.forEach((d) => {
  const section = 'dsa';
  const cleanSlug = `day-${d.number}-${slugify(d.theme)}`;
  libraryArticles.push({
    slug: `${section}/${cleanSlug}`,
    section: section,
    title: `Day ${d.number}: ${d.theme} Master Notes`,
    orderIndex: d.number,
    tags: ['DSA', `Day ${d.number}`, 'Complexity Invariants'],
    readTimeMinutes: 6,
    content: `### Curriculum Overview for Day ${d.number}: ${d.theme}\n\n${d.summary}\n\n### Target Complexity & Invariants\n- Expected Time Complexity: Amortized $\\mathcal{O}(1)$ to $\\mathcal{O}(N)$ optimal bounds.\n- Space Complexity: Auxiliary $\\mathcal{O}(1)$ or minimal buffer overhead.\n- Key Invariant: Maintain two-pointer / window / prefix invariant without violating array bounds.`,
    interviewQuestions: [
      {
        q: `What is the optimal pattern for ${d.theme}?`,
        a: `Always analyze bounds and identify monotonicity, hash table trade-offs, or invariant maintenance before writing code.`
      }
    ]
  });
});

const outputPath = path.join(__dirname, '../src/data/library/library_catalog.json');
fs.writeFileSync(outputPath, JSON.stringify(libraryArticles, null, 2));

console.log(`Successfully updated library_catalog.json with ${libraryArticles.length} articles!`);
const sectionCounts = {};
libraryArticles.forEach(a => sectionCounts[a.section] = (sectionCounts[a.section] || 0) + 1);
console.log('Breakdown by section:', sectionCounts);
