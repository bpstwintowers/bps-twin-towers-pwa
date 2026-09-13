export interface PoojaDaySchedule {
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  title: string;
  subtitle: string;
  themeColor: string;
  badge: string;
  morningPooja: {
    time: string;
    rituals: string[];
    naivedyam: string;
    dressCode?: string;
  };
  eveningPooja: {
    time: string;
    rituals: string[];
    naivedyam: string;
    culturalHighlight?: string;
  };
  specialHighlight: string;
  sponsorInfo?: string;
}

export interface CommitteeSpoc {
  id: string;
  name: string;
  flatNo: string;
  tower: 'Tower A' | 'Tower B' | 'Central';
  team: string;
  role: string;
  phone: string;
  whatsapp: string;
  responsibilities: string[];
  isLead?: boolean;
  badge?: string;
}

export interface CommitteeTeam {
  id: string;
  name: string;
  icon: string;
  description: string;
  spocs: CommitteeSpoc[];
}

export const POOJA_SCHEDULE_DAYS: PoojaDaySchedule[] = [
  {
    dayNumber: 1,
    date: '14th Sep 2026',
    dayOfWeek: 'Monday',
    title: 'Ganesh Ji Sthapana & Prana Pratishtha',
    subtitle: 'Welcoming Lord Ganesha with Grand Shobha Yatra & Traditional Mangala Vadyam',
    themeColor: '#ea580c',
    badge: 'Day 1 — Sthapana',
    morningPooja: {
      time: '08:30 AM – 11:30 AM',
      rituals: [
        'Grand Shobha Yatra & Welcoming of Idol at Main Gate',
        'Kalasha Sthapana & Ganapathi Avahana',
        'Veda Parayanam & Prana Pratishtha Mahotsavam',
        'Shodashopachara Pooja with 21 Patra (leaves) & Flowers',
        'Maha Mangala Aarti & First Naivedyam offering',
      ],
      naivedyam: 'Panchamrutham, Modak, Kudumulu, Sundal & Fresh Fruits',
      dressCode: 'Traditional Indian Festive Attire (Kurta / Saree / Dhoti)',
    },
    eveningPooja: {
      time: '07:00 PM – 08:30 PM',
      rituals: [
        'Sandhya Deeparadhana & Ganapathi Ashtottara Shatanama Archana',
        'Samuhika Ganesh Atharvashirsha Parayanam',
        'Grand Evening Dhoop & Maha Aarti (with Dhol/Bell Chorus)',
        'Theertha & Prasadam Distribution to all residents',
      ],
      naivedyam: 'Hot Pongal & Dadojanam (Curd Rice)',
      culturalHighlight: 'Kids Welcome Chanting, Ladies Dance & Community Dinner',
    },
    specialHighlight: 'Prana Pratishtha followed by Day 1 Dinner: Pongal & Dadojanam',
    sponsorInfo: 'Daily Flowers & Sthapana Pooja Seva Sponsored by Tower A & B Joint Committee',
  },
  {
    dayNumber: 2,
    date: '15th Sep 2026',
    dayOfWeek: 'Tuesday',
    title: 'Sahasranama Archana & 108 Modak Seva',
    subtitle: 'Special Tuesday Auspicious Ganapathi Homam & Modak Samarpanam',
    themeColor: '#d97706',
    badge: 'Day 2 — Modak Seva',
    morningPooja: {
      time: '07:30 AM – 09:30 AM',
      rituals: [
        'Suprabhata Seva & Nitya Abhishekam (Milk, Curd, Honey, Coconut Water)',
        'Ganesha Sahasranama Archana (1,000 Sacred Names)',
        '108 Modak Maha Naivedya Samarpanam',
        'Morning Mangala Aarti & Theertha Seva',
      ],
      naivedyam: '108 Steamed Ukadiche Modak, Bellam Pongal & Sesame Laddu',
      dressCode: 'Yellow / Orange Traditional Wear',
    },
    eveningPooja: {
      time: '07:00 PM – 08:30 PM',
      rituals: [
        'Sandhya Deeparadhana & Trishati Archana',
        'Devotional Music & Classical Vocal Rendition',
        'Maha Mangala Aarti',
        'Community Dinner Seva',
      ],
      naivedyam: 'Kichidi & Curd Rice',
      culturalHighlight: 'Evening Classical Vocal & Bhajan Sandhya',
    },
    specialHighlight: 'Day 2 Dinner: Kichidi & Curd Rice served from 9:00 PM onwards',
    sponsorInfo: 'Evening Prasadam & Flowers Sponsored by K. Srinivasan Family (A-402)',
  },
  {
    dayNumber: 3,
    date: '16th Sep 2026',
    dayOfWeek: 'Wednesday',
    title: 'Sri Lakshmi Ganapathi Maha Homam',
    subtitle: 'Sacred Homa Kunda Ritual for Obstacle Removal & Prosperity of All Flats',
    themeColor: '#be123c',
    badge: 'Day 3 — Maha Homam',
    morningPooja: {
      time: '07:30 AM – 10:30 AM',
      rituals: [
        'Agni Prathishta & Navagraha Homam',
        'Sri Lakshmi Ganapathi Moola Mantra Homam with 108 Ahutis',
        'Purna Ahuti & Vasordhara (Continuous Ghee Offering)',
        'Holy Bhasma & Theertha Blessings for all Flats',
      ],
      naivedyam: 'Rava Kesari, Butter Modak, Sprouted Moong Sundal',
    },
    eveningPooja: {
      time: '06:45 PM – 09:15 PM',
      rituals: [
        'Grand Sandhya Aarti (07:00 PM sharp)',
        'Classical Bharatanatyam & Kuchipudi performances by Society Children',
        'Group Devotional Singing & Instrumental Fusion by Youth Team',
        'Drama Skit on Lord Ganesha by BPS Little Champs',
        'Distribution of special dinner prasad',
      ],
      naivedyam: 'Hot Sambar Rice & Curd Rice',
      culturalHighlight: 'Grand Cultural Stage Performances & Prize Distribution',
    },
    specialHighlight: 'Day 3 Dinner: Hot Sambar Rice & Curd Rice served from 9:00 PM onwards',
    sponsorInfo: 'Sound, Stage & Cultural Lighting Sponsored by Cultural Committee',
  },
  {
    dayNumber: 4,
    date: '17th Sep 2026',
    dayOfWeek: 'Thursday',
    title: 'Sri Ganapathi Atharvashirsha & Tiffin Night',
    subtitle: 'Sacred 1000-Time Chanting, Family Antakshari & Special Tiffin Dinner',
    themeColor: '#16a34a',
    badge: 'Day 4 — Tiffin Night',
    morningPooja: {
      time: '08:00 AM – 10:00 AM',
      rituals: [
        'Sri Ganapathi Atharvashirsha Sahasra Avartana',
        'Panchamrutha Maha Abhishekam',
        'Swarna Pushpa Archana',
        'Rajadhiraja Mangala Harathi',
      ],
      naivedyam: 'Chakkara Pongal, Pulihora, Payasam & Steamed Modak',
      dressCode: 'Comfortable Traditional Attire',
    },
    eveningPooja: {
      time: '07:00 PM – 08:30 PM',
      rituals: [
        'Evening Sandhya Deepam & Trishati Namavali',
        'Satsang & Akhanda Bhajans by BPS Women’s Mandali',
        'Maha Aarti & Dinner Distribution',
      ],
      naivedyam: 'Hot Idly, Medu Wada, Mysore Bonda with Sambar & Chutney',
      culturalHighlight: 'Society Antakshari & Family Bhajan Jam',
    },
    specialHighlight: 'Day 4 Special Dinner: Hot Idly, Wada, Bonda Feast from 9:00 PM onwards',
    sponsorInfo: 'Jointly contributed by flat owners and Youth Team volunteers',
  },
  {
    dayNumber: 5,
    date: '18th Sep 2026',
    dayOfWeek: 'Friday',
    title: 'Grand Maha Prasadam Community Feast Dinner',
    subtitle: 'Sacred Maha Prasadam Mahayagnam — Free Blessed Feast for All 1000+ Residents & Staff',
    themeColor: '#7c3aed',
    badge: 'Day 5 — Maha Prasadam',
    morningPooja: {
      time: '07:30 AM – 10:30 AM',
      rituals: [
        'Lakshmi Ganapathi Abhishekam & Sri Suktha Parayanam',
        'Maha Prasadam Sankalpam & Sanctification of Community Kitchen',
        'Maha Naivedyam Offering to Lord Ganesha before Feast begins',
        'Morning Aarti & Turmeric-Kumkum Theertham',
      ],
      naivedyam: 'Traditional 14-Item Satvik Feast served for Community Dinner (9:00 PM onwards)',
      dressCode: 'Silk Sarees / Silk Dhotis & Traditional Kurta',
    },
    eveningPooja: {
      time: '06:00 PM – 09:00 PM',
      rituals: [
        'Samuhika Sri Satyanarayana Swamy Vrata Pooja (All Registered Couples)',
        'Katha Shravanam (5 Chapters) & Vratha Prasadam Sanctification',
        '1,008 Clay Lamp Deepotsavam around Mandap & Podium Garden',
        'Maha Mangala Karpoora Harathi & Distribution of Satyanarayana Prasadam',
      ],
      naivedyam: 'Traditional Satyanarayana Rava Prasadam (Sapatha), Panchamrutham',
      culturalHighlight: 'Lighting of 1,008 Diyas creating a Golden Illuminating Mandap',
    },
    specialHighlight: 'Over 60+ families performing Satyanarayana Pooja simultaneously',
    sponsorInfo: 'Deepotsavam Clay Diyas & Oil Sponsored by Tower A & B Senior Citizens Forum',
  },
  {
    dayNumber: 6,
    date: '19th Sep 2026',
    dayOfWeek: 'Saturday',
    title: 'Maha Visarjan — Grand Immersion Shobha Yatra',
    subtitle: 'Bidding Farewell to Bappa with Dhol Tasha, Gulal, Laddu Auction & Eco-Friendly Immersion',
    themeColor: '#dc2626',
    badge: 'Day 6 — Grand Visarjan',
    morningPooja: {
      time: '08:30 AM – 11:30 AM',
      rituals: [
        'Uttara Pooja & Punar-Avahana Rituals by Priest',
        'Final Archana & Kankana Visarjana',
        'Prestigious Maha Laddu Auction (Open to all flat residents)',
        'Maha Prasadam Distribution of Auction Laddus',
      ],
      naivedyam: 'Maha Laddu (15kg & 5kg), Boondi, Dahi Poha & Fruits',
      dressCode: 'Festive White Kurta / Saffron Scarf / Comfortable Walking Shoes',
    },
    eveningPooja: {
      time: '03:00 PM – 07:30 PM',
      rituals: [
        '03:00 PM: Ganapathi Bappa Moriya Departure Ceremony from Mandap',
        '03:30 PM: Grand Shobha Yatra with Live Nasik Dhol, Tasha & Chenda Melam',
        '04:30 PM: Procession through Saidabad main avenue with safe crowd marshals',
        '06:30 PM: Eco-friendly symbolic immersion with Vedic mantras & flowers',
        '07:30 PM: Return to society premises & Theertha Prasadam reception',
      ],
      naivedyam: 'Chilled Buttermilk, Lemonade, Dahi Poha & Prasad Packets for procession',
      culturalHighlight: 'Live Dhol Tasha Troupe, Kolatam Dance & Gulal Utsav',
    },
    specialHighlight: 'Prestigious Society Laddu Auction followed by 3-hour grand music procession',
    sponsorInfo: 'Visarjan Vehicle & Dhol Tasha Troupe coordinated by Youth Logistics Team',
  },
];

