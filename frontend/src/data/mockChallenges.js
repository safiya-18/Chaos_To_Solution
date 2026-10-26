/**
 * Curated mock challenge fixtures across all 8 hackathon themes.
 * Feasible for 3-hour student hackathon teams.
 */

export const THEMES = [
  {
    id: 'EdTech',
    name: 'EdTech',
    shortDesc: 'Learning solutions for a brighter future',
    iconName: 'GraduationCap',
    bgColor: '#FEF3C7',
    iconBg: '#FDE047',
    badgeColor: '#F59E0B',
  },
  {
    id: 'FinTech',
    name: 'FinTech',
    shortDesc: 'Innovative financial solutions',
    iconName: 'Database',
    bgColor: '#F3E8FF',
    iconBg: '#E9D5FF',
    badgeColor: '#A855F7',
  },
  {
    id: 'HealthTech',
    name: 'HealthTech',
    shortDesc: 'Technology for better healthcare',
    iconName: 'HeartPulse',
    bgColor: '#DCFCE7',
    iconBg: '#BBF7D0',
    badgeColor: '#22C55E',
  },
  {
    id: 'Sustainability',
    name: 'Sustainability',
    shortDesc: 'Solutions for a greener tomorrow',
    iconName: 'Leaf',
    bgColor: '#ECFCCB',
    iconBg: '#D9F99D',
    badgeColor: '#84CC16',
  },
  {
    id: 'Smart Cities',
    name: 'Smart Cities',
    shortDesc: 'Smarter, safer, connected cities',
    iconName: 'Building2',
    bgColor: '#E0F2FE',
    iconBg: '#BAE6FD',
    badgeColor: '#0EA5E9',
  },
  {
    id: 'Accessibility',
    name: 'Accessibility',
    shortDesc: 'Technology for everyone',
    iconName: 'Accessibility',
    bgColor: '#FFEDD5',
    iconBg: '#FED7AA',
    badgeColor: '#F97316',
  },
  {
    id: 'E-commerce',
    name: 'E-commerce',
    shortDesc: 'Modern solutions for digital commerce',
    iconName: 'ShoppingCart',
    bgColor: '#FCE7F3',
    iconBg: '#FBCFE8',
    badgeColor: '#EC4899',
  },
  {
    id: 'Open Innovation',
    name: 'Open Innovation',
    shortDesc: 'Solve what matters beyond boundaries',
    iconName: 'Lightbulb',
    bgColor: '#F5F5F4',
    iconBg: '#E7E5E4',
    badgeColor: '#78716C',
  },
];

