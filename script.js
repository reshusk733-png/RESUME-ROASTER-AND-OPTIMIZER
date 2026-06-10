let currentMode = 'roast';

function setMode(mode) {
  currentMode = mode;
  const roastBtn = document.getElementById('btnRoast');
  const optimizeBtn = document.getElementById('btnOptimize');
  const actionBtn = document.getElementById('actionBtn');
  const btnIcon = document.getElementById('btnIcon');
  const btnText = document.getElementById('btnText');
  const jdCard = document.getElementById('jdCard');
  const loadingInner = document.getElementById('loadingInner');

  if (mode === 'roast') {
    roastBtn.className = 'mode-btn active-roast';
    optimizeBtn.className = 'mode-btn';
    actionBtn.className = 'fire-btn roast-btn';
    btnIcon.textContent = '🔥';
    btnText.textContent = 'Roast My Resume';
    jdCard.classList.remove('visible');
    loadingInner.className = 'loading-bar-inner roast-color';
  } else {
    optimizeBtn.className = 'mode-btn active-optimize';
    roastBtn.className = 'mode-btn';
    actionBtn.className = 'fire-btn optimize-btn';
    btnIcon.textContent = '✨';
    btnText.textContent = 'Optimize My Resume';
    jdCard.classList.add('visible');
    loadingInner.className = 'loading-bar-inner optimize-color';
  }

  // Reset results
  document.getElementById('resultPanel').classList.remove('visible');
  document.getElementById('loadingBar').classList.remove('visible');

  // Show/hide guardrail notice
  const notice = document.getElementById('guardrailNotice');
  if (notice) notice.style.display = mode === 'roast' ? 'flex' : 'none';
}

function updateWordCount() {
  const text = document.getElementById('resumeText').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const wcText = document.getElementById('wcText');
  const wcBar = document.getElementById('wcBar');
  const wcHint = document.getElementById('wcHint');
  const wcRow = document.getElementById('wordCounter');

  wcText.textContent = words + ' words';

  // 600 words ~ 1 page resume, 1200 = 2 pages, cap bar at 1200
  const pct = Math.min(100, Math.round((words / 1200) * 100));
  wcBar.style.width = pct + '%';

  wcRow.className = 'word-counter';
  if (words === 0) {
    wcHint.textContent = 'paste your resume above';
  } else if (words < 150) {
    wcHint.textContent = 'add more — this looks like a summary only';
    wcRow.classList.add('warn');
  } else if (words < 400) {
    wcHint.textContent = 'good start — add full bullet points for best results';
    wcRow.classList.add('warn');
  } else if (words <= 1200) {
    wcHint.textContent = 'great length — full resume detected';
    wcRow.classList.add('good');
  } else {
    wcHint.textContent = words + ' words — long resume, analysis may take a moment';
    wcRow.classList.add('good');
  }
}

function buildPrompt(mode, resume, jd) {
  if (mode === 'roast') {
    return `You are a sharp, witty resume critic. Your job is to roast the WRITING on this resume — the weak verbs, vague claims, missing metrics, and missed opportunities. Be brutally honest and funny, but STRICT RULE: every critique must attack the content and phrasing, never the person. Say "this bullet is so vague it could describe a houseplant" not "you sound incompetent." Assume the candidate is talented — the resume just isn't showing it yet. Every roast point must end with a concrete fix.

STRICT GUARDRAILS — you must follow these absolutely:
- Never question the candidate's intelligence, work ethic, or personal worth
- Never use language that could feel humiliating or discouraging
- Every negative point MUST be paired with a specific, actionable improvement
- Roast the WORDS on the page, not the person who wrote them
- Assume all experience is real and valuable — it's just described poorly

Structure your response EXACTLY like this:

🔥 THE VERDICT
[2-3 sentence brutal summary of the resume's biggest writing problems]

💀 WHAT'S KILLING YOUR CHANCES
[4-6 specific critique of weak phrases, missing metrics, or vague claims — each with a rewrite example]

😬 CRINGE MOMENTS
[2-3 clichés or embarrassing phrasings with why they hurt and how to fix them]

⚡ WHAT ACTUALLY WORKS
[2-3 genuine strengths in the writing — be specific]

🎯 FIX IT: TOP 5 REWRITES
[The 5 highest-impact changes, each as a before → after example]

📊 SCORES (rate each 1-10, format: "Label: X/10")
Impact: X/10
Clarity: X/10
ATS Compatibility: X/10
Uniqueness: X/10
Overall: X/10

Resume:
${resume}`;
  } else {
    const jdSection = jd ? `\n\nTarget Job Description:\n${jd}` : '';
    return `You are a top-tier resume consultant and ATS expert. Optimize this resume with specific, actionable improvements.

Structure your response EXACTLY like this:

✨ EXECUTIVE SUMMARY
[What this resume does well and the main opportunity]

🎯 CRITICAL FIXES (must do)
[4-5 high-priority changes with specific before/after examples where possible]

🚀 POWER UPGRADES
[3-4 enhancements that will differentiate the candidate]

🤖 ATS OPTIMIZATION
[Specific keywords to add, formatting fixes, and compatibility improvements]
${jd ? '\n🔑 JOB-SPECIFIC ALIGNMENT\n[How to tailor for this specific role, missing keywords, alignment gaps]' : ''}

✏️ REWRITTEN SUMMARY SECTION
[Write an improved professional summary/objective they can use directly]

📊 SCORES (rate each 1-10, format: "Label: X/10")
Impact: X/10
Clarity: X/10
ATS Compatibility: X/10
Keyword Density: X/10
Overall: X/10

Resume:
${resume}${jdSection}`;
  }
}

