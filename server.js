const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const LEADS_PATH = path.join(__dirname, 'leads.json');
const JOBS_PATH = path.join(__dirname, 'jobs.json');
const APPLICATIONS_PATH = path.join(__dirname, 'applications.json');
const MEETINGS_PATH = path.join(__dirname, 'meetings.json');

// Generic JSON helpers
function readJSON(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// ==================== CONFIG APIS ====================
app.get('/api/config', (req, res) => {
  const config = readJSON(CONFIG_PATH, {});
  res.json(config);
});

app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;
    writeJSON(CONFIG_PATH, newConfig);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== LEADS APIS ====================
app.get('/api/leads', (req, res) => {
  const leads = readJSON(LEADS_PATH, []);
  res.json({ success: true, leads });
});

app.post('/api/leads', (req, res) => {
  const { name, email, phone, company, service, budget, message } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const leads = readJSON(LEADS_PATH, []);
  const newLead = {
    id: 'lead_' + Date.now(),
    name: name.trim(),
    email: email ? email.trim() : '',
    phone: phone ? phone.trim() : '',
    company: company ? company.trim() : '',
    service: service || 'General IT Inquiry',
    budget: budget || 'Not specified',
    message: message ? message.trim() : '',
    createdAt: new Date().toISOString()
  };

  leads.unshift(newLead);
  writeJSON(LEADS_PATH, leads);

  console.log(`[NEW CLIENT LEAD] 🚀 ${newLead.name} (${newLead.email || newLead.phone}) - Service: ${newLead.service}`);

  res.json({
    success: true,
    message: 'Thank you! Your inquiry has been submitted. Our IT solutions specialist will reach out shortly.',
    leadId: newLead.id
  });
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  let leads = readJSON(LEADS_PATH, []);
  const initialLen = leads.length;
  leads = leads.filter(l => l.id !== id);
  if (leads.length !== initialLen) {
    writeJSON(LEADS_PATH, leads);
    res.json({ success: true, message: 'Lead deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Lead not found' });
  }
});

// ==================== JOBS / CAREERS APIS ====================
app.get('/api/jobs', (req, res) => {
  const jobs = readJSON(JOBS_PATH, []);
  res.json({ success: true, jobs });
});

app.post('/api/jobs', (req, res) => {
  const { id, title, department, type, experience, location, salary, description, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Job title is required.' });
  }

  let jobs = readJSON(JOBS_PATH, []);
  if (id) {
    // Edit existing job
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index] = {
        ...jobs[index],
        title: title.trim(),
        department: department || 'Engineering',
        type: type || 'Full-Time',
        experience: experience || 'Any',
        location: location || 'Remote',
        salary: salary || '',
        description: description || '',
        status: status || 'Active',
        updatedAt: new Date().toISOString()
      };
      writeJSON(JOBS_PATH, jobs);
      return res.json({ success: true, job: jobs[index], message: 'Job updated successfully' });
    }
  }

  // Create new job
  const newJob = {
    id: 'job_' + Date.now(),
    title: title.trim(),
    department: department || 'Engineering',
    type: type || 'Full-Time (Remote)',
    experience: experience || '2+ Years',
    location: location || 'Remote',
    salary: salary || '',
    description: description || '',
    status: status || 'Active',
    createdAt: new Date().toISOString()
  };

  jobs.unshift(newJob);
  writeJSON(JOBS_PATH, jobs);

  console.log(`[NEW JOB POSTED BY ADMIN] 💼 ${newJob.title} (${newJob.type})`);
  res.json({ success: true, job: newJob, message: 'New job vacancy posted successfully!' });
});

app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  let jobs = readJSON(JOBS_PATH, []);
  const initialLen = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  if (jobs.length !== initialLen) {
    writeJSON(JOBS_PATH, jobs);
    res.json({ success: true, message: 'Job vacancy deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Job not found' });
  }
});

// ==================== CANDIDATE APPLICATIONS APIS ====================
app.get('/api/applications', (req, res) => {
  const applications = readJSON(APPLICATIONS_PATH, []);
  res.json({ success: true, applications });
});