export const MOCK_CHALLENGES = {
  EdTech: [
    {
      id: 'cts-edtech-01',
      theme: 'EdTech',
      generatedAt: '2026-10-26T14:30:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Distraction-Free Audio Flashcard Sprint',
          statement: 'Engineering students struggle with cognitive overload when revising dense terminology before lab exams while commuting.'
        },
        restriction: {
          name: 'Speech-Only Interaction Mode',
          rule: 'The user must be able to cycle flashcards and record self-evaluations purely using voice commands without touching the screen.'
        },
        resource: {
          name: 'Web Speech API (SpeechRecognition & SpeechSynthesis)',
          type: 'browser-api',
          guidance: 'Leverage the browser native speech recognition for hands-free answer evaluation and voice prompts.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
        },
        deliverable: 'A working prototype that speaks out study flashcard concepts, listens for the student reply, and marks mastery status.'
      }
    },
    {
      id: 'cts-edtech-02',
      theme: 'EdTech',
      generatedAt: '2026-10-26T14:35:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Collaborative Markdown Note Harmonizer',
          statement: 'Study groups taking simultaneous notes during lectures end up with disjointed text fragments with no instant merge strategy.'
        },
        restriction: {
          name: 'No Central Backend Database',
          rule: 'Real-time sync between two browser tabs must happen using peer-to-peer or local broadcast channels only.'
        },
        resource: {
          name: 'BroadcastChannel API',
          type: 'browser-api',
          guidance: 'Use BroadcastChannel to broadcast synchronized keystrokes and diff updates across concurrent browser contexts.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel'
        },
        deliverable: 'A two-pane live markdown note editor that syncs instant edits between multiple open tabs with zero server pings.'
      }
    }
  ],
  FinTech: [
    {
      id: 'cts-fintech-01',
      theme: 'FinTech',
      generatedAt: '2026-10-26T14:40:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Offline-First Campus Peer Splitter',
          statement: 'College roommates frequently split dining hall bills and grocery runs in basement canteens with zero mobile network signal.'
        },
        restriction: {
          name: 'Zero External Server Sync',
          rule: 'All expense ledgers and debt settlement graphs must compute and persist strictly in local browser storage.'
        },
        resource: {
          name: 'IndexedDB API',
          type: 'browser-api',
          guidance: 'Store transaction records and group member balances in IndexedDB with transactional consistency and CSV export.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'
        },
        deliverable: 'A mobile-friendly expense splitting interface showing who owes whom, settling balances in minimum transactions, and working fully offline.'
      }
    },
    {
      id: 'cts-fintech-02',
      theme: 'FinTech',
      generatedAt: '2026-10-26T14:45:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Visual Micro-Budget Guardrail',
          statement: 'Students often exceed monthly pocket money budgets in the first week because numeric banking apps fail to convey cash-burn velocity.'
        },
        restriction: {
          name: 'No Third-Party Charting Libraries',
          rule: 'All visual financial projections and progress gauges must be hand-crafted using raw SVG or HTML5 Canvas.'
        },
        resource: {
          name: 'HTML5 Canvas API',
          type: 'browser-api',
          guidance: 'Render a dynamic speedometer and cash runaway depletion curve directly onto an HTML canvas element.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
        },
        deliverable: 'An interactive daily expense tracker that renders a custom canvas burn-rate gauge warning when spend trajectory exceeds the monthly limit.'
      }
    }
  ],
  HealthTech: [
    {
      id: 'cts-healthtech-01',
      theme: 'HealthTech',
      generatedAt: '2026-10-26T14:50:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Hackathon Desk Posture & Hydration Coach',
          statement: 'Developers during hackathons sit motionless for 6+ hours, leading to severe cervical strain and dehydration headaches.'
        },
        restriction: {
          name: 'Ambient Background Alerts',
          rule: 'Reminders must trigger through system notifications even when the browser tab is minimized or running in the background.'
        },
        resource: {
          name: 'Notifications API & Page Visibility API',
          type: 'browser-api',
          guidance: 'Use document.hidden detection combined with Notification.requestPermission() to notify participants during active sedentary stretches.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API'
        },
        deliverable: 'A smart ergonomic timer that tracks active desk time, detects tab inactivity, and fires micro-stretch & water prompts.'
      }
    },
    {
      id: 'cts-healthtech-02',
      theme: 'HealthTech',
      generatedAt: '2026-10-26T14:55:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Emergency Medical QR Wallet for Campus',
          statement: 'When students faint or injure themselves during sports events, first-responders lose critical minutes discovering allergies or emergency contacts.'
        },
        restriction: {
          name: '100% Cryptographic Local Privacy',
          rule: 'Personal medical data must be encrypted client-side using a user passphrase before being embedded into a printable emergency card.'
        },
        resource: {
          name: 'Web Crypto API',
          type: 'browser-api',
          guidance: 'Use crypto.subtle.encrypt / decrypt to securely package emergency medical tags and generate offline scannable credentials.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API'
        },
        deliverable: 'A client-side emergency card generator that creates an encrypted, offline-renderable emergency health pass.'
      }
    }
  ],
  Sustainability: [
    {
      id: 'cts-sustainability-01',
      theme: 'Sustainability',
      generatedAt: '2026-10-26T15:00:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Campus Canteen Food Waste Auctioneer',
          statement: 'University dining halls discard dozens of kilograms of wholesome prepared meals every evening because leftover quantities cannot be predicted or reserved.'
        },
        restriction: {
          name: 'Countdown Urgency Engine',
          rule: 'All surplus meals must feature a real-time decaying price algorithm that adjusts every 10 minutes prior to kitchen shutdown.'
        },
        resource: {
          name: 'Web Workers API',
          type: 'browser-api',
          guidance: 'Run the price degradation simulation in an isolated Web Worker thread so the main UI stays perfectly responsive.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API'
        },
        deliverable: 'A surplus meal claim board showing decaying prices, batch availability countdowns, and instant student meal reservation tickets.'
      }
    },
    {
      id: 'cts-sustainability-02',
      theme: 'Sustainability',
      generatedAt: '2026-10-26T15:05:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Hostel E-Waste & Component Reclaim Exchange',
          statement: 'Graduating engineering students dispose of working Arduino sensors, motors, and adapters while junior batches purchase brand new duplicates.'
        },
        restriction: {
          name: 'Image Verification Required',
          rule: 'Hardware listings must accept a real camera snapshot of the component pins and generate a hardware condition badge on the fly.'
        },
        resource: {
          name: 'MediaDevices & getUserMedia API',
          type: 'browser-api',
          guidance: 'Capture live hardware snapshots directly from the user webcam or mobile camera to verify physical hardware condition.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia'
        },
        deliverable: 'A hardware bartering portal allowing students to photograph lab components, categorize working conditions, and arrange peer pickups.'
      }
    }
  ],
  'Smart Cities': [
    {
      id: 'cts-smartcities-01',
      theme: 'Smart Cities',
      generatedAt: '2026-10-26T15:10:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Crowdsourced Campus Pothole & Hazard Tracker',
          statement: 'Potholes and broken streetlights on college approach roads remain unaddressed because municipal reporting tools are bureaucratic.'
        },
        restriction: {
          name: 'Strict Geolocation Verification',
          rule: 'Every submitted issue report must tag verifiable GPS latitude and longitude coordinates within the local district boundaries.'
        },
        resource: {
          name: 'Geolocation API',
          type: 'browser-api',
          guidance: 'Use navigator.geolocation.getCurrentPosition() with high accuracy mode to capture exact physical coordinates of reported issues.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API'
        },
        deliverable: 'A responsive incident logger where students pin hazard spots, capture GPS telemetry, and categorize municipal urgency levels.'
      }
    },
    {
      id: 'cts-smartcities-02',
      theme: 'Smart Cities',
      generatedAt: '2026-10-26T15:15:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'SJCIT Shuttle Transit Arrival Countdown',
          statement: 'Hostel students waste 20-30 minutes waiting at campus gates unsure when the next shuttle bus or municipal feeder arrives.'
        },
        restriction: {
          name: 'Zero Polling Bandwidth Budget',
          rule: 'Transit ETA updates must not poll repeatedly; use client-side dead reckoning interpolation between check-in pings.'
        },
        resource: {
          name: 'Performance & requestAnimationFrame API',
          type: 'browser-api',
          guidance: 'Use requestAnimationFrame to create smooth bus vehicle movement along the route map between discrete telemetry checkpoints.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame'
        },
        deliverable: 'A live transit countdown board rendering approaching shuttles with predicted arrival windows and crowdedness indicators.'
      }
    }
  ],
  Accessibility: [
    {
      id: 'cts-accessibility-01',
      theme: 'Accessibility',
      generatedAt: '2026-10-26T15:20:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Dyslexia & Sensory Adaptive Exam Reader',
          statement: 'Neurodivergent students struggle with standard university circulars formatted in cramped, low-contrast serif typography.'
        },
        restriction: {
          name: 'WCAG AAA Strict Contrast Compliance',
          rule: 'Every selectable color theme and typographic scale must enforce an 7:1 contrast ratio and support full keyboard tab navigation.'
        },
        resource: {
          name: 'Web Speech API & CSS System Font Scaling',
          type: 'browser-api',
          guidance: 'Combine SpeechSynthesisUtterance for read-aloud functionality with dynamic CSS custom property text-transform filters.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis'
        },
        deliverable: 'A document reader with customizable bionic reading modes, speech synthesis read-along highlights, and keyboard-only shortcuts.'
      }
    },
    {
      id: 'cts-accessibility-02',
      theme: 'Accessibility',
      generatedAt: '2026-10-26T15:25:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Haptic & Audio Sensory Navigation Beacon',
          statement: 'Visually impaired attendees at college tech fests cannot navigate unfamiliar multi-floor seminar complexes.'
        },
        restriction: {
          name: 'Non-Visual Feedback Only',
          rule: 'The navigation guidance mode must operate using audio tones and mobile vibration pulses without requiring the user to look at the screen.'
        },
        resource: {
          name: 'Vibration API & Web Audio API',
          type: 'browser-api',
          guidance: 'Use navigator.vibrate() rhythm patterns and AudioContext oscillators to indicate turns, proximity warnings, and goal arrival.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API'
        },
        deliverable: 'A virtual guidance aid that produces distinct vibration and audio frequency cues as a user moves closer to simulated target checkpoints.'
      }
    }
  ],
  'E-commerce': [
    {
      id: 'cts-ecommerce-01',
      theme: 'E-commerce',
      generatedAt: '2026-10-26T15:30:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Sub-Second Checkout Flow for Flash Sales',
          statement: 'Event merchandise and concert ticket checkouts fail because convoluted multi-step checkout forms drop orders during high concurrency.'
        },
        restriction: {
          name: 'Single-Screen Instant Purchase',
          rule: 'The entire ordering experience from item review to verified receipt must execute on a single screen without page reloads.'
        },
        resource: {
          name: 'Payment Request API',
          type: 'browser-api',
          guidance: 'Use the standard browser Payment Request API to simplify checkout credential collection in a unified modal.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API'
        },
        deliverable: 'A streamlined single-item checkout application validating inventory reservation, capturing order info, and issuing a digital claim token.'
      }
    },
    {
      id: 'cts-ecommerce-02',
      theme: 'E-commerce',
      generatedAt: '2026-10-26T15:35:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Fair Price Comparison for Campus Essentials',
          statement: 'Students overpay for engineering calculators, lab coats, and draft boards because local campus stationery stores have no price transparency.'
        },
        restriction: {
          name: 'Offline Barcode Scanning',
          rule: 'Product lookups must support camera barcode detection directly in the browser without sending captured images to a cloud OCR server.'
        },
        resource: {
          name: 'Barcode Detection API (Shape Detection)',
          type: 'browser-api',
          guidance: 'Utilize the BarcodeDetector interface to scan ISBN or product barcodes directly from video frames.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector'
        },
        deliverable: 'A live barcode price scanner comparing local store prices against student co-op rates with savings breakdown.'
      }
    }
  ],
  'Open Innovation': [
    {
      id: 'cts-openinnovation-01',
      theme: 'Open Innovation',
      generatedAt: '2026-10-26T15:40:00.000Z',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Hackathon Team Role Matcher & Skill Radar',
          statement: 'Solo participants at hackathons struggle to find teammates with complementary skill sets (e.g., frontend vs ML vs pitch deck design).'
        },
        restriction: {
          name: 'No Central Identity Server',
          rule: 'Participant skill profiles must be exportable as cryptographic JSON keys for direct peer verification.'
        },
        resource: {
          name: 'Clipboard API & Drag and Drop API',
          type: 'browser-api',
          guidance: 'Implement drag-and-drop team composition with navigator.clipboard.writeText for seamless invite code exchanges.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
        },
        deliverable: 'An interactive squad builder where students drop roles into team slots, calculate skill balance scores, and generate team invite links.'
      }
    },
    {
      id: 'cts-openinnovation-02',
      theme: 'Open Innovation',
      generatedAt: '2026-10-26T15:45:00.000Z',
      source: 'curated-fallback',
      challenge: {
        problem: {
          title: 'Open Science Data Visualizer & Filter Sandbox',
          statement: 'Undergraduate researchers lack accessible tools to quickly explore open government and environmental CSV datasets without writing Python notebooks.'
        },
        restriction: {
          name: 'Instant Client-Side Parsing',
          rule: 'Files up to 10MB must be ingested and visualized entirely within client RAM with zero server upload.'
        },
        resource: {
          name: 'File System Access API & Streams API',
          type: 'browser-api',
          guidance: 'Read local files using the modern File System Access API and stream chunks through TextDecoder for immediate table rendering.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/File_System_API'
        },
        deliverable: 'A client-side dataset explorer that loads local CSV files, auto-detects numerical columns, and renders summary stats.'
      }
    }
  ]
};
