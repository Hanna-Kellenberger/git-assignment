// Read data injected by Flask via JSON script tags
const RESUME_ID      = JSON.parse(document.getElementById('resume-id').textContent);
const TEMPLATE_ID    = JSON.parse(document.getElementById('template-id').textContent);
const TEMPLATE_TYPE  = JSON.parse(document.getElementById('template-type').textContent);
const initialContent = JSON.parse(document.getElementById('resume-content').textContent);

let data = JSON.parse(JSON.stringify(initialContent));

let sections = {
  summary: true, experience: true, education: true,
  skills: true, projects: true, certifications: true
};

// Order of sections in the left panel and preview (personal is always first, not draggable)
const defaultOrder = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
let sectionOrder = (initialContent._sectionOrder || defaultOrder).filter(k => k !== 'personal');

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── COLLECT ──
function collectData() {
  const g = id => document.getElementById(id)?.value || '';
  data.name = g('f-name'); data.title = g('f-title');
  data.email = g('f-email'); data.phone = g('f-phone');
  data.location = g('f-location'); data.linkedin = g('f-linkedin');
  data.summary = g('f-summary');

  if (TEMPLATE_TYPE === 'university') {
    data.gpa = g('f-gpa');
    data.projects = [];
    document.querySelectorAll('.proj-entry').forEach(e => {
      data.projects.push({ name: e.querySelector('.proj-name').value, description: e.querySelector('.proj-desc').value });
    });
  }
  if (TEMPLATE_TYPE === 'professional') {
    data.certifications = [];
    document.querySelectorAll('.cert-input').forEach(e => { if(e.value.trim()) data.certifications.push(e.value.trim()); });
  }

  data.experience = [];
  document.querySelectorAll('.exp-entry').forEach(e => {
    const bullets = [];
    e.querySelectorAll('.bullet-input').forEach(b => { if(b.value.trim()) bullets.push(b.value.trim()); });
    data.experience.push({ role: e.querySelector('.exp-role').value, company: e.querySelector('.exp-company').value, dates: e.querySelector('.exp-dates').value, bullets });
  });

  data.education = [];
  document.querySelectorAll('.edu-entry').forEach(e => {
    data.education.push({ degree: e.querySelector('.edu-degree').value, school: e.querySelector('.edu-school').value, dates: e.querySelector('.edu-dates').value });
  });

  data._sectionOrder = [...sectionOrder];
}

// ── PREVIEW ──
function updatePreview() {
  collectData();
  const p = document.getElementById('resumePaper');
  if (TEMPLATE_TYPE === 'modern') renderModern(p);
  else if (TEMPLATE_TYPE === 'professional') renderProfessional(p);
  else renderUniversity(p);
}

