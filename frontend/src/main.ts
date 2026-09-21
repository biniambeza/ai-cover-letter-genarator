import './style.css';

interface ApplicationData {
  coverLetter: string;
  cv: string;
  matchHighlights: string[];
}

// Sample profile data for quick testing
const SAMPLE_DATA = {
  fullName: 'Elena Rostova',
  email: 'elena.rostova@example.com',
  phone: '+1 (555) 432-8765',
  location: 'San Francisco, CA (Open to Remote)',
  links: 'linkedin.com/in/elenarostova | github.com/erostova',
  headline: 'Senior Full-Stack Engineer & Cloud Architect',
  summary: 'Passionate software engineer with 6+ years of experience designing high-throughput web applications, microservices, and distributed cloud systems. Proven track record of scaling user-facing platforms to millions of monthly active users while reducing infrastructure costs.',
  experience: `• Senior Software Engineer at FinTech Velocity (2022 - Present):
  - Architected real-time payments microservice in Go & Node.js, handling 15,000+ TPS with 99.99% uptime.
  - Led migration from monolithic architecture to AWS ECS and PostgreSQL, lowering server costs by 35%.
  - Mentored 5 junior/mid-level engineers and established CI/CD automated testing standards.

• Full-Stack Engineer at CloudScale Labs (2019 - 2022):
  - Built responsive enterprise analytics dashboard using React, TypeScript, and Tailwind CSS.
  - Implemented GraphQL APIs and Redis caching layer, decreasing average API response time from 320ms to 45ms.
  - Collaborated with product designers to improve user onboarding conversion by 22%.`,
  education: `• B.S. in Computer Science - University of California, Berkeley (2015 - 2019)
• AWS Certified Solutions Architect - Professional (2023)`,
  skills: 'TypeScript, JavaScript, React, Next.js, Node.js, Python, Go, PostgreSQL, Redis, Docker, Kubernetes, AWS, GraphQL, REST APIs, System Design, CI/CD, Agile/Scrum',
  jobTitle: 'Staff Frontend & Full-Stack Engineer',
  companyName: 'Stripe',
  jobDescription: `About the Role:
We are seeking an experienced Staff Full-Stack Engineer to lead the architecture of our next-generation merchant checkout experience. You will collaborate closely with product management and design to build ultra-responsive, accessible, and resilient web interfaces.

Key Responsibilities:
- Design and implement mission-critical frontend architectures with modern TypeScript and React.
- Build high-availability backend APIs and integration layers.
- Drive engineering excellence, code reviews, and performance optimizations.
- Partner with product teams to translate complex business workflows into simple user experiences.

Qualifications:
- 5+ years building high-scale web applications.
- Deep expertise in modern JavaScript/TypeScript, React, and web performance.
- Experience with distributed backend systems, databases, and cloud infrastructure.
- Outstanding communication and mentorship abilities.`,
  tone: 'Professional and confident'
};

