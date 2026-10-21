const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const LEADS_PATH = path.join(__dirname, 'leads.json');
const JOBS_PATH = path.join(__dirname, 'jobs.json');
const APPLICATIONS_PATH = path.join(__dirname, 'applications.json');
const MEETINGS_PATH = path.join(__dirname, 'meetings.json');
const CONVERSATIONS_PATH = path.join(__dirname, 'conversations.json');

// Helper to parse human device name from User-Agent
function parseDeviceInfo(userAgent) {
  if (!userAgent) return 'Web Browser';
  let os = 'Desktop';
  if (/android/i.test(userAgent)) os = 'Android Mobile';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS / iPhone';
  else if (/windows/i.test(userAgent)) os = 'Windows PC';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'Mac OS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Browser';
  if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';

  return `${os} (${browser})`;
}

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

// ==================== FILE UPLOAD API ====================
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileType, base64Data } = req.body;
    if (!fileName || !base64Data) {
      return res.status(400).json({ success: false, error: 'File name and file data are required.' });
    }

    const cleanBase64 = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const safeName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(destPath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    console.log(`[FILE UPLOADED] 📄 ${fileName} (${(buffer.length / 1024).toFixed(1)} KB) -> ${fileUrl}`);

    res.json({
      success: true,
      fileUrl,
      fileName,
      fileSize: (buffer.length / 1024).toFixed(1) + ' KB'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// ==================== LEADS APIS (WITH SENDER INFO) ====================
app.get('/api/leads', (req, res) => {
  const leads = readJSON(LEADS_PATH, []);
  res.json({ success: true, leads });
});

app.post('/api/leads', (req, res) => {
  const { name, email, phone, company, service, budget, message, attachment, userAgent } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const device = parseDeviceInfo(userAgent || req.headers['user-agent']);
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
    attachment: attachment || null,
    device: device,
    createdAt: new Date().toISOString()
  };

  leads.unshift(newLead);
  writeJSON(LEADS_PATH, leads);

  console.log(`[NEW CLIENT LEAD] 👤 Sent By: ${newLead.name} (${newLead.email} | ${newLead.phone}) on ${newLead.device}`);

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

  console.log(`[NEW JOB POSTED] 💼 ${newJob.title} (${newJob.type})`);
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
  const { name, email, phone, jobTitle, experience, portfolio, resumeLink, resumeFile, coverNote, userAgent } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const device = parseDeviceInfo(userAgent || req.headers['user-agent']);
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
    resumeFile: resumeFile || null,
    coverNote: coverNote ? coverNote.trim() : '',
    device: device,
    status: 'New',
    createdAt: new Date().toISOString()
  };

  applications.unshift(newApp);
  writeJSON(APPLICATIONS_PATH, applications);

  console.log(`[JOB APPLICATION] 🎯 Sent By: ${newApp.name} (${newApp.email} | ${newApp.phone}) for "${newApp.jobTitle}"`);

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

// ==================== ONLINE BOOKINGS APIS ====================
app.get('/api/meetings', (req, res) => {
  const meetings = readJSON(MEETINGS_PATH, []);
  res.json({ success: true, meetings });
});

app.post('/api/meetings', (req, res) => {
  const { name, email, phone, company, meetingType, preferredDate, preferredTime, notes, userAgent } = req.body;
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, error: 'Name and either Email or Phone are required.' });
  }

  const device = parseDeviceInfo(userAgent || req.headers['user-agent']);
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
    device: device,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  meetings.unshift(newMeeting);
  writeJSON(MEETINGS_PATH, meetings);

  console.log(`[ONLINE MEETING] 📅 Sent By: ${newMeeting.name} (${newMeeting.email} | ${newMeeting.phone}) for ${newMeeting.meetingType}`);

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

// ==================== LIVE CHAT CONVERSATIONS & SENDER LOGS ====================
app.get('/api/conversations', (req, res) => {
  const conversations = readJSON(CONVERSATIONS_PATH, []);
  res.json({ success: true, conversations });
});

app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  let conversations = readJSON(CONVERSATIONS_PATH, []);
  const initialLen = conversations.length;
  conversations = conversations.filter(c => c.id !== id);
  if (conversations.length !== initialLen) {
    writeJSON(CONVERSATIONS_PATH, conversations);
    res.json({ success: true, message: 'Conversation deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Conversation not found' });
  }
});