function renderModern(p) {
  const exp = (data.experience||[]).map(e => `
    <div class="m-entry">
      <div class="m-entry-header"><span class="m-entry-role">${esc(e.role)}</span><span class="m-entry-dates">${esc(e.dates)}</span></div>
      <div class="m-entry-company">${esc(e.company)}</div>
      ${e.bullets&&e.bullets.length?`<ul>${e.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}
    </div>`).join('');
  const edu = (data.education||[]).map(e => `
    <div class="m-entry">
      <div class="m-entry-header"><span class="m-entry-role">${esc(e.degree)}</span><span class="m-entry-dates">${esc(e.dates)}</span></div>
      <div class="m-entry-company">${esc(e.school)}</div>
    </div>`).join('');
  const skills = (data.skills||[]).map(s=>`<span class="m-skill">${esc(s)}</span>`).join('');
  const contact = [data.email,data.phone,data.location,data.linkedin].filter(Boolean).map(f=>`<span>${esc(f)}</span>`).join('');

  const sectionHtml = {
    summary:    sections.summary    ? `<div class="m-section"><div class="m-section-title">Professional Summary</div><p class="m-summary">${esc(data.summary)}</p></div>` : '',
    experience: sections.experience ? `<div class="m-section"><div class="m-section-title">Work Experience</div>${exp}</div>` : '',
    education:  sections.education  ? `<div class="m-section"><div class="m-section-title">Education</div>${edu}</div>` : '',
    skills:     sections.skills     ? `<div class="m-section"><div class="m-section-title">Skills</div><div class="m-skills">${skills}</div></div>` : '',
  };

  p.className = 'resume-paper modern-paper';
  p.innerHTML = `
    <div class="m-name">${esc(data.name)||'Your Name'}</div>
    <div class="m-title">${esc(data.title)||'Professional Title'}</div>
    <div class="m-contact">${contact}</div>
    <hr class="m-divider">
    ${sectionOrder.map(k => sectionHtml[k] || '').join('')}
  `;
}

function renderProfessional(p) {
  const exp = (data.experience||[]).map(e=>`
    <div class="pro-entry">
      <div class="pro-entry-header"><span class="pro-entry-role">${esc(e.role)}</span><span class="pro-entry-dates">${esc(e.dates)}</span></div>
      <div class="pro-entry-company">${esc(e.company)}</div>
      ${e.bullets&&e.bullets.length?`<ul>${e.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}
    </div>`).join('');
  const edu = (data.education||[]).map(e=>`
    <div class="pro-entry">
      <div class="pro-entry-header"><span class="pro-entry-role">${esc(e.degree)}</span><span class="pro-entry-dates">${esc(e.dates)}</span></div>
      <div class="pro-entry-company">${esc(e.school)}</div>
    </div>`).join('');
  const skills = (data.skills||[]).map(s=>`<span class="pro-skill-pill">${esc(s)}</span>`).join('');
  const certs = (data.certifications||[]).map(c=>`<div class="pro-cert-item">• ${esc(c)}</div>`).join('');
  const contact = [data.email,data.phone,data.location,data.linkedin].filter(Boolean);

  const mainSections = {
    summary:    sections.summary    ? `<div><div class="pro-section-title">Professional Summary</div><p class="pro-summary">${esc(data.summary)}</p></div>` : '',
    experience: sections.experience ? `<div><div class="pro-section-title">Experience</div>${exp}</div>` : '',
    education:  sections.education  ? `<div><div class="pro-section-title">Education</div>${edu}</div>` : '',
  };

  p.className = 'resume-paper pro-paper';
  p.innerHTML = `
    <div class="pro-sidebar">
      <div><div class="pro-name">${esc(data.name)||'Your Name'}</div><div class="pro-job-title">${esc(data.title)}</div></div>
      <div><div class="pro-side-section-title">Contact</div>${contact.map(f=>`<div class="pro-contact-item">${esc(f)}</div>`).join('')}</div>
      ${sections.skills?`<div><div class="pro-side-section-title">Skills</div>${skills}</div>`:''}
      ${sections.certifications?`<div><div class="pro-side-section-title">Certifications</div>${certs}</div>`:''}
    </div>
    <div class="pro-main">
      ${sectionOrder.map(k => mainSections[k] || '').join('')}
    </div>
  `;
}

function renderUniversity(p) {
  const exp = (data.experience||[]).map(e=>`
    <div class="uni-entry">
      <div class="uni-entry-header"><span class="uni-entry-role">${esc(e.role)}</span><span class="uni-entry-dates">${esc(e.dates)}</span></div>
      <div class="uni-entry-sub">${esc(e.company)}</div>
      ${e.bullets&&e.bullets.length?`<ul>${e.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}
    </div>`).join('');
  const edu = (data.education||[]).map(e=>`
    <div class="uni-entry">
      <div class="uni-entry-header"><span class="uni-entry-role">${esc(e.degree)}</span><span class="uni-entry-dates">${esc(e.dates)}</span></div>
      <div class="uni-entry-sub">${esc(e.school)}</div>
    </div>`).join('');
  const projects = (data.projects||[]).map(pr=>`
    <div class="uni-entry" style="margin-bottom:8px;">
      <div class="uni-project-name">${esc(pr.name)}</div>
      <div class="uni-project-desc">${esc(pr.description)}</div>
    </div>`).join('');
  const skills = (data.skills||[]).map(s=>`<span class="uni-skill">${esc(s)}</span>`).join('');
  const contact = [data.email,data.phone,data.location,data.linkedin].filter(Boolean).map(f=>`<span>${esc(f)}</span>`).join('');

  const sectionHtml = {
    summary:    sections.summary    ? `<div class="uni-section"><div class="uni-section-title">Objective</div><p>${esc(data.summary)}</p></div>` : '',
    education:  sections.education  ? `<div class="uni-section"><div class="uni-section-title">Education</div>${edu}${data.gpa?`<div class="uni-gpa">GPA: ${esc(data.gpa)}</div>`:''}</div>` : '',
    experience: sections.experience ? `<div class="uni-section"><div class="uni-section-title">Experience</div>${exp}</div>` : '',
    projects:   sections.projects   ? `<div class="uni-section"><div class="uni-section-title">Projects</div>${projects}</div>` : '',
    skills:     sections.skills     ? `<div class="uni-section"><div class="uni-section-title">Skills</div><div class="uni-skills">${skills}</div></div>` : '',
  };

  p.className = 'resume-paper uni-paper';
  p.innerHTML = `
    <div class="uni-name">${esc(data.name)||'Your Name'}</div>
    <div class="uni-contact">${contact}</div>
    <hr class="uni-divider">
    ${sectionOrder.map(k => sectionHtml[k] || '').join('')}
  `;
}

// ── LEFT PANEL ──
function buildLeftPanel() {
  const panel = document.getElementById('leftPanel');
  panel.innerHTML = '';

  // Personal Info — always first, not draggable
  panel.appendChild(makeSection('personal', 'Personal Information', false, `
    <div class="form-group"><label>Full Name</label><input id="f-name" type="text" value="${esc(data.name||'')}" placeholder="John Doe"/></div>
    <div class="form-group"><label>Professional Title</label><input id="f-title" type="text" value="${esc(data.title||'')}" placeholder="Software Engineer"/></div>
    <div class="form-group"><label>Email</label><input id="f-email" type="email" value="${esc(data.email||'')}" placeholder="john@email.com"/></div>
    <div class="form-group"><label>Phone</label><input id="f-phone" type="text" value="${esc(data.phone||'')}" placeholder="(555) 123-4567"/></div>
    <div class="form-group"><label>Location</label><input id="f-location" type="text" value="${esc(data.location||'')}" placeholder="City, State"/></div>
    <div class="form-group"><label>LinkedIn / Website</label><input id="f-linkedin" type="text" value="${esc(data.linkedin||'')}" placeholder="linkedin.com/in/yourname"/></div>
    ${TEMPLATE_TYPE==='university'?`<div class="form-group"><label>GPA</label><input id="f-gpa" type="text" value="${esc(data.gpa||'')}" placeholder="3.8"/></div>`:''}
  `));

  // Build all draggable sections
  const sectionBuilders = {
    summary: () => makeSection('summary', 'Summary', true, `
      <div class="form-group"><textarea id="f-summary" rows="3" placeholder="Write a short summary...">${esc(data.summary||'')}</textarea></div>
    `),
    experience: () => {
      const expBody = document.createElement('div');
      (data.experience||[]).forEach(e => expBody.appendChild(makeExpEntry(e)));
      const addExpBtn = document.createElement('button');
      addExpBtn.className = 'add-btn'; addExpBtn.textContent = '+ Add Experience';
      addExpBtn.onclick = () => expBody.appendChild(makeExpEntry({role:'',company:'',dates:'',bullets:[]}));
      const wrap = document.createElement('div');
      wrap.appendChild(expBody); wrap.appendChild(addExpBtn);
      return makeSection('experience', 'Work Experience', true, wrap);
    },
    education: () => {
      const eduBody = document.createElement('div');
      (data.education||[]).forEach(e => eduBody.appendChild(makeEduEntry(e)));
      const addEduBtn = document.createElement('button');
      addEduBtn.className = 'add-btn'; addEduBtn.textContent = '+ Add Education';
      addEduBtn.onclick = () => eduBody.appendChild(makeEduEntry({degree:'',school:'',dates:''}));
      const wrap = document.createElement('div');
      wrap.appendChild(eduBody); wrap.appendChild(addEduBtn);
      return makeSection('education', 'Education', true, wrap);
    },
    skills: () => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="skills-row"><input id="skill-input" type="text" placeholder="e.g. JavaScript"/><button id="add-skill-btn">Add</button></div>
        <div class="skill-tags" id="skill-tags"></div>
        <button class="suggest-btn" id="suggest-skills-btn">✨ Suggest Skills</button>
        <div class="suggestions-box" id="suggestions-box" style="display:none;"></div>
      `;
      return makeSection('skills', 'Skills', true, wrap);
    },
    projects: () => {
      const projBody = document.createElement('div');
      (data.projects||[]).forEach(pr => projBody.appendChild(makeProjEntry(pr)));
      const addProjBtn = document.createElement('button');
      addProjBtn.className = 'add-btn'; addProjBtn.textContent = '+ Add Project';
      addProjBtn.onclick = () => projBody.appendChild(makeProjEntry({name:'',description:''}));
      const wrap = document.createElement('div');
      wrap.appendChild(projBody); wrap.appendChild(addProjBtn);
      return makeSection('projects', 'Projects', true, wrap);
    },
    certifications: () => {
      const certBody = document.createElement('div');
      (data.certifications||[]).forEach(c => certBody.appendChild(makeCertEntry(c)));
      const addCertBtn = document.createElement('button');
      addCertBtn.className = 'add-btn'; addCertBtn.textContent = '+ Add Certification';
      addCertBtn.onclick = () => certBody.appendChild(makeCertEntry(''));
      const wrap = document.createElement('div');
      wrap.appendChild(certBody); wrap.appendChild(addCertBtn);
      return makeSection('certifications', 'Certifications', true, wrap);
    }
  };

  // Sections relevant to this template type
  const relevantSections = sectionOrder.filter(key => {
    if (key === 'projects') return TEMPLATE_TYPE === 'university';
    if (key === 'certifications') return TEMPLATE_TYPE === 'professional';
    return true;
  });

  relevantSections.forEach(key => {
    const builder = sectionBuilders[key];
    if (!builder) return;
    const el = builder();
    el.dataset.sectionKey = key;
    panel.appendChild(el);
  });

  panel.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', updatePreview));
  renderSkillTags();
  document.getElementById('add-skill-btn').addEventListener('click', addSkill);
  document.getElementById('skill-input').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();addSkill();} });
  document.getElementById('suggest-skills-btn').addEventListener('click', suggestSkills);

  initDragAndDrop(panel);
}

