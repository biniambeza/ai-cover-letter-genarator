import './style.css';

interface ApplicationData {
  coverLetter: string;
  cv: string;
  matchHighlights: string[];
}

// Sample profile data for instant 1-click testing
const SAMPLE_DATA = {
  fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 432-8765',
  location: 'San Francisco, CA (Open to Remote)',
  links: 'linkedin.com/in/alexmorgan | github.com/alexmorgan',
  headline: 'Senior Full-Stack Engineer & Distributed Systems Architect',
  summary: 'Product-minded Senior Software Engineer with 6+ years of experience architecting resilient cloud services, high-throughput microservices, and modern web applications. Proven track record of scaling consumer fintech platforms to millions of daily transactions while cutting latency by 40%.',
  experience: `• Lead Full-Stack Engineer at FinTech Velocity (2022 - Present)
  - Designed and deployed real-time payment reconciliation microservice in Go and Node.js, handling 15,000+ TPS with 99.99% uptime.
  - Spearheaded migration of legacy monolith to AWS ECS, Docker, and PostgreSQL, cutting AWS infrastructure spend by 35% annually.
  - Mentored a squad of 6 engineers, established automated CI/CD pipelines, and reduced release cycle time from 2 weeks to daily deployments.

• Senior Frontend Engineer at CloudScale Labs (2019 - 2022)
  - Architected modular design system and analytics dashboard with React, TypeScript, and Tailwind CSS used by 200+ enterprise customers.
  - Integrated GraphQL subscriptions and Redis caching layer, dropping average dashboard query latency from 340ms to 42ms.
  - Championed web performance and accessibility (WCAG 2.1 AA), achieving a 99 Lighthouse performance score across core workflows.`,
  education: `• B.S. in Computer Science - University of California, Berkeley (2015 - 2019)
• AWS Certified Solutions Architect - Professional (2023)`,
  skills: 'TypeScript, React, Next.js, Node.js, Go, Python, PostgreSQL, Redis, GraphQL, Docker, Kubernetes, AWS (ECS, S3, Lambda), REST APIs, System Design, Microservices, CI/CD, Agile Leadership',
  jobTitle: 'Staff Full-Stack Engineer',
  companyName: 'Stripe',
  jobDescription: `About the Role:
We are seeking an experienced Staff Full-Stack Engineer to lead the architecture and execution of Stripe's next-generation merchant checkout experience. In this role, you will collaborate with cross-functional partners in product, design, and infrastructure to build ultra-responsive, accessible, and resilient checkout flows that power commerce globally.

Key Responsibilities:
- Architect, build, and maintain mission-critical web applications with TypeScript, React, and high-throughput backend APIs.
- Drive technical excellence across code reviews, distributed system design, and frontend performance optimizations.
- Partner closely with product leaders to translate complex payment workflows into delightful, seamless user journeys.
- Mentor senior and mid-level engineers across engineering best practices.

Qualifications:
- 5+ years of experience shipping high-scale, production-grade web applications.
- Deep mastery of modern JavaScript/TypeScript, React ecosystem, and web performance tuning.
- Strong fundamentals in backend architecture, relational databases, and cloud systems.
- Exceptional written communication and demonstrated technical mentorship capability.`,
  tone: 'Professional and confident'
};

// Application state
let currentData: ApplicationData | null = null;
let activeTab: 'letter' | 'cv' | 'highlights' = 'letter';
let viewMode: 'formatted' | 'raw' = 'formatted';
let selectedTone = 'Professional and confident';