app.post('/api/apply', (req, res) => {
  const { name, email, phone, jobTitle, experience, portfolio, resumeLink, coverNote } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const applications = readJSON(APPLICATIONS_PATH, []);
  const newApp = {
    id: 'app_' + Date.now(),
    name: name.trim(),
    email: email ? email.trim() : '',
    phone: phone ? phone.trim() : '',
    jobTitle: jobTitle || 'General IT Application',
    experience: experience || 'Not specified',
    portfolio: portfolio ? portfolio.trim() : '',
    resumeLink: resumeLink ? resumeLink.trim() : '',
    coverNote: coverNote ? coverNote.trim() : '',
    status: 'New',
    createdAt: new Date().toISOString()
  };

  applications.unshift(newApp);
  writeJSON(APPLICATIONS_PATH, applications);

  console.log(`[NEW JOB APPLICATION] 🎯 ${newApp.name} applied for: ${newApp.jobTitle} (${newApp.email || newApp.phone})`);

  res.json({
    success: true,
    message: `Thank you ${newApp.name}! Your application for "${newApp.jobTitle}" has been received. Our recruitment team will review your profile and contact you soon.`,
    applicationId: newApp.id
  });
});

app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let applications = readJSON(APPLICATIONS_PATH, []);
  const appItem = applications.find(a => a.id === id);
  if (appItem) {
    appItem.status = status || appItem.status;
    writeJSON(APPLICATIONS_PATH, applications);
    res.json({ success: true, message: 'Application status updated' });
  } else {
    res.status(404).json({ success: false, error: 'Application not found' });
  }
});

app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  let applications = readJSON(APPLICATIONS_PATH, []);
  const initialLen = applications.length;
  applications = applications.filter(a => a.id !== id);
  if (applications.length !== initialLen) {
    writeJSON(APPLICATIONS_PATH, applications);
    res.json({ success: true, message: 'Application deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Application not found' });
  }
});

// ==================== ONLINE BOOKING & MEETINGS APIS ====================
app.get('/api/meetings', (req, res) => {
  const meetings = readJSON(MEETINGS_PATH, []);
  res.json({ success: true, meetings });
});