function makeSection(key, label, toggleable, bodyContent) {
  const block = document.createElement('div');
  block.className = 'section-block';
  block.dataset.sectionKey = key;
  const isOn = sections[key] !== false;

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <div class="section-header-left">
      ${toggleable ? `<span class="drag-handle" title="Drag to reorder">⠿</span>` : ''}
      ${toggleable ? `<input type="checkbox" ${isOn?'checked':''} data-section="${key}" style="cursor:pointer;"/>` : ''}
      <span>${label}</span>
    </div>
    <span class="chevron ${isOn?'open':''}">▼</span>
  `;

  const body = document.createElement('div');
  body.className = 'section-body' + (isOn ? '' : ' collapsed');
  if (typeof bodyContent === 'string') body.innerHTML = bodyContent;
  else body.appendChild(bodyContent);

  header.addEventListener('click', e => {
    if (e.target.type === 'checkbox') return;
    body.classList.toggle('collapsed');
    header.querySelector('.chevron').classList.toggle('open');
  });

  const cb = header.querySelector('input[type=checkbox]');
  if (cb) cb.addEventListener('change', () => { sections[key] = cb.checked; updatePreview(); });

  block.appendChild(header);
  block.appendChild(body);
  return block;
}

function initDragAndDrop(panel) {
  let dragEl = null;
  let placeholder = null;

  panel.querySelectorAll('.section-block[data-section-key]').forEach(block => {
    const handle = block.querySelector('.drag-handle');
    if (!handle) return;

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      dragEl = block;
      const rect = block.getBoundingClientRect();

      // Create placeholder
      placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = rect.height + 'px';

      block.style.opacity = '0.4';
      block.style.pointerEvents = 'none';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });

  function onMouseMove(e) {
    if (!dragEl) return;
    // Find which block we're hovering over
    const blocks = [...panel.querySelectorAll('.section-block[data-section-key]:not([style*="opacity"])')];
    let inserted = false;
    for (const b of blocks) {
      const rect = b.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        panel.insertBefore(placeholder, b);
        inserted = true;
        break;
      }
    }
    if (!inserted) panel.appendChild(placeholder);
  }

  function onMouseUp() {
    if (!dragEl) return;
    dragEl.style.opacity = '';
    dragEl.style.pointerEvents = '';
    if (placeholder && placeholder.parentNode) {
      panel.insertBefore(dragEl, placeholder);
      placeholder.remove();
    }
    placeholder = null;

    // Update sectionOrder from DOM — exclude 'personal' which is always fixed at top
    sectionOrder = [...panel.querySelectorAll('.section-block[data-section-key]')]
      .map(b => b.dataset.sectionKey)
      .filter(k => k !== 'personal');

    dragEl = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    updatePreview();
  }
}

function makeExpEntry(exp) {
  const div = document.createElement('div');
  div.className = 'list-entry exp-entry';
  div.style.marginBottom = '8px';
  div.innerHTML = `
    <button class="remove-entry">✕</button>
    <div class="form-group"><label>Job Title</label><input class="exp-role" type="text" value="${esc(exp.role||'')}" placeholder="Senior Engineer"/></div>
    <div class="form-group"><label>Company</label><input class="exp-company" type="text" value="${esc(exp.company||'')}" placeholder="Company Name"/></div>
    <div class="form-group"><label>Dates</label><input class="exp-dates" type="text" value="${esc(exp.dates||'')}" placeholder="2021 – Present"/></div>
    <div style="font-size:11px;color:#666;margin:6px 0 3px;">Bullet Points</div>
    <div class="bullets-container">${(exp.bullets||[]).map(b=>`<div class="bullet-row"><input class="bullet-input" type="text" value="${esc(b)}" placeholder="Achievement..."/><button class="remove-bullet">✕</button></div>`).join('')}</div>
    <button class="add-bullet-btn">+ Add bullet</button>
  `;
  div.querySelector('.remove-entry').onclick = () => { div.remove(); updatePreview(); };
  div.querySelector('.add-bullet-btn').onclick = () => {
    const row = document.createElement('div');
    row.className = 'bullet-row';
    row.innerHTML = `<input class="bullet-input" type="text" placeholder="Achievement..."/><button class="remove-bullet">✕</button>`;
    row.querySelector('.remove-bullet').onclick = () => { row.remove(); updatePreview(); };
    row.querySelector('input').addEventListener('input', updatePreview);
    div.querySelector('.bullets-container').appendChild(row);
  };
  div.querySelectorAll('.remove-bullet').forEach(b => b.onclick = () => { b.closest('.bullet-row').remove(); updatePreview(); });
  div.querySelectorAll('input').forEach(i => i.addEventListener('input', updatePreview));
  return div;
}

function makeEduEntry(edu) {
  const div = document.createElement('div');
  div.className = 'list-entry edu-entry';
  div.style.marginBottom = '8px';
  div.innerHTML = `
    <button class="remove-entry">✕</button>
    <div class="form-group"><label>Degree</label><input class="edu-degree" type="text" value="${esc(edu.degree||'')}" placeholder="B.S. Computer Science"/></div>
    <div class="form-group"><label>School</label><input class="edu-school" type="text" value="${esc(edu.school||'')}" placeholder="University Name"/></div>
    <div class="form-group"><label>Dates</label><input class="edu-dates" type="text" value="${esc(edu.dates||'')}" placeholder="2018 – 2022"/></div>
  `;
  div.querySelector('.remove-entry').onclick = () => { div.remove(); updatePreview(); };
  div.querySelectorAll('input').forEach(i => i.addEventListener('input', updatePreview));
  return div;
}

function makeProjEntry(pr) {
  const div = document.createElement('div');
  div.className = 'list-entry proj-entry';
  div.style.marginBottom = '8px';
  div.innerHTML = `
    <button class="remove-entry">✕</button>
    <div class="form-group"><label>Project Name</label><input class="proj-name" type="text" value="${esc(pr.name||'')}" placeholder="Project Name"/></div>
    <div class="form-group"><label>Description</label><textarea class="proj-desc" rows="2" placeholder="What did you build?">${esc(pr.description||'')}</textarea></div>
  `;
  div.querySelector('.remove-entry').onclick = () => { div.remove(); updatePreview(); };
  div.querySelectorAll('input, textarea').forEach(i => i.addEventListener('input', updatePreview));
  return div;
}

function makeCertEntry(cert) {
  const div = document.createElement('div');
  div.className = 'list-entry';
  div.style.marginBottom = '6px';
  div.innerHTML = `<button class="remove-entry">✕</button><div class="form-group"><input class="cert-input" type="text" value="${esc(cert)}" placeholder="e.g. AWS Certified Developer"/></div>`;
  div.querySelector('.remove-entry').onclick = () => { div.remove(); updatePreview(); };
  div.querySelector('input').addEventListener('input', updatePreview);
  return div;
}

function renderSkillTags() {
  const container = document.getElementById('skill-tags');
  if (!container) return;
  container.innerHTML = (data.skills||[]).map((s,i) => `
    <span class="skill-tag">${esc(s)}<button data-si="${i}">✕</button></span>
  `).join('');
  container.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => { data.skills.splice(parseInt(btn.dataset.si),1); renderSkillTags(); updatePreview(); };
  });
}

function addSkill() {
  const input = document.getElementById('skill-input');
  const v = input.value.trim();
  if (!v) return;
  if (!data.skills) data.skills = [];
  data.skills.push(v);
  input.value = '';
  renderSkillTags();
  updatePreview();
}

// ── SKILL SUGGESTIONS ──
async function suggestSkills() {
  const btn = document.getElementById('suggest-skills-btn');
  const box = document.getElementById('suggestions-box');

  collectData();

  const hasTitle = data.title?.trim();
  const hasExperience = data.experience && data.experience.some(e => e.role?.trim() || e.company?.trim());
  const hasSkills = data.skills && data.skills.length > 0;

  if (!hasTitle && !hasExperience && !hasSkills) {
    showToast('⚠ Fill in your job title, experience, or existing skills before requesting suggestions', true);
    return;
  }

  btn.textContent = '⏳ Thinking...';
  btn.disabled = true;
  box.style.display = 'none';

  try {
    const res = await fetch('/api/suggest-skills', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title || '',
        summary: data.summary || '',
        skills: data.skills || []
      })
    });
    const json = await res.json();

    if (json.error) {
      showToast('⚠ ' + json.error, true);
    } else {
      box.style.display = 'flex';
      box.innerHTML = `
        <div class="suggestions-label">Click to add:</div>
        ${json.suggestions.map(s => `
          <button class="suggestion-chip" data-skill="${esc(s)}">${esc(s)}</button>
        `).join('')}
      `;
      box.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (!data.skills) data.skills = [];
          if (!data.skills.includes(chip.dataset.skill)) {
            data.skills.push(chip.dataset.skill);
            renderSkillTags();
            updatePreview();
          }
          chip.classList.add('added');
          chip.disabled = true;
        });
      });
    }
  } catch (e) {
    showToast('Could not reach Ollama. Is it running?', true);
  }

  btn.textContent = '✨ Suggest Skills';
  btn.disabled = false;
}

// ── VALIDATION & SAVE ──
function showToast(msg, isError, details) {
  const toast = document.getElementById('toast');
  toast.innerHTML = esc(msg) + (details && details.length > 1
    ? `<ul style="margin-top:6px;padding-left:16px;font-size:11px;font-weight:400;">${details.slice(1).map(d => `<li>${esc(d)}</li>`).join('')}</ul>`
    : '');
  toast.classList.toggle('error', !!isError);
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); toast.classList.remove('error'); }, 5000);
}

function validateSections() {
  const errors = [];

  // Personal info — always required
  const personalFields = [
    { id: 'f-name',  label: 'Full Name' },
    { id: 'f-email', label: 'Email' },
    { id: 'f-phone', label: 'Phone' },
  ];
  personalFields.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (el && !el.value.trim()) errors.push(`${label} is empty`);
  });

  // Summary
  if (sections.summary && !data.summary?.trim())
    errors.push('Summary is checked but empty');

  // Experience
  if (sections.experience) {
    if (!data.experience || data.experience.length === 0) {
      errors.push('Work Experience is checked but has no entries');
    } else {
      data.experience.forEach((e, i) => {
        if (!e.role?.trim())    errors.push(`Experience #${i+1}: Job Title is empty`);
        if (!e.company?.trim()) errors.push(`Experience #${i+1}: Company is empty`);
        if (!e.dates?.trim())   errors.push(`Experience #${i+1}: Dates is empty`);
      });
    }
  }

  // Education
  if (sections.education) {
    if (!data.education || data.education.length === 0) {
      errors.push('Education is checked but has no entries');
    } else {
      data.education.forEach((e, i) => {
        if (!e.degree?.trim()) errors.push(`Education #${i+1}: Degree is empty`);
        if (!e.school?.trim()) errors.push(`Education #${i+1}: School is empty`);
        if (!e.dates?.trim())  errors.push(`Education #${i+1}: Dates is empty`);
      });
    }
  }

  // Skills
  if (sections.skills && (!data.skills || data.skills.length === 0))
    errors.push('Skills is checked but no skills added');

  // Projects (university)
  if (sections.projects && TEMPLATE_TYPE === 'university') {
    if (!data.projects || data.projects.length === 0) {
      errors.push('Projects is checked but has no entries');
    } else {
      data.projects.forEach((p, i) => {
        if (!p.name?.trim())        errors.push(`Project #${i+1}: Name is empty`);
        if (!p.description?.trim()) errors.push(`Project #${i+1}: Description is empty`);
      });
    }
  }

  // Certifications (professional)
  if (sections.certifications && TEMPLATE_TYPE === 'professional') {
    if (!data.certifications || data.certifications.length === 0)
      errors.push('Certifications is checked but has no entries');
  }

  return errors;
}

document.getElementById('btnSave').addEventListener('click', async () => {
  collectData();
  const errors = validateSections();
  if (errors.length > 0) {
    showToast(`⚠ ${errors.length} issue${errors.length > 1 ? 's' : ''}: ${errors[0]}`, true, errors);
    return;
  }
  const title = document.getElementById('resume-title').value.trim() || data.name || 'My Resume';
  const res = await fetch(`/api/resumes/${RESUME_ID}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: data, title, template_id: TEMPLATE_ID })
  });
  if (res.ok) {
    const json = await res.json();
    if (json.saved) {
      if (json.id) window.RESUME_ID = json.id;
      showToast('Saved! Redirecting...');
      setTimeout(() => { window.location.href = '/dashboard?tab=recent'; }, 900);
    } else {
      showToast('Save failed: ' + (json.error || 'unknown error'), true);
    }
  } else {
    const json = await res.json().catch(() => ({}));
    showToast('Save failed: ' + (json.error || res.status), true);
  }
});

// ── BOOT ──
buildLeftPanel();
updatePreview();
const titleEl = document.getElementById('resume-title');
if (titleEl) titleEl.value = initialContent._resumeTitle || '';