// Dynamic API Base URL: Uses relative URL in production or proxy, or VITE_API_URL if set
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// API Key Management (BYOK - Bring Your Own Key)
const LOCAL_STORAGE_KEY = 'careerforge_gemini_key';
function getSavedApiKey(): string {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
}
function setSavedApiKey(key: string) {
  if (key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  updateApiKeyStatusBadge();
}

// Markdown parser helper for formatted view
function parseMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-indigo-300 print:text-gray-900 mt-4 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xs font-bold text-indigo-400 print:text-black border-b border-slate-700/60 print:border-gray-300 pb-1 mt-6 mb-2 tracking-wider uppercase">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-white print:text-black border-b-2 border-indigo-500/50 print:border-black pb-2 mb-4 tracking-tight">$1</h1>')
    // Bold & Italics
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="text-slate-100 print:text-black font-semibold"><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-100 print:text-black font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="text-slate-300 print:text-gray-700">$1</em>')
    // Horizontal Rule
    .replace(/^---$/gim, '<hr class="my-4 border-slate-700/60 print:border-gray-300" />')
    // Bullet points
    .replace(/^\s*[•\-\*]\s+(.*$)/gim, '<li class="flex items-start gap-2 mb-1.5"><span class="text-indigo-400 print:text-black font-bold select-none mt-0.5">▸</span><span class="text-slate-200 print:text-gray-900">$1</span></li>');

  // Wrap lists
  html = html.replace(/(<li.*<\/li>)/gims, '<ul class="my-2 space-y-1 pl-1">$1</ul>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p class="mb-3 text-slate-300 print:text-gray-900 leading-relaxed text-sm">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
}

// Toast notification helper
function showToast(message: string, icon = '✨') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-slate-100 text-xs font-medium shadow-2xl shadow-indigo-500/20 backdrop-blur-xl transform translate-y-[-10px] opacity-0 transition-all duration-300';
  toast.innerHTML = `<span class="text-base">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-[-10px]', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Render app shell
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <!-- Ambient Luminous Backgrounds -->
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div class="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]"></div>
    <div class="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]"></div>
    <div class="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-cyan-600/08 rounded-full blur-[150px]"></div>
  </div>

  <!-- Toast Container -->
  <div id="toastContainer" class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

  <!-- Main Container -->
  <div class="relative z-10 min-h-screen flex flex-col">
    
    <!-- Navigation Bar -->
    <header class="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3.5 print:hidden transition-all">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        <!-- Brand -->
        <div class="flex items-center gap-3">
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div class="relative w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700/60 shadow-lg text-lg">
              ✨
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                CareerForge AI
              </span>
              <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300">
                PRO STUDIO
              </span>
            </div>
            <p class="text-[11px] text-slate-400 hidden sm:block">ATS-Engineered CV & Customized Application Letters with Gemini</p>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center gap-2.5">
          <!-- API Key Settings Button -->
          <button id="apiKeyModalBtn" class="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 text-slate-300 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <span id="apiKeyStatusDot" class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span id="apiKeyBtnLabel">Gemini API Key</span>
          </button>

          <!-- Sample Profile Button -->
          <button id="sampleBtn" class="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/40 text-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-indigo-500/20">
            <span>⚡</span>
            <span>Load Sample</span>
          </button>

          <!-- Clear Button -->
          <button id="clearBtn" title="Reset Form" class="text-xs px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer">
            ↺
          </button>
        </div>

      </div>
    </header>

    <!-- Main Workspace -->
    <main class="max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
      
      <!-- Left Column: Interactive Input Studio -->
      <section class="lg:col-span-6 flex flex-col gap-5 print:hidden">

        <!-- Card 1: Candidate Identity -->
        <div class="group bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all duration-200">
          <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
            <div class="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
              <span>Candidate Identity & Contact</span>
            </div>
            <span class="text-[11px] text-slate-500">Contact Header</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
              <input id="fullName" type="text" placeholder="e.g. Alex Morgan" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
              <input id="email" type="email" placeholder="alex.morgan@example.com" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
              <input id="phone" type="text" placeholder="+1 (555) 432-8765" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Location / Remote Status</label>
              <input id="location" type="text" placeholder="San Francisco, CA (Open to Remote)" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Portfolio, LinkedIn & GitHub Links</label>
              <input id="links" type="text" placeholder="linkedin.com/in/username | github.com/username" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
          </div>
        </div>

        <!-- Card 2: Professional Background & Skills -->
        <div class="group bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all duration-200 space-y-3.5">
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div class="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
              <span>Experience & Qualifications</span>
            </div>
            <span class="text-[11px] text-slate-500">Core Content</span>
          </div>

          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1">Professional Headline / Current Role</label>
            <input id="headline" type="text" placeholder="e.g. Senior Full-Stack Engineer & Cloud Architect" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
          </div>

          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1">Professional Summary / Bio</label>
            <textarea id="summary" rows="2" placeholder="Describe your career focus, superpowers, and high-level trajectory..." class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 resize-y"></textarea>
          </div>

          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1">Work History & Impactful Achievements</label>
            <textarea id="experience" rows="5" placeholder="• Role & Company (Year - Present):&#10;  - Quantifiable achievement or feature built...&#10;  - Metric-driven impact or architectural leadership..." class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 resize-y font-mono text-[11.5px]"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Education & Certifications</label>
              <textarea id="education" rows="2" placeholder="• B.S. in Computer Science - UC Berkeley&#10;• AWS Certified Solutions Architect" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Skills, Frameworks & Tools</label>
              <textarea id="skills" rows="2" placeholder="TypeScript, React, Python, Docker, AWS, PostgreSQL..." class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 resize-y"></textarea>
            </div>
          </div>
        </div>

        <!-- Card 3: Target Opportunity & Tone -->
        <div class="group bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all duration-200 space-y-3.5">
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div class="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">3</span>
              <span>Target Role & Strategic Tone</span>
            </div>
            <span class="text-[11px] text-slate-500">Matching Focus</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Target Position</label>
              <input id="jobTitle" type="text" placeholder="e.g. Staff Full-Stack Engineer" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-400 mb-1">Company Name</label>
              <input id="companyName" type="text" placeholder="e.g. Stripe" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600" />
            </div>
          </div>

          <!-- Interactive Tone Selector Pills -->
          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1.5">Writing Tone & Narrative Style</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="tonePillContainer">
              <button type="button" data-tone="Professional and confident" class="tone-pill active px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all cursor-pointer bg-indigo-600/25 border-indigo-500/80 text-white shadow-sm shadow-indigo-500/20">
                <span>👔</span>
                <span class="truncate">Confident & Pro</span>
              </button>
              <button type="button" data-tone="Modern and impact-driven" class="tone-pill px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all cursor-pointer bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700">
                <span>🚀</span>
                <span class="truncate">Impact-Driven</span>
              </button>
              <button type="button" data-tone="Executive and formal" class="tone-pill px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all cursor-pointer bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700">
                <span>💼</span>
                <span class="truncate">Executive</span>
              </button>
              <button type="button" data-tone="Creative and enthusiastic" class="tone-pill px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all cursor-pointer bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700">
                <span>💡</span>
                <span class="truncate">Creative</span>
              </button>
              <button type="button" data-tone="Concise and direct" class="tone-pill px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all cursor-pointer bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700">
                <span>⚡</span>
                <span class="truncate">Concise</span>
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-medium text-slate-400">
                Job Description & Key Requirements <span class="text-rose-400">*</span>
              </label>
              <span id="jdCharCount" class="text-[10px] text-slate-500">0 words</span>
            </div>
            <textarea id="jobDescription" rows="5" placeholder="Paste the target job description or requirements here..." class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 resize-y"></textarea>
          </div>
        </div>

        <!-- Primary CTA Generate Button -->
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-40 group-hover:opacity-80 transition duration-300"></div>
          <button id="generateBtn" class="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer text-sm tracking-wide">
            <span id="btnIcon" class="text-lg">✨</span>
            <span id="btnText">Generate Tailored CV & Application Letter</span>
            <span class="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/10 text-white/80">Ctrl + Enter</span>
          </button>
        </div>

      </section>

      <!-- Right Column: Document Preview & Output Studio -->
      <section class="lg:col-span-6 flex flex-col h-full lg:sticky lg:top-20">
        <div class="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-3xl flex flex-col min-h-[700px] shadow-2xl overflow-hidden">
          
          <!-- Studio Top Toolbar -->
          <div class="border-b border-slate-800/80 bg-slate-950/60 p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            
            <!-- Document Tabs -->
            <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button id="tabLetter" class="tab-btn active px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-600 text-white cursor-pointer shadow-sm">
                ✉️ Cover Letter
              </button>
              <button id="tabCv" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer">
                📄 Tailored CV
              </button>
              <button id="tabHighlights" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer">
                🎯 Match Insights
              </button>
            </div>

            <!-- View Switcher & Actions -->
            <div class="flex items-center gap-2">
              <!-- View Mode Toggle (Formatted vs Raw) -->
              <div class="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button id="viewFormattedBtn" class="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-medium transition cursor-pointer">
                  Styled
                </button>
                <button id="viewRawBtn" class="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 transition cursor-pointer">
                  Markdown
                </button>
              </div>

              <!-- Copy Button -->
              <button id="copyBtn" title="Copy to clipboard" class="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60 hover:border-slate-600">
                <span id="copyIcon">📋</span>
                <span id="copyText">Copy</span>
              </button>

              <!-- Download Button -->
              <button id="downloadBtn" title="Download active document" class="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60 hover:border-slate-600">
                <span>📥</span>
                <span class="hidden sm:inline">Export</span>
              </button>

              <!-- Print / PDF Button -->
              <button id="printBtn" title="Print / PDF" class="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 cursor-pointer border border-slate-700/60 hover:border-slate-600">
                <span>🖨️</span>
              </button>
            </div>

          </div>

          <!-- Document Workspace -->
          <div class="p-6 sm:p-8 flex-1 overflow-y-auto relative bg-gradient-to-b from-slate-900/30 to-slate-950/30">
            
            <!-- Empty State -->
            <div id="emptyState" class="h-full min-h-[480px] flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div class="relative">
                <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/10">
                  📁
                </div>
                <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-xs">
                  ✨
                </div>
              </div>

              <div class="max-w-sm space-y-2">
                <h3 class="text-lg font-bold text-slate-100">Ready to Engineer Your Application</h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Fill in your credentials or click <strong class="text-indigo-400 font-semibold cursor-pointer hover:underline" id="emptySampleTrigger">Load Sample Profile</strong> to preview an executive tailored package.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md pt-2">
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <div class="text-sm mb-1">🎯</div>
                  <div class="text-[11px] font-semibold text-slate-300">98% ATS Fit</div>
                  <div class="text-[10px] text-slate-500">Keyword aligned</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <div class="text-sm mb-1">⚡</div>
                  <div class="text-[11px] font-semibold text-slate-300">Custom Story</div>
                  <div class="text-[10px] text-slate-500">Zero clichés</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <div class="text-sm mb-1">📄</div>
                  <div class="text-[11px] font-semibold text-slate-300">Dual Export</div>
                  <div class="text-[10px] text-slate-500">Markdown & PDF</div>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div id="outputContainer" class="hidden">
              <div id="docStatsBar" class="mb-4 pb-3 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div class="flex items-center gap-2">
                  <span id="docTypeBadge" class="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-medium">Cover Letter</span>
                  <span id="docWordCount">0 words</span>
                </div>
                <div id="docReadingTime">~1 min read</div>
              </div>

              <!-- Formatted Mode -->
              <div id="formattedOutput" class="text-slate-200 leading-relaxed text-sm print:text-black"></div>

              <!-- Raw Markdown Mode -->
              <div id="rawOutput" class="hidden">
                <pre id="rawContent" class="text-xs font-mono text-slate-300 bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed"></pre>
              </div>
            </div>

            <!-- Animated Multi-Stage Loading Overlay -->
            <div id="loadingOverlay" class="hidden absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30 space-y-6">
              <div class="relative w-16 h-16">
                <div class="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <div class="absolute inset-2 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                <div class="absolute inset-0 flex items-center justify-center text-lg">✨</div>
              </div>

              <div class="text-center space-y-2 max-w-sm">
                <h4 id="loadingStepTitle" class="text-sm font-bold text-slate-100 animate-pulse">
                  Analyzing Job Description Requirements...
                </h4>
                <p id="loadingStepDesc" class="text-xs text-slate-400 leading-relaxed">
                  Extracting core keywords, requirements, and company mission...
                </p>
              </div>

              <div class="w-48 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div id="loadingProgressBar" class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 w-1/4"></div>
              </div>
            </div>

          </div>

        </div>
      </section>

    </main>
  </div>

  <!-- API Key Modal (BYOK) -->
  <div id="apiKeyModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <div class="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
      <button id="closeApiKeyModal" class="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg cursor-pointer">✕</button>
      
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl">
          🔑
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Google Gemini API Key</h3>
          <p class="text-xs text-slate-400">Bring your own key for unlimited free usage</p>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Your API Key</label>
          <div class="relative">
            <input id="apiKeyInput" type="password" placeholder="AIzaSy..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 pr-10 font-mono" />
            <button id="toggleKeyVisibility" type="button" class="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer">👁️</button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-slate-300 space-y-1">
          <div class="font-semibold text-indigo-300 flex items-center gap-1.5">
            <span>💡</span> How to get a free key in 30 seconds:
          </div>
          <p class="text-slate-400">
            1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-indigo-400 underline font-medium hover:text-indigo-300">Google AI Studio</a>.
          </p>
          <p class="text-slate-400">
            2. Click <strong>"Create API Key"</strong> (100% free with no credit card required).
          </p>
          <p class="text-slate-400">
            3. Paste it here. Your key stays in your browser's private storage only.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 pt-2">
        <button id="removeApiKeyBtn" class="text-xs px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition cursor-pointer">
          Remove Key
        </button>
        <div class="flex items-center gap-2">
          <button id="cancelApiKeyBtn" class="text-xs px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition cursor-pointer">
            Cancel
          </button>
          <button id="saveApiKeyBtn" class="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer shadow-md shadow-indigo-600/30">
            Save Key
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// Input references
const fullNameInput = document.querySelector<HTMLInputElement>('#fullName')!;
const emailInput = document.querySelector<HTMLInputElement>('#email')!;
const phoneInput = document.querySelector<HTMLInputElement>('#phone')!;
const locationInput = document.querySelector<HTMLInputElement>('#location')!;
const linksInput = document.querySelector<HTMLInputElement>('#links')!;
const headlineInput = document.querySelector<HTMLInputElement>('#headline')!;
const summaryInput = document.querySelector<HTMLTextAreaElement>('#summary')!;
const experienceInput = document.querySelector<HTMLTextAreaElement>('#experience')!;
const educationInput = document.querySelector<HTMLTextAreaElement>('#education')!;
const skillsInput = document.querySelector<HTMLTextAreaElement>('#skills')!;
const jobTitleInput = document.querySelector<HTMLInputElement>('#jobTitle')!;
const companyNameInput = document.querySelector<HTMLInputElement>('#companyName')!;
const jobDescriptionInput = document.querySelector<HTMLTextAreaElement>('#jobDescription')!;
const jdCharCount = document.querySelector<HTMLSpanElement>('#jdCharCount')!;

// Buttons & Actions
const sampleBtn = document.querySelector<HTMLButtonElement>('#sampleBtn')!;
const clearBtn = document.querySelector<HTMLButtonElement>('#clearBtn')!;
const emptySampleTrigger = document.querySelector<HTMLElement>('#emptySampleTrigger')!;
const generateBtn = document.querySelector<HTMLButtonElement>('#generateBtn')!;
const btnText = document.querySelector<HTMLSpanElement>('#btnText')!;
const btnIcon = document.querySelector<HTMLSpanElement>('#btnIcon')!;

const tabLetter = document.querySelector<HTMLButtonElement>('#tabLetter')!;
const tabCv = document.querySelector<HTMLButtonElement>('#tabCv')!;
const tabHighlights = document.querySelector<HTMLButtonElement>('#tabHighlights')!;

const viewFormattedBtn = document.querySelector<HTMLButtonElement>('#viewFormattedBtn')!;
const viewRawBtn = document.querySelector<HTMLButtonElement>('#viewRawBtn')!;

const emptyState = document.querySelector<HTMLDivElement>('#emptyState')!;
const outputContainer = document.querySelector<HTMLDivElement>('#outputContainer')!;
const formattedOutput = document.querySelector<HTMLDivElement>('#formattedOutput')!;
const rawOutput = document.querySelector<HTMLDivElement>('#rawOutput')!;
const rawContent = document.querySelector<HTMLPreElement>('#rawContent')!;
const docTypeBadge = document.querySelector<HTMLSpanElement>('#docTypeBadge')!;
const docWordCount = document.querySelector<HTMLSpanElement>('#docWordCount')!;
const docReadingTime = document.querySelector<HTMLDivElement>('#docReadingTime')!;

const copyBtn = document.querySelector<HTMLButtonElement>('#copyBtn')!;
const copyText = document.querySelector<HTMLSpanElement>('#copyText')!;
const copyIcon = document.querySelector<HTMLSpanElement>('#copyIcon')!;
const downloadBtn = document.querySelector<HTMLButtonElement>('#downloadBtn')!;
const printBtn = document.querySelector<HTMLButtonElement>('#printBtn')!;

const loadingOverlay = document.querySelector<HTMLDivElement>('#loadingOverlay')!;
const loadingStepTitle = document.querySelector<HTMLHeadingElement>('#loadingStepTitle')!;
const loadingStepDesc = document.querySelector<HTMLParagraphElement>('#loadingStepDesc')!;
const loadingProgressBar = document.querySelector<HTMLDivElement>('#loadingProgressBar')!;

// Modal Elements
const apiKeyModal = document.querySelector<HTMLDivElement>('#apiKeyModal')!;
const apiKeyModalBtn = document.querySelector<HTMLButtonElement>('#apiKeyModalBtn')!;
const closeApiKeyModal = document.querySelector<HTMLButtonElement>('#closeApiKeyModal')!;
const cancelApiKeyBtn = document.querySelector<HTMLButtonElement>('#cancelApiKeyBtn')!;
const saveApiKeyBtn = document.querySelector<HTMLButtonElement>('#saveApiKeyBtn')!;
const removeApiKeyBtn = document.querySelector<HTMLButtonElement>('#removeApiKeyBtn')!;
const apiKeyInput = document.querySelector<HTMLInputElement>('#apiKeyInput')!;
const toggleKeyVisibility = document.querySelector<HTMLButtonElement>('#toggleKeyVisibility')!;
const apiKeyStatusDot = document.querySelector<HTMLSpanElement>('#apiKeyStatusDot')!;
const apiKeyBtnLabel = document.querySelector<HTMLSpanElement>('#apiKeyBtnLabel')!;

// Word counter for Job Description
jobDescriptionInput.addEventListener('input', () => {
  const text = jobDescriptionInput.value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  jdCharCount.textContent = `${count} words`;
});

// Tone selector pills logic
document.querySelectorAll<HTMLButtonElement>('.tone-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll<HTMLButtonElement>('.tone-pill').forEach(p => {
      p.classList.remove('active', 'bg-indigo-600/25', 'border-indigo-500/80', 'text-white', 'shadow-sm', 'shadow-indigo-500/20');
      p.classList.add('bg-slate-950/50', 'border-slate-800', 'text-slate-400');
    });
    pill.classList.add('active', 'bg-indigo-600/25', 'border-indigo-500/80', 'text-white', 'shadow-sm', 'shadow-indigo-500/20');
    pill.classList.remove('bg-slate-950/50', 'border-slate-800', 'text-slate-400');
    selectedTone = pill.dataset.tone || 'Professional and confident';
  });
});

// Load sample profile
function loadSample() {
  fullNameInput.value = SAMPLE_DATA.fullName;
  emailInput.value = SAMPLE_DATA.email;
  phoneInput.value = SAMPLE_DATA.phone;
  locationInput.value = SAMPLE_DATA.location;
  linksInput.value = SAMPLE_DATA.links;
  headlineInput.value = SAMPLE_DATA.headline;
  summaryInput.value = SAMPLE_DATA.summary;
  experienceInput.value = SAMPLE_DATA.experience;
  educationInput.value = SAMPLE_DATA.education;
  skillsInput.value = SAMPLE_DATA.skills;
  jobTitleInput.value = SAMPLE_DATA.jobTitle;
  companyNameInput.value = SAMPLE_DATA.companyName;
  jobDescriptionInput.value = SAMPLE_DATA.jobDescription;

  // trigger word count update
  jobDescriptionInput.dispatchEvent(new Event('input'));

  // pick confident tone
  document.querySelectorAll<HTMLButtonElement>('.tone-pill')[0]?.click();

  showToast('Sample profile & Stripe job loaded!', '⚡');
}

sampleBtn.addEventListener('click', loadSample);
if (emptySampleTrigger) emptySampleTrigger.addEventListener('click', loadSample);

// Clear form
clearBtn.addEventListener('click', () => {
  if (confirm('Clear all inputs?')) {
    [fullNameInput, emailInput, phoneInput, locationInput, linksInput, headlineInput, jobTitleInput, companyNameInput].forEach(i => i.value = '');
    [summaryInput, experienceInput, educationInput, skillsInput, jobDescriptionInput].forEach(t => t.value = '');
    jobDescriptionInput.dispatchEvent(new Event('input'));
    showToast('Form cleared', '↺');
  }
});

// API Key Modal management
function updateApiKeyStatusBadge() {
  const key = getSavedApiKey();
  if (key) {
    apiKeyStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    apiKeyBtnLabel.textContent = 'Custom API Key';
  } else {
    apiKeyStatusDot.className = 'w-2 h-2 rounded-full bg-indigo-400';
    apiKeyBtnLabel.textContent = 'API Key (Server)';
  }
}
updateApiKeyStatusBadge();

apiKeyModalBtn.addEventListener('click', () => {
  apiKeyInput.value = getSavedApiKey();
  apiKeyModal.classList.remove('hidden');
});

function hideModal() {
  apiKeyModal.classList.add('hidden');
}

closeApiKeyModal.addEventListener('click', hideModal);
cancelApiKeyBtn.addEventListener('click', hideModal);
apiKeyModal.addEventListener('click', (e) => {
  if (e.target === apiKeyModal) hideModal();
});

saveApiKeyBtn.addEventListener('click', () => {
  setSavedApiKey(apiKeyInput.value);
  hideModal();
  showToast('API Key saved locally in your browser!', '🔑');
});

removeApiKeyBtn.addEventListener('click', () => {
  setSavedApiKey('');
  apiKeyInput.value = '';
  hideModal();
  showToast('Custom API Key removed (using server fallback)', '🗑️');
});

toggleKeyVisibility.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyVisibility.textContent = '🔒';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyVisibility.textContent = '👁️';
  }
});

// Render Active Tab Content
function renderActiveTab() {
  if (!currentData) return;

  // Reset tab button styles
  [tabLetter, tabCv, tabHighlights].forEach(b => {
    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
    b.classList.add('text-slate-400');
  });

  emptyState.classList.add('hidden');
  outputContainer.classList.remove('hidden');

  let activeContent = '';
  let badgeLabel = '';

  if (activeTab === 'letter') {
    tabLetter.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    tabLetter.classList.remove('text-slate-400');
    activeContent = currentData.coverLetter;
    badgeLabel = 'Application Cover Letter';
  } else if (activeTab === 'cv') {
    tabCv.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    tabCv.classList.remove('text-slate-400');
    activeContent = currentData.cv;
    badgeLabel = 'Tailored ATS CV';
  } else if (activeTab === 'highlights') {
    tabHighlights.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    tabHighlights.classList.remove('text-slate-400');
    badgeLabel = 'Match Analysis';
  }

  // Update statistics
  docTypeBadge.textContent = badgeLabel;
  const words = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
  docWordCount.textContent = `${words} words`;
  const minutes = Math.max(1, Math.round(words / 200));
  docReadingTime.textContent = `~${minutes} min read`;

  // Render content
  if (activeTab === 'highlights') {
    const highlightsHtml = `
      <div class="space-y-4">
        <div class="border-b border-slate-800/80 pb-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>🎯</span> Job Alignment & Strategic Strengths
          </h2>
          <p class="text-xs text-slate-400">These key competencies directly answer the primary qualifications in the job description:</p>
        </div>
        <div class="space-y-3 pt-1">
          ${(currentData.matchHighlights || []).map((highlight, idx) => `
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition duration-200 flex items-start gap-3.5 shadow-sm">
              <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
                0${idx + 1}
              </div>
              <div class="space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Match Factor</span>
                <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">${highlight}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    formattedOutput.innerHTML = highlightsHtml;
    rawContent.textContent = (currentData.matchHighlights || []).map((h, i) => `${i + 1}. ${h}`).join('\n\n');
    formattedOutput.innerHTML = parseMarkdown(activeContent);
    rawContent.textContent = activeContent;
  }

  if (viewMode === 'raw') {
    rawOutput.classList.remove('hidden');
    formattedOutput.classList.add('hidden');
  } else {
    formattedOutput.classList.remove('hidden');
    rawOutput.classList.add('hidden');
  }
}

// Tab click listeners
tabLetter.addEventListener('click', () => {
  activeTab = 'letter';
  renderActiveTab();
});
tabCv.addEventListener('click', () => {
  activeTab = 'cv';
  renderActiveTab();
});
tabHighlights.addEventListener('click', () => {
  activeTab = 'highlights';
  renderActiveTab();
});

// View mode switchers (Styled vs Raw Markdown)
viewFormattedBtn.addEventListener('click', () => {
  viewMode = 'formatted';
  viewFormattedBtn.classList.add('bg-slate-800', 'text-slate-200', 'font-medium');
  viewFormattedBtn.classList.remove('text-slate-400');
  viewRawBtn.classList.remove('bg-slate-800', 'text-slate-200', 'font-medium');
  viewRawBtn.classList.add('text-slate-400');
  formattedOutput.classList.remove('hidden');
  rawOutput.classList.add('hidden');
});

viewRawBtn.addEventListener('click', () => {
  viewMode = 'raw';
  viewRawBtn.classList.add('bg-slate-800', 'text-slate-200', 'font-medium');
  viewRawBtn.classList.remove('text-slate-400');
  viewFormattedBtn.classList.remove('bg-slate-800', 'text-slate-200', 'font-medium');
  viewFormattedBtn.classList.add('text-slate-400');
  rawOutput.classList.remove('hidden');
  formattedOutput.classList.add('hidden');
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  if (!currentData) {
    showToast('Generate your application first!', '⚠️');
    return;
  }

  let textToCopy = '';
  if (activeTab === 'letter') textToCopy = currentData.coverLetter;
  else if (activeTab === 'cv') textToCopy = currentData.cv;
  else if (activeTab === 'highlights') textToCopy = currentData.matchHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n\n');

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyText.textContent = 'Copied!';
    copyIcon.textContent = '✓';
    showToast('Document copied to clipboard', '📋');
    setTimeout(() => {
      copyText.textContent = 'Copy';
      copyIcon.textContent = '📋';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
});

// Download active document
downloadBtn.addEventListener('click', () => {
  if (!currentData) {
    showToast('Generate your application first!', '⚠️');
    return;
  }

  const prefix = (fullNameInput.value || 'Candidate').trim().replace(/\s+/g, '_');
  let filename = '';
  let content = '';

  if (activeTab === 'letter') {
    filename = `${prefix}_Cover_Letter.txt`;
    content = currentData.coverLetter;
  } else if (activeTab === 'cv') {
    filename = `${prefix}_Tailored_CV.md`;
    content = currentData.cv;
  } else {
    filename = `${prefix}_Match_Analysis.txt`;
    content = currentData.matchHighlights.join('\n\n• ');
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`, '📥');
});

