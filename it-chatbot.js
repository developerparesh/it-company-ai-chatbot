/**
 * INAxDeveloper AI Live Chatbot Widget
 * Developed by Developer Paresh
 * Lightweight, zero-dependency, Shadow-DOM encapsulated live chat widget with:
 * - Document & Resume attachment in chat
 * - Job candidate resume uploading (.PDF, .DOCX)
 * - Project RFP / wireframe attachment
 * - Online meeting booking & client leads
 */
(function () {
  'use strict';

  if (window.__ITChatbotInitialized) return;
  window.__ITChatbotInitialized = true;

  const userConfig = window.IT_CHATBOT_CONFIG || {};

  let activeConfig = {
    apiEndpoint: userConfig.apiEndpoint || '',
    companyName: userConfig.companyName || 'INAxDeveloper',
    developer: userConfig.developer || 'Developer Paresh',
    botName: userConfig.botName || 'INAx AI',
    primaryColor: userConfig.primaryColor || '#2563eb',
    secondaryColor: userConfig.secondaryColor || '#1d4ed8',
    whatsappNumber: userConfig.whatsappNumber || '919876543210',
    supportEmail: userConfig.supportEmail || 'pareshchauhan39500@gmail.com',
    phone: userConfig.phone || '+91 98765 43210',
    welcomeMessage: userConfig.welcomeMessage || "Hello! 👋 Welcome to **INAxDeveloper** (Developed by Developer Paresh).\n\nI'm **INAx AI**, your technical & careers consultant. How can I help you today? You can explore our IT services, get instant cost estimates, book an online video meeting, or apply for open vacancies.\n\n📎 *You can also attach resumes, RFPs, or project documents directly in this chat!*",
    quickPrompts: [
      { label: "💼 IT Services", query: "What services does INAxDeveloper offer?" },
      { label: "💰 Cost Estimate", query: "How much does it cost to build a custom web or mobile app?" },
      { label: "⚡ Tech Stack", query: "What technologies and frameworks do you use?" },
      { label: "🎯 Open Jobs & Careers", action: "open_jobs" },
      { label: "📅 Book Meeting", action: "open_booking" }
    ],
    booking: {
      meetingTypes: [
        "Free 30-Min Project Discovery Call",
        "Technical Architecture & Stack Review",
        "SaaS MVP Scoping & Roadmap",
        "Dedicated Team & Developer Staffing",
        "Career / Job Interview Inquiry"
      ],
      timeSlots: [
        "10:00 AM - 10:30 AM",
        "11:30 AM - 12:00 PM",
        "02:00 PM - 02:30 PM",
        "03:30 PM - 04:00 PM",
        "05:00 PM - 05:30 PM",
        "06:30 PM - 07:00 PM"
      ]
    }
  };

  let activeJobs = [
    {
      id: "job_1",
      title: "Senior Full-Stack React & Node.js Developer",
      department: "Engineering",
      type: "Full-Time (Remote)",
      experience: "3 - 5 Years"
    },
    {
      id: "job_2",
      title: "Flutter & Mobile App Engineer",
      department: "Mobile",
      type: "Full-Time (Remote)",
      experience: "2 - 4 Years"
    },
    {
      id: "job_3",
      title: "AI & Python ML Engineer",
      department: "Artificial Intelligence",
      type: "Full-Time (Remote)",
      experience: "2 - 5 Years"
    },
    {
      id: "job_4",
      title: "UI/UX Product Designer",
      department: "Design",
      type: "Full-Time / Contract",
      experience: "2+ Years"
    }
  ];

  // Helper to convert file to Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Sound generator
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  // Markdown parser
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^[•\-]\s+(.*)$/gm, '<li class="chat-li">$1</li>');
    html = html.replace(/(<li class="chat-li">.*<\/li>)/s, '<ul class="chat-ul">$1</ul>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  }

  // Attach Shadow DOM
  const host = document.createElement('div');
  host.id = 'it-chatbot-root';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .chat-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${activeConfig.primaryColor}, ${activeConfig.secondaryColor});
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
      border: none;
      outline: none;
      z-index: 999999;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
    }
    .chat-launcher:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.45);
    }
    .chat-launcher svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
    }
    .chat-launcher .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      animation: pulseBadge 2s infinite;
    }
    @keyframes pulseBadge {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    .chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 410px;
      max-width: calc(100vw - 32px);
      height: 650px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(0,0,0,0.06);
    }
    .chat-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .chat-header {
      background: linear-gradient(135deg, ${activeConfig.primaryColor}, ${activeConfig.secondaryColor});
      color: #ffffff;
      padding: 15px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-wrapper {
      position: relative;
    }
    .bot-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      transition: all 0.2s ease;
      position: relative;
    }
    .bot-avatar.speaking {
      border-color: #a7f3d0;
      animation: avatarSpeakingPulse 1.4s infinite;
    }
    @keyframes avatarSpeakingPulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8), 0 0 12px rgba(52, 211, 153, 0.6); }
      50% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0), 0 0 20px rgba(52, 211, 153, 0.9); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0), 0 0 12px rgba(52, 211, 153, 0.6); }
    }
    .online-dot {
      position: absolute;
      bottom: 0px;
      right: 0px;
      width: 11px;
      height: 11px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid #ffffff;
    }
    .header-text h3 {
      font-size: 15.5px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .header-text p {
      font-size: 11.5px;
      opacity: 0.88;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .header-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }
    .header-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .cta-bar {
      background: #f8fafc;
      padding: 7px 12px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .cta-bar::-webkit-scrollbar {
      height: 3px;
    }
    .cta-btn {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 4px 9px;
      border-radius: 14px;
      font-size: 11.5px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .cta-btn:hover {
      background: #eff6ff;
      border-color: ${activeConfig.primaryColor};
      color: ${activeConfig.primaryColor};
    }
    .cta-btn.jobs-btn {
      background: #f5f3ff;
      border-color: #ddd6fe;
      color: #7c3aed;
    }
    .cta-btn.jobs-btn:hover {
      background: #ede9fe;
    }
    .cta-btn.whatsapp-btn {
      background: #25d366;
      color: #ffffff;
      border: none;
    }
    .cta-btn.whatsapp-btn:hover {
      background: #20ba59;
    }

    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fdfdfd;
    }
    .chat-messages::-webkit-scrollbar {
      width: 5px;
    }
    .chat-messages::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .msg-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 88%;
    }
    .msg-group.bot {
      align-self: flex-start;
    }
    .msg-group.user {
      align-self: flex-end;
    }

    .msg-bubble {
      padding: 11px 15px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .msg-group.bot .msg-bubble {
      background: #f1f5f9;
      color: #1e293b;
      border-top-left-radius: 4px;
    }
    .msg-group.user .msg-bubble {
      background: ${activeConfig.primaryColor};
      color: #ffffff;
      border-top-right-radius: 4px;
    }

    .file-attachment-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0,0,0,0.06);
      padding: 7px 10px;
      border-radius: 8px;
      margin-top: 6px;
      font-size: 12px;
    }
    .msg-group.user .file-attachment-card {
      background: rgba(255,255,255,0.2);
    }
    .file-attachment-card a {
      color: inherit;
      font-weight: 600;
      text-decoration: underline;
    }

    .msg-time {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .msg-group.user .msg-time {
      text-align: right;
    }

    .chat-ul {
      margin-left: 18px;
      margin-top: 6px;
      margin-bottom: 6px;
    }
    .chat-li {
      margin-bottom: 4px;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: #f1f5f9;
      border-radius: 14px;
      border-top-left-radius: 4px;
      width: fit-content;
    }
    .typing-dot {
      width: 6px;
      height: 6px;
      background: #64748b;
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes typingBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1.1); opacity: 1; }
    }

    .quick-chips-wrapper {
      padding: 8px 14px 4px 14px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 95px;
      overflow-y: auto;
    }
    .quick-chip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 11.5px;
      font-weight: 500;
      padding: 5px 10px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .quick-chip:hover {
      background: #eff6ff;
      border-color: ${activeConfig.primaryColor};
      color: ${activeConfig.primaryColor};
      transform: translateY(-1px);
    }

    /* Attachment Preview Bar above footer */
    .attachment-preview-bar {
      display: none;
      padding: 6px 14px;
      background: #eff6ff;
      border-top: 1px solid #dbeafe;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #1e40af;
    }
    .attachment-preview-info {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .attachment-remove-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      padding: 0 4px;
    }

    /* Footer */
    .chat-footer {
      padding: 10px 14px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .attach-btn, .mic-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .attach-btn:hover {
      background: #e2e8f0;
      color: var(--primary);
    }
    .attach-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .mic-btn:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fca5a5;
    }
    .mic-btn svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
    }
    .mic-btn.listening {
      background: #ef4444;
      color: #ffffff;
      border-color: #dc2626;
      animation: micPulse 1.2s infinite;
    }
    @keyframes micPulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); transform: scale(1); }
      50% { box-shadow: 0 0 0 9px rgba(239, 68, 68, 0); transform: scale(1.08); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
    }

    .speak-msg-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px;
      border-radius: 12px;
      margin-left: 8px;
      transition: all 0.15s;
    }
    .speak-msg-btn:hover {
      background: #eff6ff;
      color: ${activeConfig.primaryColor};
      border-color: #bfdbfe;
    }
    .speak-msg-btn.speaking {
      background: #dbeafe;
      color: ${activeConfig.primaryColor};
      border-color: ${activeConfig.primaryColor};
      font-weight: 700;
    }
    .chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      padding: 9px 15px;
      font-size: 13.5px;
      outline: none;
      background: #f8fafc;
      transition: border-color 0.2s;
    }
    .chat-input:focus {
      border-color: ${activeConfig.primaryColor};
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: ${activeConfig.primaryColor};
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.15s;
    }
    .send-btn:hover {
      background: ${activeConfig.secondaryColor};
      transform: scale(1.05);
    }
    .send-btn svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
    }

    /* Modals */
    .app-modal {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 20px;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .app-modal.active {
      transform: translateY(0);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .modal-header h4 {
      font-size: 16.5px;
      color: #0f172a;
      font-weight: 700;
    }
    .close-modal-btn {
      background: #f1f5f9;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #64748b;
    }
    .modal-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 14px;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 11px;
    }
    .form-group label {
      display: block;
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      background: #f8fafc;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: ${activeConfig.primaryColor};
      background: #ffffff;
    }
    .form-textarea {
      resize: none;
      height: 55px;
    }

    .upload-zone {
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-zone:hover {
      border-color: ${activeConfig.primaryColor};
      background: #eff6ff;
    }
    .upload-zone p {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .upload-zone .uploaded-file-name {
      font-weight: 600;
      color: #059669;
      margin-top: 4px;
    }

    .submit-btn {
      width: 100%;
      background: ${activeConfig.primaryColor};
      color: #ffffff;
      border: none;
      padding: 11px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13.5px;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.2s;
    }
    .submit-btn:hover {
      background: ${activeConfig.secondaryColor};
    }
    .success-alert {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      text-align: center;
      margin-top: 12px;
      display: none;
    }

    .job-list-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .job-card-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .job-card-item h5 {
      font-size: 13.5px;
      color: #0f172a;
      font-weight: 700;
    }
    .job-card-meta {
      font-size: 11.5px;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .job-card-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
    .job-apply-mini-btn {
      background: #7c3aed;
      color: #ffffff;
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .job-apply-mini-btn:hover {
      background: #6d28d9;
    }

    @media (max-width: 480px) {
      .chat-window {
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
      }
      .chat-launcher {
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  shadow.appendChild(style);

  // Widget Markup
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <!-- Launcher Button -->
    <button class="chat-launcher" id="launcherBtn" title="Chat with us" aria-label="Open Live Chat">
      <div class="badge" id="unreadBadge">1</div>
      <svg id="iconChat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
      </svg>
      <svg id="iconClose" viewBox="0 0 24 24" style="display:none;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- Main Chat Window -->
    <div class="chat-window" id="chatWindow">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <div class="avatar-wrapper">
            <div class="bot-avatar">🤖</div>
            <div class="online-dot"></div>
          </div>
          <div class="header-text">
            <h3 id="uiBotName">${activeConfig.botName}</h3>
            <p><span style="width:6px;height:6px;background:#86efac;border-radius:50%;display:inline-block;"></span> Online | <span id="uiCompanyName">${activeConfig.companyName}</span></p>
          </div>
        </div>
        <div class="header-actions">
          <button class="header-btn" id="voiceToggleBtn" title="Toggle Real Human Voice Output (Speech)">
            <svg id="iconVoice" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </button>
          <button class="header-btn" id="soundToggleBtn" title="Mute/Unmute sound chime">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <button class="header-btn" id="closeChatBtn" title="Close chat">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <!-- Action Navigation Bar -->
      <div class="cta-bar">
        <button class="cta-btn" id="btnOpenQuote">📋 Request Quote</button>
        <button class="cta-btn" id="btnOpenBooking">📅 Book Meeting</button>
        <button class="cta-btn jobs-btn" id="btnOpenJobs">🎯 Careers & Jobs</button>
        <a class="cta-btn whatsapp-btn" id="whatsappLink" href="https://wa.me/${activeConfig.whatsappNumber}?text=Hi%20${encodeURIComponent(activeConfig.companyName)},%20I'd%20like%20to%20discuss%20an%20IT%20project" target="_blank" rel="noopener">
          💬 WhatsApp
        </a>
      </div>

      <!-- Messages History -->
      <div class="chat-messages" id="messagesContainer"></div>

      <!-- Dynamic Prompt Chips -->
      <div class="quick-chips-wrapper" id="quickChips"></div>

      <!-- Attachment Preview Bar -->
      <div class="attachment-preview-bar" id="attachmentPreviewBar">
        <div class="attachment-preview-info">
          <span>📎</span>
          <span id="attachedFileName">document.pdf</span>
        </div>
        <button class="attachment-remove-btn" id="removeAttachmentBtn" title="Remove attachment">&times;</button>
      </div>

      <!-- Input Footer -->
      <div class="chat-footer">
        <input type="file" id="chatFileInput" style="display:none;" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
        <button class="attach-btn" id="attachFileBtn" title="Attach Document / Resume / Scope" aria-label="Attach File">
          <svg viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
        </button>
        <button class="mic-btn" id="micBtn" title="Voice Typing (Speak your question)" aria-label="Microphone">
          <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
        </button>
        <input type="text" class="chat-input" id="chatInput" placeholder="Ask a question or speak..." />
        <button class="send-btn" id="sendBtn" title="Send message" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>

      <!-- MODAL 1: Request Quote / Client Lead -->
      <div class="app-modal" id="quoteModal">
        <div class="modal-header">
          <h4>🚀 Project Quote Request</h4>
          <button class="close-modal-btn" data-close="quoteModal">&times;</button>
        </div>
        <p class="modal-subtitle">Share your requirements and attach any RFP, wireframe, or scope document for Developer Paresh and our team to review.</p>
        
        <form id="quoteForm">
          <div class="form-group">
            <label>Your Name *</label>
            <input type="text" class="form-input" id="leadName" required placeholder="e.g. Alex Miller" />
          </div>
          <div class="form-group">
            <label>Business Email *</label>
            <input type="email" class="form-input" id="leadEmail" required placeholder="e.g. alex@company.com" />
          </div>
          <div class="form-group">
            <label>Phone / WhatsApp</label>
            <input type="tel" class="form-input" id="leadPhone" placeholder="+1 (555) 000-0000" />
          </div>
          <div class="form-group">
            <label>Service Needed</label>
            <select class="form-select" id="leadService">
              <option value="Web & SaaS Development">Web & SaaS Development</option>
              <option value="Mobile App Development">Mobile App (iOS / Android)</option>
              <option value="AI / Machine Learning Solutions">AI / ML Chatbots & Solutions</option>
              <option value="Cloud & DevOps Engineering">Cloud & DevOps (AWS/GCP)</option>
              <option value="Hire Dedicated Developers">Hire Dedicated Developers</option>
              <option value="UI/UX Product Design">UI/UX Product Design</option>
              <option value="General IT Consultation">General IT Consultation</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estimated Budget</label>
            <select class="form-select" id="leadBudget">
              <option value="Under $2,500">Under $2,500</option>
              <option value="$2,500 - $5,000">$2,500 - $5,000</option>
              <option value="$5,000 - $15,000">$5,000 - $15,000</option>
              <option value="$15,000+">$15,000+ (Enterprise)</option>
              <option value="Not sure / Need Advice">Not sure / Need Advice</option>
            </select>
          </div>
          <div class="form-group">
            <label>Attach Project Scope / RFP / Wireframe (Optional)</label>
            <input type="file" id="quoteDocInput" style="display:none;" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
            <div class="upload-zone" id="quoteUploadZone">
              <p>📄 Click to upload scope document (.PDF, .DOCX, images)</p>
              <div class="uploaded-file-name" id="quoteFileName"></div>
            </div>
          </div>
          <div class="form-group">
            <label>Project Details</label>
            <textarea class="form-textarea" id="leadMsg" placeholder="Briefly describe what you want to build..."></textarea>
          </div>
          <button type="submit" class="submit-btn" id="submitQuoteBtn">Submit Quote Request</button>
          <div class="success-alert" id="quoteSuccessAlert">🎉 Request sent! Our solutions architect will contact you shortly.</div>
        </form>
      </div>

      <!-- MODAL 2: Online Video Meeting Booking -->
      <div class="app-modal" id="bookingModal">
        <div class="modal-header">
          <h4>📅 Book Online Consultation</h4>
          <button class="close-modal-btn" data-close="bookingModal">&times;</button>
        </div>
        <p class="modal-subtitle">Schedule a 1-on-1 Google Meet / Zoom discovery consultation with Developer Paresh and our lead architect.</p>

        <form id="bookingForm">
          <div class="form-group">
            <label>Consultation Topic / Type *</label>
            <select class="form-select" id="bookType">
              <option value="Free 30-Min Project Discovery Call">Free 30-Min Project Discovery Call</option>
              <option value="Technical Architecture & Stack Review">Technical Architecture & Stack Review</option>
              <option value="SaaS MVP Scoping & Roadmap">SaaS MVP Scoping & Roadmap</option>
              <option value="Dedicated Team & Developer Staffing">Dedicated Team & Developer Staffing</option>
              <option value="Career / Job Interview Inquiry">Career / Job Interview Inquiry</option>
            </select>
          </div>
          <div class="form-group">
            <label>Preferred Date *</label>
            <input type="date" class="form-input" id="bookDate" required />
          </div>
          <div class="form-group">
            <label>Preferred Time Slot *</label>
            <select class="form-select" id="bookTime">
              <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
              <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
              <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
              <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
              <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
              <option value="06:30 PM - 07:00 PM">06:30 PM - 07:00 PM</option>
            </select>
          </div>
          <div class="form-group">
            <label>Your Name *</label>
            <input type="text" class="form-input" id="bookName" required placeholder="e.g. Sarah Jenkins" />
          </div>
          <div class="form-group">
            <label>Email Address (For Calendar Invite) *</label>
            <input type="email" class="form-input" id="bookEmail" required placeholder="e.g. sarah@company.com" />
          </div>
          <div class="form-group">
            <label>Phone / WhatsApp</label>
            <input type="tel" class="form-input" id="bookPhone" placeholder="+1 (555) 000-0000" />
          </div>
          <div class="form-group">
            <label>Discussion Agenda / Notes</label>
            <textarea class="form-textarea" id="bookNotes" placeholder="What would you like to discuss in this call?"></textarea>
          </div>
          <button type="submit" class="submit-btn" id="submitBookingBtn">Confirm Online Meeting</button>
          <div class="success-alert" id="bookSuccessAlert">🎉 Meeting booked! A calendar invite will be emailed to you.</div>
        </form>
      </div>

      <!-- MODAL 3: Open Jobs Listing -->
      <div class="app-modal" id="jobsModal">
        <div class="modal-header">
          <h4>🎯 Current Job Openings</h4>
          <button class="close-modal-btn" data-close="jobsModal">&times;</button>
        </div>
        <p class="modal-subtitle">Join INAxDeveloper! Browse active engineering vacancies and apply with your resume.</p>

        <div class="job-list-container" id="jobListContainer"></div>

        <div style="margin-top:14px; text-align:center;">
          <button class="cta-btn" id="btnGeneralApply" style="width:100%; justify-content:center; padding:9px;">
            📄 Submit General Application with Resume
          </button>
        </div>
      </div>

      <!-- MODAL 4: Job Application Form with Resume Upload -->
      <div class="app-modal" id="applyModal">
        <div class="modal-header">
          <h4 id="applyModalTitle">🎯 Apply for Position</h4>
          <button class="close-modal-btn" data-close="applyModal">&times;</button>
        </div>
        <p class="modal-subtitle">Submit your profile & resume to INAxDeveloper. We review and respond within 24-48 hours.</p>

        <form id="applyForm">
          <div class="form-group">
            <label>Position Applying For *</label>
            <select class="form-select" id="applyJobSelect"></select>
          </div>
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" class="form-input" id="candidateName" required placeholder="e.g. David Patel" />
          </div>
          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" class="form-input" id="candidateEmail" required placeholder="e.g. david@example.com" />
          </div>
          <div class="form-group">
            <label>Phone / WhatsApp *</label>
            <input type="tel" class="form-input" id="candidatePhone" required placeholder="+91 98765 00000" />
          </div>
          <div class="form-group">
            <label>Years of Experience *</label>
            <input type="text" class="form-input" id="candidateExp" required placeholder="e.g. 3.5 Years" />
          </div>
          <div class="form-group">
            <label>Portfolio / LinkedIn / GitHub URL *</label>
            <input type="url" class="form-input" id="candidatePortfolio" required placeholder="https://linkedin.com/in/... or github.com/..." />
          </div>
          <div class="form-group">
            <label>Upload Resume / CV (.PDF, .DOCX) *</label>
            <input type="file" id="resumeFileInput" style="display:none;" accept=".pdf,.doc,.docx,.txt" />
            <div class="upload-zone" id="resumeUploadZone">
              <p>📄 Click to upload your resume (.PDF, .DOCX)</p>
              <div class="uploaded-file-name" id="resumeFileName"></div>
            </div>
          </div>
          <div class="form-group">
            <label>Key Tech Skills & Brief Cover Note</label>
            <textarea class="form-textarea" id="candidateCover" placeholder="Tell us about the key frameworks or projects you have built..."></textarea>
          </div>
          <button type="submit" class="submit-btn" id="submitApplyBtn">Submit Job Application & Resume</button>
          <div class="success-alert" id="applySuccessAlert">🎉 Application & resume received! Our recruitment team will review your profile.</div>
        </form>
      </div>

    </div>
  `;
  shadow.appendChild(wrapper);

  // References
  const launcherBtn = shadow.getElementById('launcherBtn');
  const chatWindow = shadow.getElementById('chatWindow');
  const iconChat = shadow.getElementById('iconChat');
  const iconClose = shadow.getElementById('iconClose');
  const unreadBadge = shadow.getElementById('unreadBadge');
  const closeChatBtn = shadow.getElementById('closeChatBtn');
  const messagesContainer = shadow.getElementById('messagesContainer');
  const quickChips = shadow.getElementById('quickChips');
  const chatInput = shadow.getElementById('chatInput');
  const sendBtn = shadow.getElementById('sendBtn');
  const soundToggleBtn = shadow.getElementById('soundToggleBtn');

  // File Attachment references
  const attachFileBtn = shadow.getElementById('attachFileBtn');
  const chatFileInput = shadow.getElementById('chatFileInput');
  const attachmentPreviewBar = shadow.getElementById('attachmentPreviewBar');
  const attachedFileNameEl = shadow.getElementById('attachedFileName');
  const removeAttachmentBtn = shadow.getElementById('removeAttachmentBtn');

  let currentChatAttachment = null;

  // File Attachment Handlers
  attachFileBtn.addEventListener('click', () => chatFileInput.click());

  chatFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please attach a smaller document.');
      return;
    }

    try {
      const base64Data = await fileToBase64(file);
      currentChatAttachment = {
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        base64Data: base64Data,
        fileUrl: base64Data // Fallback for standalone/GitHub Pages
      };

      attachedFileNameEl.textContent = `${file.name} (${currentChatAttachment.fileSize})`;
      attachmentPreviewBar.style.display = 'flex';
    } catch (err) {
      alert('Could not read file.');
    }
  });

  removeAttachmentBtn.addEventListener('click', () => {
    currentChatAttachment = null;
    chatFileInput.value = '';
    attachmentPreviewBar.style.display = 'none';
  });

  // Quote File Upload zone
  const quoteDocInput = shadow.getElementById('quoteDocInput');
  const quoteUploadZone = shadow.getElementById('quoteUploadZone');
  const quoteFileName = shadow.getElementById('quoteFileName');
  let currentQuoteDoc = null;

  quoteUploadZone.addEventListener('click', () => quoteDocInput.click());
  quoteDocInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64Data = await fileToBase64(file);
      currentQuoteDoc = {
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        base64Data: base64Data,
        fileUrl: base64Data
      };
      quoteFileName.textContent = `✓ Selected: ${file.name} (${currentQuoteDoc.fileSize})`;
    }
  });

  // Resume Upload zone
  const resumeFileInput = shadow.getElementById('resumeFileInput');
  const resumeUploadZone = shadow.getElementById('resumeUploadZone');
  const resumeFileName = shadow.getElementById('resumeFileName');
  let currentResumeFile = null;

  resumeUploadZone.addEventListener('click', () => resumeFileInput.click());
  resumeFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64Data = await fileToBase64(file);
      currentResumeFile = {
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        base64Data: base64Data,
        fileUrl: base64Data
      };
      resumeFileName.textContent = `✓ Selected: ${file.name} (${currentResumeFile.fileSize})`;
    }
  });

  // Modals
  const quoteModal = shadow.getElementById('quoteModal');
  const bookingModal = shadow.getElementById('bookingModal');
  const jobsModal = shadow.getElementById('jobsModal');
  const applyModal = shadow.getElementById('applyModal');

  shadow.getElementById('btnOpenQuote').addEventListener('click', () => openModal(quoteModal));
  shadow.getElementById('btnOpenBooking').addEventListener('click', () => openModal(bookingModal));
  shadow.getElementById('btnOpenJobs').addEventListener('click', () => { renderJobsList(); openModal(jobsModal); });
  shadow.getElementById('btnGeneralApply').addEventListener('click', () => {
    closeModal(jobsModal);
    openApplyModal('General IT Application');
  });

  shadow.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const targetModal = shadow.getElementById(targetId);
      if (targetModal) closeModal(targetModal);
    });
  });

  function openModal(modal) {
    [quoteModal, bookingModal, jobsModal, applyModal].forEach(m => m.classList.remove('active'));
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  function openApplyModal(selectedJobTitle) {
    const select = shadow.getElementById('applyJobSelect');
    select.innerHTML = '';
    
    activeJobs.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j.title;
      opt.textContent = `${j.title} (${j.type})`;
      if (selectedJobTitle && (j.title === selectedJobTitle || selectedJobTitle.includes(j.title))) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    const generalOpt = document.createElement('option');
    generalOpt.value = 'General / Future Opening';
    generalOpt.textContent = 'General / Other IT Role';
    if (selectedJobTitle === 'General IT Application') generalOpt.selected = true;
    select.appendChild(generalOpt);

    shadow.getElementById('applyModalTitle').textContent = `🎯 Apply: ${selectedJobTitle || 'Open Position'}`;
    openModal(applyModal);
  }

  function renderJobsList() {
    const container = shadow.getElementById('jobListContainer');
    container.innerHTML = '';
    if (!activeJobs || activeJobs.length === 0) {
      container.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center; padding:20px;">No current openings posted at this moment. You can still submit a general application!</p>';
      return;
    }

    activeJobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card-item';
      card.innerHTML = `
        <h5>${escapeHtml(job.title)}</h5>
        <div class="job-card-meta">
          <span>📁 ${escapeHtml(job.department || 'Engineering')}</span>
          <span>💼 ${escapeHtml(job.type || 'Full-Time')}</span>
          <span>⏳ ${escapeHtml(job.experience || '2+ Yrs')}</span>
        </div>
        <div class="job-card-actions">
          <button class="job-apply-mini-btn" data-job="${escapeHtml(job.title)}">Apply & Upload Resume</button>
        </div>
      `;
      card.querySelector('.job-apply-mini-btn').addEventListener('click', () => {
        closeModal(jobsModal);
        openApplyModal(job.title);
      });
      container.appendChild(card);
    });
  }

  let isSoundEnabled = true;
  let isVoiceOutputEnabled = true;
  let isOpen = false;
  let chatHistory = [];

  // ==================== REALISTIC VOICE ENGINE (TTS) ====================
  let availableVoices = [];
  function loadVoices() {
    if ('speechSynthesis' in window) {
      availableVoices = window.speechSynthesis.getVoices();
    }
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getBestRealisticVoice() {
    if (!availableVoices || availableVoices.length === 0) loadVoices();
    if (!availableVoices || availableVoices.length === 0) return null;

    // 1. Natural / Online / Neural voices (Edge / Chrome)
    const natural = availableVoices.find(v => /natural|online|neural|google/i.test(v.name) && /^en/i.test(v.lang));
    if (natural) return natural;

    // 2. Clear English voices
    const en = availableVoices.find(v => /^en[-_]/i.test(v.lang));
    if (en) return en;

    return availableVoices[0];
  }

  function cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[•\-]\s+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const avatar = shadow.querySelector('.bot-avatar');
    if (avatar) avatar.classList.remove('speaking');
    shadow.querySelectorAll('.speak-msg-btn').forEach(b => {
      b.classList.remove('speaking');
      b.textContent = '🔊 Listen';
    });
  }

  function speakMessage(rawText, btnEl) {
    if (!('speechSynthesis' in window)) return;

    if (btnEl && btnEl.classList.contains('speaking')) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const cleanText = cleanSpeechText(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = getBestRealisticVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    const avatar = shadow.querySelector('.bot-avatar');

    utterance.onstart = () => {
      if (avatar) avatar.classList.add('speaking');
      if (btnEl) {
        btnEl.classList.add('speaking');
        btnEl.textContent = '⏹ Stop';
      }
    };

    utterance.onend = utterance.onerror = () => {
      if (avatar) avatar.classList.remove('speaking');
      if (btnEl) {
        btnEl.classList.remove('speaking');
        btnEl.textContent = '🔊 Listen';
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // Header Voice Toggle
  const voiceToggleBtn = shadow.getElementById('voiceToggleBtn');
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
      isVoiceOutputEnabled = !isVoiceOutputEnabled;
      voiceToggleBtn.style.opacity = isVoiceOutputEnabled ? '1' : '0.4';
      if (!isVoiceOutputEnabled) stopSpeaking();
    });
  }

  // ==================== VOICE INPUT (SPEECH-TO-TEXT) ====================
  const micBtn = shadow.getElementById('micBtn');
  let recognition = null;
  let isRecognizing = false;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isRecognizing = true;
      micBtn.classList.add('listening');
      chatInput.placeholder = '🎙️ Listening... Speak your query now!';
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      chatInput.value = transcript;
    };

    recognition.onend = () => {
      isRecognizing = false;
      micBtn.classList.remove('listening');
      chatInput.placeholder = 'Ask a question or speak...';
      chatInput.focus();
    };

    recognition.onerror = () => {
      isRecognizing = false;
      micBtn.classList.remove('listening');
      chatInput.placeholder = 'Ask a question or speak...';
    };
  }

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (!recognition) {
        alert('Voice microphone input is supported in Google Chrome, Microsoft Edge, and Safari. Please type your query.');
        return;
      }
      if (isRecognizing) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  function toggleChat(forceState) {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    if (isOpen) {
      chatWindow.classList.add('open');
      iconChat.style.display = 'none';
      iconClose.style.display = 'block';
      unreadBadge.style.display = 'none';
      setTimeout(() => chatInput.focus(), 200);
    } else {
      chatWindow.classList.remove('open');
      iconChat.style.display = 'block';
      iconClose.style.display = 'none';
      stopSpeaking();
      [quoteModal, bookingModal, jobsModal, applyModal].forEach(m => m.classList.remove('active'));
    }
  }

  launcherBtn.addEventListener('click', () => toggleChat());
  closeChatBtn.addEventListener('click', () => toggleChat(false));

  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggleBtn.style.opacity = isSoundEnabled ? '1' : '0.4';
  });

  function renderQuickChips() {
    quickChips.innerHTML = '';
    activeConfig.quickPrompts.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'quick-chip';
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        if (p.action === 'open_jobs') {
          renderJobsList();
          openModal(jobsModal);
        } else if (p.action === 'open_booking') {
          openModal(bookingModal);
        } else if (p.action === 'open_quote') {
          openModal(quoteModal);
        } else {
          handleUserSend(p.query);
        }
      });
      quickChips.appendChild(btn);
    });
  }

  function getTimeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(sender, text, attachment) {
    const group = document.createElement('div');
    group.className = `msg-group ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = formatMarkdown(text);

    if (attachment) {
      const fileCard = document.createElement('div');
      fileCard.className = 'file-attachment-card';
      fileCard.innerHTML = `
        <span>📄</span>
        <div>
          <a href="${attachment.fileUrl || '#'}" download="${escapeHtml(attachment.fileName)}" target="_blank">${escapeHtml(attachment.fileName)}</a>
          <div style="font-size:10px; opacity:0.8;">${escapeHtml(attachment.fileSize || '')}</div>
        </div>
      `;
      bubble.appendChild(fileCard);
    }

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = getTimeStr();

    if (sender === 'bot') {
      const speakBtn = document.createElement('button');
      speakBtn.className = 'speak-msg-btn';
      speakBtn.innerHTML = '🔊 Listen';
      speakBtn.title = 'Listen in realistic human voice';
      speakBtn.addEventListener('click', () => speakMessage(text, speakBtn));
      time.appendChild(speakBtn);

      // Auto-speak if voice is enabled and chat window is actively open
      if (isOpen && isVoiceOutputEnabled) {
        setTimeout(() => speakMessage(text, speakBtn), 250);
      }
    }

    group.appendChild(bubble);
    group.appendChild(time);
    messagesContainer.appendChild(group);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (sender === 'bot' && isSoundEnabled) {
      playNotificationSound();
    }
  }

  let typingEl = null;
  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  async function handleUserSend(text) {
    const msg = (text || chatInput.value).trim();
    const attachment = currentChatAttachment;

    if (!msg && !attachment) return;

    chatInput.value = '';
    currentChatAttachment = null;
    chatFileInput.value = '';
    attachmentPreviewBar.style.display = 'none';

    addMessage('user', msg || 'Sent a document', attachment);
    chatHistory.push({ role: 'user', text: msg || `[Attached file: ${attachment.fileName}]` });

    showTyping();

    if (attachment) {
      // Try uploading to backend /api/upload
      try {
        const upRes = await fetch(`${activeConfig.apiEndpoint}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachment)
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          attachment.fileUrl = upData.fileUrl;
        }
      } catch (e) {}

      setTimeout(() => {
        hideTyping();
        const reply = `Thank you for sharing **${attachment.fileName}**! 📄\n\nI have attached this document to your chat session. Our engineering and recruitment team at **${activeConfig.companyName}** will review it carefully.\n\n• Click **'📋 Request Quote'** to attach project specs\n• Click **'🎯 Careers & Jobs'** to apply for open developer positions`;
        addMessage('bot', reply);
        chatHistory.push({ role: 'bot', text: reply });
      }, 700);
      return;
    }

    if (/\b(job|jobs|career|careers|hiring|vacancy|vacancies|apply|work with you|resume|intern)\b/i.test(msg)) {
      setTimeout(() => {
        hideTyping();
        let jobList = activeJobs.map((j, i) => `${i+1}. **${j.title}** (${j.type})\n   • Exp: ${j.experience} | Dept: ${j.department}`).join('\n\n');
        const reply = `🎯 **We have active career opportunities at INAxDeveloper!**\n\n${jobList}\n\n👉 Click **'🎯 Careers & Jobs'** in the top bar to apply and **upload your resume (.PDF/.DOCX)**!`;
        addMessage('bot', reply);
        chatHistory.push({ role: 'bot', text: reply });
      }, 600);
      return;
    }

    if (/\b(book|booking|meeting|schedule|call|appointment|demo)\b/i.test(msg)) {
      setTimeout(() => {
        hideTyping();
        const reply = "You can schedule a 1-on-1 online video consultation with Developer Paresh!\n\n👉 Click **'📅 Book Meeting'** at the top bar to choose your preferred date, time slot, and discussion topic.";
        addMessage('bot', reply);
        chatHistory.push({ role: 'bot', text: reply });
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${activeConfig.apiEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: chatHistory })
      });

      if (!res.ok) throw new Error('Backend offline');
      const data = await res.json();
      hideTyping();
      const reply = data.reply || "Thank you for asking! How else can I assist you with your project or career goals?";
      addMessage('bot', reply);
      chatHistory.push({ role: 'bot', text: reply });
    } catch (err) {
      setTimeout(() => {
        hideTyping();
        const reply = `Thank you for contacting **${activeConfig.companyName}**! We specialize in custom software engineering, mobile apps, and AI solutions.\n\n• Click **'📋 Request Quote'** for estimates\n• Click **'📅 Book Meeting'** to schedule an online video consultation\n• Click **'🎯 Careers & Jobs'** to explore open positions & upload resumes`;
        addMessage('bot', reply);
        chatHistory.push({ role: 'bot', text: reply });
      }, 500);
    }
  }

  sendBtn.addEventListener('click', () => handleUserSend());
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUserSend();
    }
  });

  // Handle Quote Form Submission (with document)
  shadow.getElementById('quoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = shadow.getElementById('submitQuoteBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting Request & Document...';

    // Upload attachment if any
    let attachmentObj = currentQuoteDoc;
    if (attachmentObj) {
      try {
        const upRes = await fetch(`${activeConfig.apiEndpoint}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachmentObj)
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          attachmentObj.fileUrl = upData.fileUrl;
        }
      } catch (err) {}
    }

    const leadData = {
      name: shadow.getElementById('leadName').value,
      email: shadow.getElementById('leadEmail').value,
      phone: shadow.getElementById('leadPhone').value,
      service: shadow.getElementById('leadService').value,
      budget: shadow.getElementById('leadBudget').value,
      message: shadow.getElementById('leadMsg').value,
      attachment: attachmentObj
    };

    try {
      await fetch(`${activeConfig.apiEndpoint}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem('it_chatbot_leads') || '[]');
      stored.unshift({ ...leadData, id: 'local_' + Date.now(), createdAt: new Date().toISOString() });
      localStorage.setItem('it_chatbot_leads', JSON.stringify(stored));
    }

    btn.disabled = false;
    btn.textContent = 'Submitted!';
    shadow.getElementById('quoteSuccessAlert').style.display = 'block';

    setTimeout(() => {
      closeModal(quoteModal);
      shadow.getElementById('quoteSuccessAlert').style.display = 'none';
      btn.textContent = 'Submit Quote Request';
      shadow.getElementById('quoteForm').reset();
      quoteFileName.textContent = '';
      currentQuoteDoc = null;
      addMessage('bot', `Thank you **${leadData.name}**! 🎉 Your request for **${leadData.service}** has been received${leadData.attachment ? ` along with your document **${leadData.attachment.fileName}**` : ''}. Developer Paresh and our senior architect will review it and reach out shortly.`);
    }, 1800);
  });

  // Handle Online Meeting Booking Submission
  shadow.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = shadow.getElementById('submitBookingBtn');
    btn.disabled = true;
    btn.textContent = 'Booking Slot...';

    const meetData = {
      name: shadow.getElementById('bookName').value,
      email: shadow.getElementById('bookEmail').value,
      phone: shadow.getElementById('bookPhone').value,
      meetingType: shadow.getElementById('bookType').value,
      preferredDate: shadow.getElementById('bookDate').value,
      preferredTime: shadow.getElementById('bookTime').value,
      notes: shadow.getElementById('bookNotes').value
    };

    try {
      await fetch(`${activeConfig.apiEndpoint}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetData)
      });
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem('it_chatbot_meetings') || '[]');
      stored.unshift({ ...meetData, id: 'local_meet_' + Date.now(), createdAt: new Date().toISOString() });
      localStorage.setItem('it_chatbot_meetings', JSON.stringify(stored));
    }

    btn.disabled = false;
    btn.textContent = 'Booked!';
    shadow.getElementById('bookSuccessAlert').style.display = 'block';

    setTimeout(() => {
      closeModal(bookingModal);
      shadow.getElementById('bookSuccessAlert').style.display = 'none';
      btn.textContent = 'Confirm Online Meeting';
      shadow.getElementById('bookingForm').reset();
      addMessage('bot', `Awesome **${meetData.name}**! 📅 Your **${meetData.meetingType}** is scheduled for **${meetData.preferredDate}** at **${meetData.preferredTime}**. A calendar link will be sent to ${meetData.email}.`);
    }, 1800);
  });

  // Handle Job Application Submission (with Resume Upload)
  shadow.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = shadow.getElementById('submitApplyBtn');
    btn.disabled = true;
    btn.textContent = 'Uploading Resume & Profile...';

    // Upload resume file if provided
    let resumeFileObj = currentResumeFile;
    if (resumeFileObj) {
      try {
        const upRes = await fetch(`${activeConfig.apiEndpoint}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resumeFileObj)
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          resumeFileObj.fileUrl = upData.fileUrl;
        }
      } catch (err) {}
    }

    const appData = {
      jobTitle: shadow.getElementById('applyJobSelect').value,
      name: shadow.getElementById('candidateName').value,
      email: shadow.getElementById('candidateEmail').value,
      phone: shadow.getElementById('candidatePhone').value,
      experience: shadow.getElementById('candidateExp').value,
      portfolio: shadow.getElementById('candidatePortfolio').value,
      resumeFile: resumeFileObj,
      coverNote: shadow.getElementById('candidateCover').value
    };

    try {
      await fetch(`${activeConfig.apiEndpoint}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem('it_chatbot_applications') || '[]');
      stored.unshift({ ...appData, id: 'local_app_' + Date.now(), createdAt: new Date().toISOString() });
      localStorage.setItem('it_chatbot_applications', JSON.stringify(stored));
    }

    btn.disabled = false;
    btn.textContent = 'Submitted!';
    shadow.getElementById('applySuccessAlert').style.display = 'block';

    setTimeout(() => {
      closeModal(applyModal);
      shadow.getElementById('applySuccessAlert').style.display = 'none';
      btn.textContent = 'Submit Job Application & Resume';
      shadow.getElementById('applyForm').reset();
      resumeFileName.textContent = '';
      currentResumeFile = null;
      addMessage('bot', `Thank you **${appData.name}**! 🚀 Your application for **${appData.jobTitle}**${appData.resumeFile ? ` and resume (**${appData.resumeFile.fileName}**)` : ''} has been received. Our HR & recruitment team will evaluate your profile and contact you.`);
    }, 1800);
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Fetch Live Jobs & Dynamic Config from Backend or static files (for GitHub Pages)
  async function loadBackendData() {
    try {
      let cfg = null;
      try {
        const cfgRes = await fetch(`${activeConfig.apiEndpoint}/api/config`);
        if (cfgRes.ok) cfg = await cfgRes.json();
      } catch (e) {}

      if (!cfg) {
        try {
          const staticCfgRes = await fetch('config.json');
          if (staticCfgRes.ok) cfg = await staticCfgRes.json();
        } catch (e) {}
      }

      if (cfg) {
        if (cfg.company) {
          activeConfig.companyName = cfg.company.name || activeConfig.companyName;
          activeConfig.botName = cfg.company.botName || activeConfig.botName;
          shadow.getElementById('uiBotName').textContent = activeConfig.botName;
          shadow.getElementById('uiCompanyName').textContent = activeConfig.companyName;
        }
        if (cfg.quickActions && Array.isArray(cfg.quickActions)) {
          activeConfig.quickPrompts = cfg.quickActions;
          renderQuickChips();
        }
      }

      let jobsData = null;
      try {
        const jobsRes = await fetch(`${activeConfig.apiEndpoint}/api/jobs`);
        if (jobsRes.ok) jobsData = await jobsRes.json();
      } catch (e) {}

      if (!jobsData) {
        try {
          const staticJobsRes = await fetch('jobs.json');
          if (staticJobsRes.ok) {
            const rawJobs = await staticJobsRes.json();
            jobsData = { jobs: rawJobs };
          }
        } catch (e) {}
      }

      if (jobsData && jobsData.jobs && Array.isArray(jobsData.jobs)) {
        activeJobs = jobsData.jobs.filter(j => j.status === 'Active');
      }
    } catch (err) {}
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = shadow.getElementById('bookDate');
  if (dateInput) {
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  addMessage('bot', activeConfig.welcomeMessage);
  renderQuickChips();
  loadBackendData();

})();