app.post('/api/meetings', (req, res) => {
  const { name, email, phone, company, meetingType, preferredDate, preferredTime, notes } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const meetings = readJSON(MEETINGS_PATH, []);
  const newMeeting = {
    id: 'meet_' + Date.now(),
    name: name.trim(),
    email: email ? email.trim() : '',
    phone: phone ? phone.trim() : '',
    company: company ? company.trim() : '',
    meetingType: meetingType || '30-Min Discovery Consultation',
    preferredDate: preferredDate || 'As soon as possible',
    preferredTime: preferredTime || 'Flexible',
    notes: notes ? notes.trim() : '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  meetings.unshift(newMeeting);
  writeJSON(MEETINGS_PATH, meetings);

  console.log(`[NEW ONLINE MEETING BOOKED] 📅 ${newMeeting.name} (${newMeeting.email}) for: ${newMeeting.meetingType} on ${newMeeting.preferredDate} at ${newMeeting.preferredTime}`);

  res.json({
    success: true,
    message: `Thank you ${newMeeting.name}! Your meeting request has been booked. A calendar invite and meeting link will be sent to ${newMeeting.email || newMeeting.phone}.`,
    meetingId: newMeeting.id
  });
});

app.delete('/api/meetings/:id', (req, res) => {
  const { id } = req.params;
  let meetings = readJSON(MEETINGS_PATH, []);
  const initialLen = meetings.length;
  meetings = meetings.filter(m => m.id !== id);
  if (meetings.length !== initialLen) {
    writeJSON(MEETINGS_PATH, meetings);
    res.json({ success: true, message: 'Meeting booking removed' });
  } else {
    res.status(404).json({ success: false, error: 'Meeting not found' });
  }
});

// ==================== CHAT APIS (SMART RULES + GEMINI) ====================
function resolveRuleBasedAnswer(userMsg, config) {
  const clean = userMsg.toLowerCase().trim();

  // Check greetings
  if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening|greetings)\b/i.test(clean)) {
    return `Hello! 👋 Welcome to **${config.company.name}**. I'm **${config.company.botName}**, your IT solutions & careers consultant.\n\nHow can I help you today?\n• 💼 Browse **IT Services**\n• 💰 Get an instant **Cost Estimate**\n• 📅 **Book an Online Meeting** with our architect\n• 🎯 Browse **Open Jobs & Apply**\n• 👨‍💻 Hire **Dedicated Developers**`;
  }

  // Check jobs / careers keywords
  if (/\b(job|jobs|hiring|career|careers|vacancy|vacancies|apply|work with you|resume|intern|opening|openings)\b/i.test(clean)) {
    const jobs = readJSON(JOBS_PATH, []);
    const activeJobs = jobs.filter(j => j.status === 'Active');
    if (activeJobs.length > 0) {
      let jobList = activeJobs.map((j, i) => `${i+1}. **${j.title}** (${j.type})\n   • Experience: ${j.experience} | Dept: ${j.department}`).join('\n\n');
      return `🚀 **We are currently hiring for ${activeJobs.length} open position(s):**\n\n${jobList}\n\n👉 Click **'🎯 Apply for Jobs'** in the top bar to submit your application in 30 seconds!`;
    } else {
      return `We are always looking for great engineers, designers, and project managers! Click **'🎯 Apply for Jobs'** to submit an open application with your resume link and skills.`;
    }
  }

  // Check meeting / booking keywords
  if (/\b(book|booking|meeting|schedule|call|appointment|demo|google meet|zoom)\b/i.test(clean)) {
    return `You can easily book a 1-on-1 online video consultation with our Solutions Architect!\n\n👉 Click **'📅 Book Meeting'** at the top bar to select your preferred date, time slot, and discussion topic.`;
  }

  // Check matching FAQ items
  if (config.faq && Array.isArray(config.faq)) {
    for (const item of config.faq) {
      if (item.keywords && item.keywords.some(kw => clean.includes(kw.toLowerCase()))) {
        return item.answer;
      }
    }
  }

  // Check specific service match
  if (config.services && Array.isArray(config.services)) {
    for (const s of config.services) {
      const matchTitle = clean.includes(s.title.toLowerCase()) || clean.includes(s.id.toLowerCase());
      const matchTech = s.technologies && s.technologies.some(t => clean.includes(t.toLowerCase()));
      if (matchTitle || matchTech) {
        return `**${s.title}**\n\n${s.description}\n\n🛠 **Key Tech Stack:** ${s.technologies.join(', ')}\n\nWould you like a custom estimate or portfolio examples for this service? Click **'📋 Request Quote'** or **'📅 Book Meeting'** to connect with our lead architect!`;
      }
    }
  }

  // Default response
  return `Thank you for asking! At **${config.company.name}**, we provide custom software development, mobile apps (iOS/Android), AI/ML integration, and dedicated IT staffing.\n\nCould you tell me a little more about your requirements? Or choose from:\n• **'📋 Request Quote'** for project estimates\n• **'📅 Book Meeting'** to schedule an online video consultation\n• **'🎯 Apply for Jobs'** to explore our career vacancies`;
}

app.post('/api/chat', async (req, res) => {
  const { message, history, apiKey } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const config = readJSON(CONFIG_PATH, {});
  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveApiKey) {
    try {
      const jobs = readJSON(JOBS_PATH, []).filter(j => j.status === 'Active');
      const jobsSummary = jobs.map(j => `- ${j.title} (${j.type}, Exp: ${j.experience})`).join('\n');

      const systemInstruction = (config.geminiConfig?.systemInstruction || 
        `You are Nova, an expert IT & Careers Consultant for ${config.company.name}.`) + 
        `\n\nCurrent active job vacancies available for applicants:\n${jobsSummary || 'Open applications accepted.'}\n` +
        `Direct users to click 'Request Quote', 'Book Meeting', or 'Apply for Jobs' where relevant.`;

      const contents = [];
      if (Array.isArray(history)) {
        history.slice(-8).forEach(h => {
          if (h.role && h.text) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          }
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      });

      if (!response.ok) {
        const fallbackText = resolveRuleBasedAnswer(message, config);
        return res.json({ reply: fallbackText, engine: 'rule-engine-fallback' });
      }

      const data = await response.json();
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botReply) {
        return res.json({ reply: botReply, engine: 'gemini-ai' });
      }
    } catch (err) {
      console.warn('Gemini API exception, falling back to rule engine:', err.message);
    }
  }

  // Rule-based engine fallback
  const ruleReply = resolveRuleBasedAnswer(message, config);
  return res.json({ reply: ruleReply, engine: 'smart-rules' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🤖 IT Company AI Live Chat Server running!`);
  console.log(`🌐 Website Demo:       http://localhost:${PORT}`);
  console.log(`📊 Admin Portal:       http://localhost:${PORT}/admin.html`);
  console.log(`=======================================================`);
});