// Application state
let currentData: ApplicationData | null = null;
let activeTab: 'letter' | 'cv' | 'highlights' = 'letter';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 no-print">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-xl">
            ✨
          </div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              AI Career Application Studio
            </h1>
            <p class="text-xs text-slate-400">Generate ATS-tailored CVs & persuasive cover letters simultaneously</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button id="sampleBtn" class="text-xs px-3.5 py-2 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/60 transition flex items-center gap-1.5 cursor-pointer">
            <span>⚡</span> Load Sample Profile
          </button>
          <button id="clearBtn" class="text-xs px-3.5 py-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800 transition cursor-pointer">
            Clear Form
          </button>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
      
      <!-- Left: Inputs (Form) -->
      <section class="lg:col-span-6 flex flex-col gap-5 no-print">
        
        <!-- Accordion 1: Personal & Contact -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <span>👤</span>
            <h2>Personal & Contact Details</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input id="fullName" type="text" placeholder="e.g. Elena Rostova" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input id="email" type="email" placeholder="elena@example.com" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Phone</label>
              <input id="phone" type="text" placeholder="+1 (555) 012-3456" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Location</label>
              <input id="location" type="text" placeholder="City, State / Remote" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-400 mb-1">Portfolio / LinkedIn / GitHub</label>
              <input id="links" type="text" placeholder="linkedin.com/in/username | github.com/username" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
          </div>
        </div>

        <!-- Accordion 2: Professional Background -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <span>💼</span>
            <h2>Experience & Qualifications</h2>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Current Title / Professional Headline</label>
            <input id="headline" type="text" placeholder="e.g. Senior Full-Stack Engineer" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Professional Summary / Bio</label>
            <textarea id="summary" rows="2" placeholder="Brief summary of your trajectory, passions, and core strengths..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Work History & Key Achievements</label>
            <textarea id="experience" rows="5" placeholder="List your roles, companies, dates, and impactful bullet points..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Education & Certifications</label>
              <textarea id="education" rows="2" placeholder="Degrees, universities, honors, certifications..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Skills & Tools</label>
              <textarea id="skills" rows="2" placeholder="React, Node.js, Python, AWS, Docker, Git..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
            </div>
          </div>
        </div>

        <!-- Accordion 3: Target Job & Tone -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <span>🎯</span>
            <h2>Target Opportunity</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Target Job Title</label>
              <input id="jobTitle" type="text" placeholder="e.g. Staff Full-Stack Engineer" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input id="companyName" type="text" placeholder="e.g. Stripe" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Desired Tone</label>
              <select id="tone" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                <option value="Professional and confident">Professional & Confident</option>
                <option value="Modern and impact-driven">Modern & Impact-Driven</option>
                <option value="Executive and formal">Executive & Formal</option>
                <option value="Creative and enthusiastic">Creative & Enthusiastic</option>
                <option value="Concise and direct">Concise & Direct</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Job Description & Requirements <span class="text-rose-400">*</span></label>
            <textarea id="jobDescription" rows="5" placeholder="Paste the complete job posting or key requirements here..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
          </div>
        </div>

        <!-- Submit Button -->
        <button id="generateBtn" class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer">
          <span id="btnIcon">✨</span>
          <span id="btnText">Generate Tailored CV & Application Letter</span>
        </button>

      </section>

      <!-- Right: Generated Output Workspace -->
      <section class="lg:col-span-6 flex flex-col">
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-full min-h-[600px] shadow-xl overflow-hidden">
          
          <!-- Tab Navigation & Action Bar -->
          <div class="border-b border-slate-800 bg-slate-950/70 p-3 flex flex-wrap items-center justify-between gap-2 no-print">
            <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="tabLetter" class="tab-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-600 text-white cursor-pointer">
                ✉️ Cover Letter
              </button>
              <button id="tabCv" class="tab-btn px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer">
                📄 Tailored CV
              </button>
              <button id="tabHighlights" class="tab-btn px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer">
                🎯 Match Highlights
              </button>
            </div>

            <!-- Document Actions -->
            <div class="flex items-center gap-2">
              <button id="copyBtn" title="Copy active document to clipboard" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60">
                <span id="copyIcon">📋</span>
                <span id="copyText">Copy</span>
              </button>
              <button id="downloadBtn" title="Download active document" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60">
                <span>💾</span> Download
              </button>
              <button id="printBtn" title="Print or save as PDF" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60">
                <span>🖨️</span> Print/PDF
              </button>
            </div>
          </div>

          <!-- Document Content Area -->
          <div class="p-6 flex-1 overflow-y-auto bg-slate-900/40 relative">
            
            <!-- Empty Placeholder State -->
            <div id="emptyState" class="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
              <div class="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center text-3xl">
                📂
              </div>
              <div class="max-w-md">
                <h3 class="text-base font-semibold text-slate-200 mb-1">Your Application Package Will Appear Here</h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Fill in your background details and the target job description on the left (or click <strong class="text-indigo-400 font-medium">"Load Sample Profile"</strong> to test), then click Generate.
                </p>
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500 pt-2">
                <span class="flex items-center gap-1">✓ ATS-Optimized CV</span>
                <span class="flex items-center gap-1">✓ Custom Cover Letter</span>
                <span class="flex items-center gap-1">✓ Match Insights</span>
              </div>
            </div>

            <!-- Rendered Document -->
            <div id="outputContainer" class="hidden h-full">
              <div id="outputContent" class="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-indigo-500 selection:text-white"></div>
            </div>

            <!-- Loading Overlay -->
            <div id="loadingOverlay" class="hidden absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
              <div class="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p class="text-sm font-medium text-indigo-300 animate-pulse">Crafting tailored CV & Cover Letter with Gemini...</p>
              <p class="text-xs text-slate-500">Analyzing job requirements and highlighting your matching skills</p>
            </div>

          </div>

        </div>
      </section>

    </main>
  </div>