function extractScores(text) {
  const scores = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^(.+?):\s*(\d+)\/10/);
    if (match) {
      scores.push({ label: match[1].trim(), value: parseInt(match[2]) });
    }
  }
  return scores;
}

function getScoreColor(val) {
  if (val >= 8) return 'linear-gradient(90deg, #69FF47, #00E5FF)';
  if (val >= 6) return 'linear-gradient(90deg, #FFAB00, #FF6D00)';
  return 'linear-gradient(90deg, #FF3D00, #FF6D00)';
}

function renderScores(scores) {
  const meter = document.getElementById('scoreMeter');
  const rows = document.getElementById('scoreRows');
  if (!scores.length) return;

  rows.innerHTML = scores.map(s => `
    <div class="score-row">
      <div class="score-label">${s.label}</div>
      <div class="score-track">
        <div class="score-fill" style="width:0%; background:${getScoreColor(s.value)}" data-target="${s.value * 10}"></div>
      </div>
      <div class="score-num" style="color:${s.value >= 8 ? 'var(--neon-green)' : s.value >= 6 ? 'var(--flame-3)' : 'var(--flame-1)'}">${s.value}</div>
    </div>
  `).join('');

  meter.classList.add('visible');

  // Animate bars after a tick
  setTimeout(() => {
    document.querySelectorAll('.score-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

async function analyze() {
  const resume = document.getElementById('resumeText').value.trim();
  const jd = document.getElementById('jdText').value.trim();

  if (!resume) {
    showToast('⚠️ Paste your resume first!');
    document.getElementById('resumeText').focus();
    return;
  }

  const actionBtn = document.getElementById('actionBtn');
  const loadingBar = document.getElementById('loadingBar');
  const resultPanel = document.getElementById('resultPanel');
  const resultBody = document.getElementById('resultBody');
  const resultHeader = document.getElementById('resultHeader');
  const resultTitle = document.getElementById('resultTitle');
  const scoreMeter = document.getElementById('scoreMeter');

  actionBtn.disabled = true;
  document.getElementById('btnText').textContent = currentMode === 'roast' ? 'Roasting...' : 'Optimizing...';
  loadingBar.classList.add('visible');
  resultPanel.classList.remove('visible');
  scoreMeter.classList.remove('visible');
  resultBody.textContent = '';

  if (currentMode === 'roast') {
    resultHeader.className = 'result-header roast-header';
    resultTitle.textContent = '🔥 The Roast';
  } else {
    resultHeader.className = 'result-header optimize-header';
    resultTitle.textContent = '✨ Optimization Report';
  }

  try {
    const prompt = buildPrompt(currentMode, resume, jd);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      resultBody.textContent = '⚠️ API Error: ' + (data.error.message || JSON.stringify(data.error));
    } else {
      const text = data.content.map(b => b.text || '').join('');
      resultBody.textContent = text;

      const scores = extractScores(text);
      renderScores(scores);
    }

    resultPanel.classList.add('visible');

    // Scroll to result
    setTimeout(() => resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  } catch (err) {
    resultBody.textContent = '⚠️ Something went wrong: ' + err.message;
    resultPanel.classList.add('visible');
  } finally {
    actionBtn.disabled = false;
    document.getElementById('btnText').textContent = currentMode === 'roast' ? 'Roast My Resume' : 'Optimize My Resume';
    loadingBar.classList.remove('visible');
  }
}

function copyResult() {
  const text = document.getElementById('resultBody').textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}