// Print or Save as PDF
printBtn.addEventListener('click', () => {
  if (!currentData) {
    showToast('Generate your application first!', '⚠️');
    return;
  }
  window.print();
});

// Keyboard shortcut: Ctrl+Enter (or Cmd+Enter) to generate
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    generateBtn.click();
  }
});

// Multi-stage progress animator
let loadingInterval: any = null;
function startLoadingProgress() {
  const stages = [
    { title: 'Analyzing Job Description...', desc: 'Extracting key responsibilities, requirements, and mission...', pct: '25%' },
    { title: 'Aligning Candidate Strengths...', desc: 'Mapping your background achievements directly to job pain points...', pct: '50%' },
    { title: 'Engineering ATS-Optimized CV...', desc: 'Restructuring competencies, quantifiable impact, and keywords...', pct: '75%' },
    { title: 'Polishing Cover Letter Narrative...', desc: 'Crafting a high-conversion, human-sounding pitch...', pct: '92%' }
  ];

  let currentStage = 0;
  loadingStepTitle.textContent = stages[0].title;
  loadingStepDesc.textContent = stages[0].desc;
  loadingProgressBar.style.width = stages[0].pct;

  loadingInterval = setInterval(() => {
    currentStage = (currentStage + 1) % stages.length;
    loadingStepTitle.textContent = stages[currentStage].title;
    loadingStepDesc.textContent = stages[currentStage].desc;
    loadingProgressBar.style.width = stages[currentStage].pct;
  }, 1800);
}