export const COMMITTEE_TEAMS: CommitteeTeam[] = [
  {
    id: 'pooja-rituals',
    name: 'Pooja & Priest Coordination Team',
    icon: 'Flame',
    description: 'Directly oversees Panditji schedules, Veda parayanam, daily samagri, homam preparations, and family sankalpam slots.',
    spocs: [
      {
        id: 'spoc-1',
        name: 'R. Sharma',
        flatNo: 'A-704',
        tower: 'Tower A',
        team: 'Pooja & Priest Coordination',
        role: 'Chief Pooja Lead & Priest SPOC',
        phone: '+91 98490 12345',
        whatsapp: '919849012345',
        responsibilities: [
          'Panditji booking, dakshina & daily muhurtham coordination',
          'Vedic ritual samagri procurement & homam pit setup',
          'Family sankalpam slot allocation & gothram coordination',
        ],
        isLead: true,
        badge: 'Team Lead',
      },
      {
        id: 'spoc-2',
        name: 'V. Krishna Murthy',
        flatNo: 'B-302',
        tower: 'Tower B',
        team: 'Pooja & Priest Coordination',
        role: 'Samagri & Morning Abhishekam In-Charge',
        phone: '+91 98490 23456',
        whatsapp: '919849023456',
        responsibilities: [
          'Daily fresh flowers, garlands & 21-patra procurement',
          'Morning milk, curd, honey, panchamrutham supplies',
          'Kumkuma archana & Satyanarayana pooja items',
        ],
        badge: 'Tower B Lead',
      },
    ],
  },
  {
    id: 'prasadam-committee',
    name: 'Maha Prasadam Committee',
    icon: 'HeartHandshake',
    description: 'Manages morning/evening naivedyam, daily modak offerings, catering hygiene, and Day 5 Grand Maha Prasadam feast.',
    spocs: [
      {
        id: 'spoc-3',
        name: 'Suresh Reddy',
        flatNo: 'A-1102',
        tower: 'Tower A',
        team: 'Maha Prasadam',
        role: 'Maha Prasadam & Catering Head',
        phone: '+91 98490 34567',
        whatsapp: '919849034567',
        responsibilities: [
          'Caterer contract, menu selection & food quality monitoring',
          'Day 5 Maha Prasadam seating (800+ residents) and token flow',
          'Community kitchen hygiene & drinking water stations',
        ],
        isLead: true,
        badge: 'Team Lead',
      },
      {
        id: 'spoc-4',
        name: 'Mrs. Lakshmi Narayanan',
        flatNo: 'B-601',
        tower: 'Tower B',
        team: 'Maha Prasadam',
        role: 'Daily Naivedyam & Laddu Coordinator',
        phone: '+91 98490 45678',
        whatsapp: '919849045678',
        responsibilities: [
          'Daily morning & evening hot prasad distribution table',
          '108 Modak Seva coordination (Day 2)',
          'Prasad packaging & queue management for children/seniors',
        ],
        badge: 'Naivedyam SPOC',
      },
    ],
  },
  {
    id: 'cultural-stage',
    name: 'Cultural, Stage & Kids Events Team',
    icon: 'Sparkles',
    description: 'Coordinates stage sound systems, kids talent competitions, classical dance performances, and Day 3 Cultural Night.',
    spocs: [
      {
        id: 'spoc-5',
        name: 'Priyanka Verma',
        flatNo: 'A-405',
        tower: 'Tower A',
        team: 'Cultural, Stage & Kids Events',
        role: 'Cultural Programs Director',
        phone: '+91 98490 56789',
        whatsapp: '919849056789',
        responsibilities: [
          'Kids dance, sloka & skit audition scheduling',
          'Sound system, mics, spotlights & stage anchor coordination',
          'Prize distribution certificates & memento procurement',
        ],
        isLead: true,
        badge: 'Cultural Lead',
      },
      {
        id: 'spoc-6',
        name: 'K. Sridhar',
        flatNo: 'B-1204',
        tower: 'Tower B',
        team: 'Cultural, Stage & Kids Events',
        role: 'Audio-Visual & Bhajans In-Charge',
        phone: '+91 98490 67890',
        whatsapp: '919849067890',
        responsibilities: [
          'Daily evening audio mixer & bhajan soundtrack operation',
          'Stage lighting & podium power backup liaison',
          'Live video streaming link for non-resident owners',
        ],
        badge: 'AV Lead',
      },
    ],
  },
  {
    id: 'mandap-decor',
    name: 'Mandap, Idol & Lighting Team',
    icon: 'Building2',
    description: 'Oversees eco-friendly clay idol installation, marigold floral arches, building fairy lighting, and podium barricading.',
    spocs: [
      {
        id: 'spoc-7',
        name: 'Anand Kulkarni',
        flatNo: 'B-805',
        tower: 'Tower B',
        team: 'Mandap & Decor',
        role: 'Mandap Architecture & Decoration Lead',
        phone: '+91 98490 78901',
        whatsapp: '919849078901',
        responsibilities: [
          'Eco-friendly Clay Ganesha Idol transit and mandap mounting',
          'Daily fresh flower backdrop decoration & rangoli artworks',
          'Tower A & B facade serial lighting & podium LED illumination',
        ],
        isLead: true,
        badge: 'Decor Lead',
      },
      {
        id: 'spoc-8',
        name: 'Mahesh Joshi',
        flatNo: 'A-203',
        tower: 'Tower A',
        team: 'Mandap & Decor',
        role: 'Electricals & Infrastructure SPOC',
        phone: '+91 98490 89012',
        whatsapp: '919849089012',
        responsibilities: [
          'Mandap electrical safety check & dedicated DG line tie-in',
          'Rain canopy waterproof covering over mandap area',
          'Pedestal fans, fire extinguishers & safety barrier setup',
        ],
        badge: 'Infrastructure SPOC',
      },
    ],
  },
  {
    id: 'finance-treasury',
    name: 'Finance, Treasury & Receipts Team',
    icon: 'Award',
    description: 'Manages UPI QR collections, issuing instant receipts, auditing vendor bills, and transparent daily financial reporting.',
    spocs: [
      {
        id: 'spoc-9',
        name: 'K. Venkatesh (Treasurer)',
        flatNo: 'A-901',
        tower: 'Tower A',
        team: 'Finance & Treasury',
        role: 'Society Treasurer & Audit Lead',
        phone: '+91 98490 90123',
        whatsapp: '919849090123',
        responsibilities: [
          'Bank reconciliation & live contribution sheet maintenance',
          'Vendor bill approvals & advance disbursement',
          'Daily financial statement publishing on PWA dashboard',
        ],
        isLead: true,
        badge: 'Treasurer',
      },
      {
        id: 'spoc-10',
        name: 'Rajesh Agarwal',
        flatNo: 'B-502',
        tower: 'Tower B',
        team: 'Finance & Treasury',
        role: 'Receipts & Laddu Auction Auditor',
        phone: '+91 98490 01234',
        whatsapp: '919849001234',
        responsibilities: [
          'Digital & physical receipt generation for flat owners',
          'Day 6 Laddu auction bidding registry & cash register',
          'Expense voucher verification with committee leads',
        ],
        badge: 'Finance SPOC',
      },
    ],
  },
  {
    id: 'visarjan-logistics',
    name: 'Visarjan, Security & Crowd Logistics',
    icon: 'Users',
    description: 'Coordinates Day 6 Grand Immersion procession truck, police permits, traffic safety, dhol tasha band, and crowd marshals.',
    spocs: [
      {
        id: 'spoc-11',
        name: 'Vikram Singh',
        flatNo: 'A-1304',
        tower: 'Tower A',
        team: 'Visarjan & Logistics',
        role: 'Visarjan Procession & Security Chief',
        phone: '+91 98490 11223',
        whatsapp: '919849011223',
        responsibilities: [
          'Visarjan decorated open truck & sound vehicle arrangement',
          'Local police & traffic department permission liaison',
          'Chenda Melam & Nasik Dhol band scheduling',
        ],
        isLead: true,
        badge: 'Logistics Lead',
      },
      {
        id: 'spoc-12',
        name: 'Santosh Goud',
        flatNo: 'B-1003',
        tower: 'Tower B',
        team: 'Visarjan & Logistics',
        role: 'Crowd Safety & Route Marshal',
        phone: '+91 98490 22334',
        whatsapp: '919849022334',
        responsibilities: [
          'Resident procession safety marshals & water distribution along route',
          'Main gate barricade & visitor vehicle parking control',
          'Immersion crane assistance at Saidabad water tank',
        ],
        badge: 'Security SPOC',
      },
    ],
  },
];