`;

// Input elements
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
const toneSelect = document.querySelector<HTMLSelectElement>('#tone')!;
const jobDescriptionInput = document.querySelector<HTMLTextAreaElement>('#jobDescription')!;

// Buttons & displays
const sampleBtn = document.querySelector<HTMLButtonElement>('#sampleBtn')!;
const clearBtn = document.querySelector<HTMLButtonElement>('#clearBtn')!;
const generateBtn = document.querySelector<HTMLButtonElement>('#generateBtn')!;
const btnText = document.querySelector<HTMLSpanElement>('#btnText')!;
const btnIcon = document.querySelector<HTMLSpanElement>('#btnIcon')!;
const loadingOverlay = document.querySelector<HTMLDivElement>('#loadingOverlay')!;

const tabLetter = document.querySelector<HTMLButtonElement>('#tabLetter')!;
const tabCv = document.querySelector<HTMLButtonElement>('#tabCv')!;
const tabHighlights = document.querySelector<HTMLButtonElement>('#tabHighlights')!;

const emptyState = document.querySelector<HTMLDivElement>('#emptyState')!;
const outputContainer = document.querySelector<HTMLDivElement>('#outputContainer')!;
const outputContent = document.querySelector<HTMLDivElement>('#outputContent')!;

const copyBtn = document.querySelector<HTMLButtonElement>('#copyBtn')!;
const copyText = document.querySelector<HTMLSpanElement>('#copyText')!;
const copyIcon = document.querySelector<HTMLSpanElement>('#copyIcon')!;
const downloadBtn = document.querySelector<HTMLButtonElement>('#downloadBtn')!;
const printBtn = document.querySelector<HTMLButtonElement>('#printBtn')!;

// Fill sample data
sampleBtn.addEventListener('click', () => {
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
  toneSelect.value = SAMPLE_DATA.tone;
});

// Clear form
clearBtn.addEventListener('click', () => {
  if (confirm('Clear all fields?')) {
    fullNameInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';
    locationInput.value = '';
    linksInput.value = '';
    headlineInput.value = '';
    summaryInput.value = '';
    experienceInput.value = '';
    educationInput.value = '';
    skillsInput.value = '';
    jobTitleInput.value = '';
    companyNameInput.value = '';
    jobDescriptionInput.value = '';
  }
});

// Tab switching
function renderActiveTab() {
  if (!currentData) return;

  // Reset tab button styles
  [tabLetter, tabCv, tabHighlights].forEach(b => {
    b.classList.remove('bg-indigo-600', 'text-white');
    b.classList.add('text-slate-400');
  });

  emptyState.classList.add('hidden');
  outputContainer.classList.remove('hidden');

  if (activeTab === 'letter') {
    tabLetter.classList.add('bg-indigo-600', 'text-white');
    tabLetter.classList.remove('text-slate-400');
    outputContent.textContent = currentData.coverLetter;
  } else if (activeTab === 'cv') {
    tabCv.classList.add('bg-indigo-600', 'text-white');
    tabCv.classList.remove('text-slate-400');
    outputContent.textContent = currentData.cv;
  } else if (activeTab === 'highlights') {
    tabHighlights.classList.add('bg-indigo-600', 'text-white');
    tabHighlights.classList.remove('text-slate-400');
    
    if (currentData.matchHighlights && currentData.matchHighlights.length > 0) {
      outputContent.innerHTML = `
        <div class="space-y-4">
          <div class="border-b border-slate-800 pb-3">
            <h3 class="text-base font-semibold text-indigo-400">Target Match Analysis</h3>
            <p class="text-xs text-slate-400">Key strengths that position you as an exceptional candidate for this role:</p>
          </div>
          <div class="space-y-3">
            ${currentData.matchHighlights.map((item, idx) => `
              <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span class="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                  ${idx + 1}
                </span>
                <p class="text-sm text-slate-200 leading-relaxed">${item}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      outputContent.textContent = 'No match highlights generated.';
    }
  }
}

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

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  if (!currentData) {
    alert('Please generate your documents first.');
    return;
  }

  let textToCopy = '';
  if (activeTab === 'letter') textToCopy = currentData.coverLetter;
  else if (activeTab === 'cv') textToCopy = currentData.cv;
  else if (activeTab === 'highlights') textToCopy = currentData.matchHighlights.join('\n\n• ');

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyText.textContent = 'Copied!';
    copyIcon.textContent = '✓';
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
    alert('Please generate your documents first.');
    return;
  }

  let filename = 'Application-Letter.txt';
  let content = '';

  if (activeTab === 'letter') {
    filename = `${(fullNameInput.value || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter.txt`;
    content = currentData.coverLetter;
  } else if (activeTab === 'cv') {
    filename = `${(fullNameInput.value || 'Candidate').replace(/\s+/g, '_')}_Tailored_CV.md`;
    content = currentData.cv;
  } else {
    filename = `${(fullNameInput.value || 'Candidate').replace(/\s+/g, '_')}_Match_Highlights.txt`;
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
});

// Print or PDF
printBtn.addEventListener('click', () => {
  if (!currentData) {
    alert('Please generate your documents first.');
    return;
  }
  window.print();
});

// Generate Request
generateBtn.addEventListener('click', async () => {
  const jobDescription = jobDescriptionInput.value.trim();
  if (!jobDescription) {
    alert('Please provide the Target Job Description.');
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
    tone: toneSelect.value,
    jobDescription: jobDescription
  };

  // UI loading state
  generateBtn.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = 'Generating Tailored Application...';
  loadingOverlay.classList.remove('hidden');

  try {
    const res = await fetch('http://127.0.0.1:5000/api/generate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      currentData = data.data;
      activeTab = 'letter';
      renderActiveTab();
    } else if (data.letter || data.cv) {
      currentData = {
        coverLetter: data.letter || '',
        cv: data.cv || '',
        matchHighlights: data.matchHighlights || []
      };
      activeTab = 'letter';
      renderActiveTab();
    } else {
      throw new Error('Unexpected response format from backend.');
    }
  } catch (err: any) {
    console.error(err);
    alert(`Generation Error: ${err.message || err}\n\nMake sure the Python backend is running:\ncd backend && python main.py`);
  } finally {
    generateBtn.disabled = false;
    btnIcon.textContent = '✨';
    btnText.textContent = 'Generate Tailored CV & Application Letter';
    loadingOverlay.classList.add('hidden');
  }
});