function stopLoadingProgress() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

// Generate Request Trigger
generateBtn.addEventListener('click', async () => {
  const jobDescription = jobDescriptionInput.value.trim();
  if (!jobDescription) {
    showToast('Please provide the Target Job Description.', '⚠️');
    jobDescriptionInput.focus();
    return;
  }

  const payload = {
    fullName: fullNameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    location: locationInput.value.trim(),
    links: linksInput.value.trim(),
    headline: headlineInput.value.trim(),
    summary: summaryInput.value.trim(),
    experience: experienceInput.value.trim(),
    education: educationInput.value.trim(),
    skills: skillsInput.value.trim(),
    jobTitle: jobTitleInput.value.trim(),
    companyName: companyNameInput.value.trim(),
    tone: selectedTone,
    jobDescription: jobDescription
  };

  // Prepare headers including user's custom key if provided
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const customKey = getSavedApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  // Set UI state
  generateBtn.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = 'Forging Your Documents...';
  loadingOverlay.classList.remove('hidden');
  startLoadingProgress();

  try {
    const res = await fetch(`${API_BASE_URL}/api/generate-application`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      currentData = data.data;
    } else if (data.letter || data.cv) {
      currentData = {
        coverLetter: data.letter || '',
        cv: data.cv || '',
        matchHighlights: data.matchHighlights || []
      };
    } else {
      throw new Error('Unexpected response format.');
    }

    activeTab = 'letter';
    renderActiveTab();
    showToast('Application Package Generated Successfully!', '🎉');
  } catch (err: any) {
    console.error('Generation Error:', err);
    alert(`Generation Error: ${err.message || err}\n\nMake sure your Python backend is running:\n..\\.venv\\Scripts\\python.exe main.py`);
  } finally {
    stopLoadingProgress();
    loadingOverlay.classList.add('hidden');
    generateBtn.disabled = false;
    btnIcon.textContent = '✨';
    btnText.textContent = 'Generate Tailored CV & Application Letter';
  }
});