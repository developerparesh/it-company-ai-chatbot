# 🤖 IT Company AI Live Chatbot, Hiring & Booking Assistant

A production-ready, ultra-lightweight (<30 KB), embeddable AI Live Chatbot specifically built for **IT & Software Development Companies**.

Now updated with full **Admin Control** over:
1. 💼 **IT Client Queries & Cost Estimates**
2. 📅 **Online Video Meeting & Consultation Booking** (Google Meet / Zoom discovery calls)
3. 🎯 **Job Finding & Career Applications** (Admin posts vacancies; candidates apply directly inside the chat!)
4. 💬 **Custom Prompts & Knowledge Base FAQs** (Admin can add any question & answer or custom button to the chat!)

---

## 🌟 Key Features

- **⚡ Lightweight & Isolated (Shadow DOM)**: Zero styling collisions with existing website CSS (WordPress, Shopify, React, Next.js, HTML).
- **💼 IT Solutions Intelligence**: Pre-trained on Custom Web/SaaS, Mobile Apps (iOS/Android), AI/ML Chatbots, Cloud & DevOps, Tech Stack info, and Developer Hiring.
- **📅 Online Consultation Booking**:
  - Clients can select Consultation Topic, Date, and Time Slot.
  - Submits direct calendar appointment requests to the admin.
- **🎯 Career & Job Openings Management**:
  - **Admin can post new IT Jobs**: Title, Department, Experience, Type (Remote/Hybrid), Salary range, and Description.
  - **Candidates browse jobs in the chat**: Candidates see open vacancies and click **"Apply Now"**.
  - **Built-in Application Form**: Captures Candidate Name, Email, Phone, Years of Experience, Portfolio/LinkedIn URL, and Resume link.
  - **Candidate Pipeline in Admin**: HR/Admin can track applications, update statuses (*Shortlisted, Interview Scheduled, Offer Made, Rejected*), and export to CSV!
- **💬 Custom Chat Prompts & FAQ Builder**:
  - Admin can add custom buttons and custom question/answer triggers anytime via [admin.html](file:///C:/Users/pares/Desktop/Create%20your%20free%20live%20chat/admin.html).
- **📥 1-Click CSV Exports**: Export Client Leads, Booked Meetings, and Candidate Resumes directly to Excel/CSV.
- **💬 Direct WhatsApp Chat**: Instant WhatsApp button with pre-filled message.

---

## 🚀 Running the App

### Option A: Local Server (Active & Running)
The Node.js server is already active on your machine:
- **Demo Website:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

To restart anytime from PowerShell:
```powershell
cd "C:\Users\pares\Desktop\Create your free live chat"
npm start
```

---

## 💻 1-Line Embed Code for Any Website

Paste this single line right before the closing `</body>` tag on any HTML, WordPress, Shopify, or Webflow site:

```html
<!-- IT Company AI Live Chatbot Widget -->
<script src="it-chatbot.js"></script>
```

---

## 📁 File Structure

```text
Create your free live chat/
├── it-chatbot.js      # Embeddable chat widget (Shadow DOM, Quotes, Meetings, Careers)
├── index.html         # Live demo IT website with interactive triggers
├── admin.html         # Admin dashboard for Leads, Meetings, Job Postings, and Candidates
├── server.js          # Express server with REST APIs & Gemini integration
├── config.json        # Company config, booking settings, services, and custom FAQs
├── jobs.json          # Active job vacancies posted by Admin
├── applications.json  # Job applications submitted by candidates
├── meetings.json      # Booked video consultation appointments
├── leads.json         # Client project inquiries & quotes
├── package.json       # Dependencies (express, cors)
└── README.md          # Full documentation
```