// Helper: Rule-based fallback query resolver
function resolveRuleBasedAnswer(userMsg, config, attachment) {
  const clean = userMsg ? userMsg.toLowerCase().trim() : '';

  if (attachment) {
    return `Thank you for sending the document **${attachment.fileName}** (${attachment.fileSize || 'Uploaded'})! 📄\n\nI have received your document. Our engineering team at **${config.company.name}** will review it carefully.\n\nCould you also share your **Name and Email/Phone** or click **'📋 Request Quote'** so we can contact you?`;
  }

  if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening|greetings)\b/i.test(clean)) {
    return `Hello! 👋 Welcome to **${config.company.name}** (Developed by **Developer Paresh**).\n\nHow can I help you today?\n• 💼 Browse **IT Services**\n• 💰 Get an instant **Cost Estimate**\n• 📅 **Book an Online Meeting** with Developer Paresh\n• 🎯 Browse **Open Jobs & Apply**\n• 📎 You can attach resumes or project specs via the paperclip button!`;
  }

  if (/\b(job|jobs|hiring|career|careers|vacancy|vacancies|apply|work with you|resume|intern|opening|openings)\b/i.test(clean)) {
    const jobs = readJSON(JOBS_PATH, []);
    const activeJobs = jobs.filter(j => j.status === 'Active');
    if (activeJobs.length > 0) {
      let jobList = activeJobs.map((j, i) => `${i+1}. **${j.title}** (${j.type})\n   • Experience: ${j.experience} | Dept: ${j.department}`).join('\n\n');
      return `🚀 **We are currently hiring for ${activeJobs.length} open position(s) at INAxDeveloper:**\n\n${jobList}\n\n👉 Click **'🎯 Careers & Jobs'** in the top bar to apply and **upload your resume (.PDF/.DOCX)**!`;
    } else {
      return `We are always looking for great engineers, designers, and project managers! Click **'🎯 Careers & Jobs'** to upload your resume (.PDF/.DOCX) directly.`;
    }
  }

  if (/\b(book|booking|meeting|schedule|call|appointment|demo|google meet|zoom)\b/i.test(clean)) {
    return `You can easily book a 1-on-1 online video consultation with Developer Paresh and the INAxDeveloper team!\n\n👉 Click **'📅 Book Meeting'** at the top bar to select your preferred date, time slot, and discussion topic.`;
  }

  if (config.faq && Array.isArray(config.faq)) {
    for (const item of config.faq) {
      if (item.keywords && item.keywords.some(kw => clean.includes(kw.toLowerCase()))) {
        return item.answer;
      }
    }
  }

  if (config.services && Array.isArray(config.services)) {
    for (const s of config.services) {
      const matchTitle = clean.includes(s.title.toLowerCase()) || clean.includes(s.id.toLowerCase());
      const matchTech = s.technologies && s.technologies.some(t => clean.includes(t.toLowerCase()));
      if (matchTitle || matchTech) {
        return `**${s.title}**\n\n${s.description}\n\n🛠 **Key Tech Stack:** ${s.technologies.join(', ')}\n\nWould you like a custom estimate? Click **'📋 Request Quote'** or **'📅 Book Meeting'** to connect with our team!`;
      }
    }
  }

  return `Thank you for contacting **${config.company.name}**! We provide custom software engineering, mobile apps, AI solutions, and dedicated IT staffing.\n\n• **'📋 Request Quote'** to get an estimate & attach project docs\n• **'📅 Book Meeting'** to schedule an online video consultation\n• **'🎯 Careers & Jobs'** to view career vacancies & upload your resume`;
}

// ==================== CHAT API WITH LIVE LOGGING ====================
app.post('/api/chat', async (req, res) => {
  const { sessionId, senderName, senderContact, message, history, apiKey, attachment, userAgent } = req.body;
  if (!message && !attachment) {
    return res.status(400).json({ error: 'Message or attachment is required' });
  }

  const config = readJSON(CONFIG_PATH, {});
  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
  let botReply = '';

  if (effectiveApiKey && !attachment) {
    try {
      const jobs = readJSON(JOBS_PATH, []).filter(j => j.status === 'Active');
      const jobsSummary = jobs.map(j => `- ${j.title} (${j.type}, Exp: ${j.experience})`).join('\n');

      const systemInstruction = (config.geminiConfig?.systemInstruction || 
        `You are INAx AI, an expert IT & Careers Consultant for ${config.company.name} developed by Developer Paresh.`) + 
        `\n\nCurrent active job vacancies available:\n${jobsSummary || 'Open applications accepted.'}\n` +
        `Direct users to click 'Request Quote', 'Book Meeting', or 'Apply for Jobs' where relevant. Mention users can attach resumes or project specs via the paperclip button.`;

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

      if (response.ok) {
        const data = await response.json();
        botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }
    } catch (err) {
      console.warn('Gemini API exception:', err.message);
    }
  }

  if (!botReply) {
    botReply = resolveRuleBasedAnswer(message, config, attachment);
  }

  // Record this message in conversations.json so Admin sees who sent it!
  try {
    const conversations = readJSON(CONVERSATIONS_PATH, []);
    const sid = sessionId || 'vis_' + Date.now();
    let thread = conversations.find(c => c.id === sid);

    if (!thread) {
      thread = {
        id: sid,
        senderName: senderName || 'Website Visitor',
        senderContact: senderContact || '',
        device: parseDeviceInfo(userAgent || req.headers['user-agent']),
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messages: []
      };
      conversations.unshift(thread);
    } else {
      thread.lastActivity = new Date().toISOString();
      if (senderName && thread.senderName === 'Website Visitor') thread.senderName = senderName;
      if (senderContact && !thread.senderContact) thread.senderContact = senderContact;
    }

    thread.messages.push({
      sender: 'user',
      text: message || '',
      attachment: attachment ? { fileName: attachment.fileName, fileUrl: attachment.fileUrl, fileSize: attachment.fileSize } : null,
      timestamp: new Date().toISOString()
    });

    thread.messages.push({
      sender: 'bot',
      text: botReply,
      timestamp: new Date().toISOString()
    });

    writeJSON(CONVERSATIONS_PATH, conversations);
    console.log(`[CHAT LOGGED] 💬 From: ${thread.senderName} (${thread.device}) - Message: "${(message || '').slice(0, 45)}"`);
  } catch (err) {
    console.error('Error logging conversation:', err);
  }

  return res.json({ reply: botReply });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🤖 INAxDeveloper AI Live Chat Server running!`);
  console.log(`🌐 Website Demo:       http://localhost:${PORT}`);
  console.log(`📊 Admin Portal:       http://localhost:${PORT}/admin.html`);
  console.log(`=======================================================`);
});
