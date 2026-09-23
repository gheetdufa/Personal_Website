// Project content and screenshots from gheetdufa/Personal_Website.
export const PROJECTS = {
  "synari": {
    "title": "Synari",
    "kicker": "01 — therapy practice platform",
    "img": "./assets/projects/synari-10edb4f1.png",
    "chips": [
      "full-stack",
      "solo build",
      "1+ year",
      "real users",
      "ai integration"
    ],
    "paragraphs": [
      "Synari is a therapy practice management platform that I have been developing over the past year. I built it to help clinicians reduce the stress of documentation, scheduling, and administrative tasks that slow down their day. The project started after speaking with therapists who shared how inefficient their current tools were. I designed the entire system myself and shaped it through ongoing feedback from real users who needed something practical and reliable.",
      "This project demonstrates my ability to build and maintain a full stack application from the ground up. Through Synari, I learned how to translate real user needs into technical decisions, create an interface that reduces cognitive load, and integrate AI responsibly within a workflow. It also reflects my experience managing a long-term project, gathering feedback, iterating on design choices, and building features through consistent testing.",
      "Synari reflects the engineer I am becoming: someone who builds intentionally, consults with users, and focuses on creating technology that eases people's lives."
    ],
    "links": [
      {
        "label": "visit synari.org ↗",
        "href": "https://synari.org/"
      }
    ]
  },
  "autoapply": {
    "title": "auto-apply",
    "kicker": "02 — local job-search pipeline",
    "img": "./assets/projects/auto-apply.png",
    "chips": [
      "next.js",
      "claude",
      "playwright",
      "sqlite",
      "ats scout"
    ],
    "paragraphs": [
      "auto-apply is a local job-search pipeline for new-grad and internship SWE roles. It watches public GitHub job lists and company ATS boards, surfaces new postings as they appear, writes tailored cover letters and screening answers with Claude, and can auto-fill applications through Playwright.",
      "The pipeline runs fully on your machine: ingest and scout across SimplifyJobs, Greenhouse, Lever, Ashby, HN, and more; enrich each posting with the real form questions; draft answers grounded in your profile; then apply with a headed browser. A launchd watcher and macOS notifications keep the inbox current without sending anything off-device.",
      "It is built to be fast where it matters: delta detection so backfills stay quiet, parallel enrichment so one slow career site cannot stall the run, and a training-wheels mode that fills every field but leaves the final submit click to you."
    ],
    "links": [
      {
        "label": "github ↗",
        "href": "https://github.com/gheetdufa/auto_apply"
      }
    ]
  },
  "autotrader": {
    "title": "auto-trader",
    "kicker": "03 — automated swing trading",
    "img": "./assets/projects/auto-trader.png",
    "chips": [
      "python",
      "yfinance",
      "ai agents",
      "robinhood mcp",
      "risk rails"
    ],
    "paragraphs": [
      "auto-trader is an automated swing-trading system built around a deterministic Python engine with AI agents for review and execution. It targets Robinhood Agentic Trading with ring-fenced stock and options sleeves so neither budget can raid the other.",
      "Daily bars feed momentum, RSI(2), and regime signals into order proposals. A reviewer agent can only veto or shrink size; an executor agent applies a news overlay, runs a hard risk validator, and only then sends fills through the Robinhood MCP. Every trade is journaled to git and pushed with phone alerts.",
      "The stock sleeve runs a momentum core with a mean-reversion satellite and a SPY 200-day regime filter. Options stay in paper mode as call debit spreads until explicitly flipped live. Hard rails cover position caps, trailing stops, drawdown kill switches, and a whitelist so the agents cannot invent risk."
    ],
    "links": [
      {
        "label": "github ↗",
        "href": "https://github.com/gheetdufa/auto-trader"
      }
    ]
  },
  "signlang": {
    "title": "SignLang Interface",
    "kicker": "04 — accessible communication",
    "img": "./assets/projects/Translator.png",
    "chips": [
      "machine learning",
      "accessibility",
      "sensors",
      "human-centered"
    ],
    "paragraphs": [
      "This project began when my friend lost an arm and needed a more accessible way to communicate using sign language. I wanted to help them regain some independence, so I started building an interface that could translate one-handed inputs into digital gestures. I experimented with sensors, machine learning models, and lightweight interaction patterns to create something that felt natural. The project's purpose was personal, and every design choice came from trying to meet a real need.",
      "It shows how I approach engineering with empathy, careful attention, and direct communication with the person who will use the final product. I learned how to adapt tools to a single user's daily challenges, adjust design features based on comfort, and refine prototypes through consistent testing and feedback. It pushed me to think about accessibility not as a feature but as a core requirement.",
      "This project captures the kind of work I want to continue doing: work that matters to someone's life and reflects both technical effort and care."
    ],
    "links": [
      {
        "label": "view on github ↗",
        "href": "https://github.com/ukataria/Bitcamp2024/tree/main"
      }
    ]
  },
  "audit": {
    "title": "Audit.AI",
    "kicker": "05 — ai-art detection",
    "img": "./assets/projects/project-2.png",
    "chips": [
      "chrome extension",
      "yolo pipeline",
      "team project",
      "hackathon"
    ],
    "paragraphs": [
      "Audit AI is a Chrome extension created to help users identify whether digital artwork is real or AI-generated. The idea came from seeing confusion and controversy surrounding the authenticity of online art. My team and I wanted to give everyday users a quick way to check the origins of what they were seeing. Audit AI analyzes images directly within the browser and provides an instant assessment, making it easier for people to navigate an online space where AI-generated content is becoming harder to distinguish.",
      "Building Audit AI required integrating a YOLO-based image recognition pipeline with a smooth frontend experience that fit naturally into the browser environment. The project challenged us to optimize performance, handle diverse image formats, and create a tool that felt fast and reliable. It demonstrates my ability to connect technical components into a cohesive product and to iterate on challenges such as latency, accuracy, and user experience.",
      "Audit AI represents the kind of builder I aim to be: someone who takes initiative and creates tools that give people clarity in a changing digital world."
    ],
    "links": [
      {
        "label": "devpost ↗",
        "href": "https://devpost.com/software/audit-ai"
      },
      {
        "label": "github ↗",
        "href": "https://github.com/ukataria/Bitcamp2024/tree/main"
      }
    ]
  },
  "rant": {
    "title": "Rant.AI",
    "kicker": "06 — ai journaling",
    "img": "./assets/projects/project-3.jpg",
    "chips": [
      "ai",
      "journaling",
      "wellbeing"
    ],
    "paragraphs": [
      "Rant.AI is an AI-powered journaling application that helps users express their thoughts, feelings, and experiences through intelligent writing assistance. The app provides a safe space for users to \"rant\" about their day, with AI-powered insights and reflection tools to help users understand their emotions and thoughts better."
    ],
    "links": [
      {
        "label": "view on github ↗",
        "href": "https://github.com/gheetdufa/journal_app-1"
      }
    ]
  },
  "tutorwiz": {
    "title": "tutorWiz",
    "kicker": "07 — intelligent tutoring",
    "img": "./assets/projects/tutorWiz.png",
    "chips": [
      "edtech",
      "ai assistance",
      "adaptive learning"
    ],
    "paragraphs": [
      "tutorWiz is an intelligent tutoring platform that connects students with tutors and provides AI-powered learning assistance. The platform offers personalized tutoring sessions, adaptive learning paths, and comprehensive study resources to help students excel in their academic pursuits."
    ],
    "links": [
      {
        "label": "devpost ↗",
        "href": "https://devpost.com/software/tutorwiz"
      },
      {
        "label": "github ↗",
        "href": "https://github.com/suhas-kavuri/WizardTutor"
      }
    ]
  },
  "asktestudo": {
    "title": "askTestudo",
    "kicker": "08 — course registration assistant",
    "img": "./assets/projects/askTestudo.png",
    "chips": [
      "chatbot",
      "hoyahacks",
      "umd"
    ],
    "paragraphs": [
      "askTestudo is an AI-powered assistant designed to help University of Maryland students navigate the Testudo course registration system. Built during HoyaHacks, this intelligent chatbot answers questions about courses, schedules, prerequisites, and registration processes, making it easier for students to plan their academic journey."
    ],
    "links": [
      {
        "label": "asktestudo.co ↗",
        "href": "https://asktestudo.co/"
      },
      {
        "label": "github ↗",
        "href": "https://github.com/gheetdufa/HoyaHacksAskTestudo"
      }
    ]
  }
};
