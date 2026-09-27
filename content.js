/*
 * All site content lives here.
 * Regions are areas on the map. Sites are the markers you click inside them.
 * Coordinates are in world units centred on Basecamp at (0, 0):
 * x grows east (right), y grows south (down), z is how high the marker floats.
 *
 * Keep roughly 340 units between two markers on the same row, otherwise their
 * floating cards overlap. Giving neighbours different z values helps too.
 */

const REGIONS = [
    {
        id: 'basecamp',
        nav: 'About me',
        name: 'About me',
        x: 0,
        y: 0,
        r: 420,
        zoom: 0.9,
        rot: -8,
        coast: '62% 38% 55% 45% / 48% 58% 42% 52%',
        blurb: 'Start here.'
    },
    {
        id: 'contact',
        nav: 'Contact',
        name: 'Contact',
        x: 0,
        y: -700,
        r: 420,
        zoom: 0.95,
        rot: -18,
        coast: '70% 30% 45% 55% / 42% 58% 38% 62%',
        blurb: 'Email, and what I want to do next.'
    },
    {
        id: 'projects',
        nav: 'Projects',
        name: 'Projects',
        x: 830,
        y: -140,
        r: 500,
        zoom: 0.95,
        rot: 22,
        coast: '40% 60% 52% 48% / 55% 45% 62% 38%',
        blurb: 'Games, and GitHub.'
    },
    {
        id: 'experience',
        nav: 'Experience',
        name: 'Experience',
        x: 0,
        y: 860,
        r: 860,
        zoom: 0.72,
        rot: 6,
        coast: '58% 42% 48% 52% / 44% 56% 40% 60%',
        blurb: 'Certifications, school, help desk, clubs, and SkillsUSA.'
    },
    {
        id: 'service',
        nav: 'Service',
        name: 'Service',
        x: -1490,
        y: 660,
        r: 620,
        zoom: 0.9,
        rot: -12,
        coast: '52% 48% 65% 35% / 38% 62% 48% 52%',
        blurb: 'Tutoring, the robotics fair, church, and the youth channel.'
    },
    {
        id: 'person',
        nav: 'Beyond code',
        name: 'Beyond code',
        x: 1470,
        y: 800,
        r: 640,
        zoom: 0.9,
        rot: 10,
        coast: '45% 55% 38% 62% / 58% 42% 52% 48%',
        blurb: 'Track, a sprint triathlon, weights, Track Camp, and church.'
    }
];

/* Painted labels that sit flat on the terrain, like text printed on a map. */
const GROUND_LABELS = [
    { text: 'Credentials', x: -520, y: 340, size: 44, region: 'experience' },
    { text: 'Education', x: 10, y: 950, size: 44, region: 'experience' },
    { text: 'Leadership', x: 660, y: 465, size: 44, region: 'experience' },
    { text: 'Competition', x: 230, y: 275, size: 30, region: 'experience' },
    { text: 'North', x: 0, y: -1200, size: 26, region: null }
];

/* Smaller plateaus inside a region that group related markers. */
const PLATEAUS = [
    { x: -520, y: 710, rx: 480, ry: 340, region: 'experience', rot: -6, coast: '56% 44% 48% 52% / 50% 46% 54% 50%' },
    { x: 10, y: 1190, rx: 400, ry: 300, region: 'experience', rot: 12, coast: '48% 52% 60% 40% / 42% 58% 45% 55%' },
    { x: 630, y: 765, rx: 400, ry: 320, region: 'experience', rot: -10, coast: '60% 40% 45% 55% / 55% 45% 50% 50%' },
    { x: 230, y: 400, rx: 200, ry: 160, region: 'experience', rot: 18, coast: '50% 50% 58% 42% / 46% 54% 48% 52%' }
];

/* Trails drawn between regions so the map reads as a connected place. */
const TRAILS = [
    ['basecamp', 'projects'],
    ['basecamp', 'experience'],
    ['basecamp', 'contact'],
    ['service', 'experience'],
    ['experience', 'person'],
    ['person', 'projects']
];

/* Footpaths between sites inside a region — thinner dashed routes to walk. */
const SITE_TRAILS = [
    /* Credentials cluster */
    ['cert-computational-thinking', 'cert-java'],
    ['cert-java', 'cert-javascript'],
    ['cert-javascript', 'cert-html-css'],
    ['cert-html-css', 'workkeys-gold'],
    ['cert-computational-thinking', 'workkeys-gold'],
    /* Education cluster */
    ['lindbergh', 'south-tech'],
    ['south-tech', 'nextgeo'],
    ['lindbergh', 'nextgeo'],
    /* Leadership cluster */
    ['cshs-president', 'robotics'],
    ['robotics', 'ai-ethics'],
    ['cshs-president', 'ai-ethics'],
    /* Cross-plateau links so Experience feels walkable */
    ['workkeys-gold', 'lindbergh'],
    ['lindbergh', 'ai-ethics'],
    ['skillsusa', 'cert-java'],
    ['skillsusa', 'cshs-president'],
    ['south-tech', 'copilot'],
    /* Service */
    ['mentorship', 'tutoring'],
    ['community', 'church-service'],
    ['community', 'youth-channel'],
    ['tutoring', 'youth-channel'],
    /* Track */
    ['running', 'track-camp'],
    ['running', 'training'],
    /* Projects */
    ['interactive-systems', 'game-design'],
    ['game-design', 'github']
];

const SITES = [
    /* ---------------------------------------------------------------- Basecamp */
    {
        id: 'intro',
        region: 'basecamp',
        code: 'YOU',
        kind: 'About me',
        title: 'Kaden Cruts',
        short: 'Lindbergh, class of 2027',
        x: 0,
        y: 0,
        z: 170,
        wide: true,
        image: 'images/meAtProm.jpg',
        meta: ['Saint Louis, Missouri', 'Class of 2027'],
        body: `
            <p>Lindbergh High School, class of 2027. Web and Computer Programming at South Tech,
            and Copilot Student Help Desk at Lindbergh. I build websites and games, program for robotics, tutor, and run track.</p>
        `,
        tags: ['Lindbergh', 'South Tech', 'Class of 2027'],
        action: { label: 'Go to Experience', target: 'experience' }
    },

    /* ------------------------------------------------------- Signal Tower */
    {
        id: 'email',
        region: 'contact',
        code: 'MSG',
        kind: 'Contact',
        title: 'Email',
        short: 'mrkad3n@gmail.com',
        image: 'images/gmail.png',
        x: -180,
        y: -780,
        z: 200,
        meta: ['Contact', 'Email'],
        body: `
            <p>mrkad3n@gmail.com</p>
        `,
        tags: ['Email'],
        link: { label: 'Email Me', href: 'mailto:mrkad3n@gmail.com' }
    },
    {
        id: 'looking-for',
        region: 'contact',
        code: 'NEXT',
        kind: 'Looking for',
        title: 'What I want next',
        short: 'I want to go to College and study computer science+math, and eventually an AI software engineering career. I am looking for an internship or a team that builds software.',
        image: 'images/careerGoal.webp',
        x: 180,
        y: -620,
        z: 110,
        meta: ['Contact', 'Opportunities'],
        body: `
            <p>I want to go to College and study computer science+math, and eventually an AI software engineering career. I am looking for an internship or a team that builds software.</p>
        `,
        tags: ['College', 'Computer science', 'Internships']
    },

    /* --------------------------------------------------------- Projects */
    {
        id: 'interactive-systems',
        region: 'projects',
        code: 'GAME',
        kind: 'Project',
        title: 'A 2D game',
        short: 'Side-view, and it has gotten large',
        x: 1020,
        y: -260,
        z: 95,
        image: 'images/firstGame.png',
        meta: ['Project', 'Game development'],
        body: `
            <p>A classic RPG game with a vast leveling system, map, and gameplay strategies.</p>
        `,
        tags: ['JavaScript', 'Game', '2D']
    },
    {
        id: 'game-design',
        region: 'projects',
        code: 'PLAY',
        kind: 'Project',
        title: 'The game, after class',
        short: 'I redo the parts that do not match',
        x: 830,
        y: 80,
        z: 125,
        image: 'images/magicBattle.png',
        featured: true,
        meta: ['Project', 'Game'],
        body: `
            <p>Side-view fantasy game where the player makes their own spells. Spell options are near limitless and the game is completely open world with a vast amount of quests and bosses.</p>
        `,
        tags: ['2D game', 'After class'],
        link: { label: 'Play the game', href: 'https://magicbattle.netlify.app/index.html' }
    },
    {
        id: 'github',
        region: 'projects',
        code: 'GIT',
        kind: 'Project',
        title: 'GitHub',
        short: 'MrKad3n',
        image: 'images/githubLogo.png',
        x: 640,
        y: -260,
        z: 130,
        featured: true,
        meta: ['Project', 'GitHub'],
        body: `
            <p>Code and projects are under MrKad3n.</p>
        `,
        tags: ['GitHub'],
        link: { label: 'GitHub', href: 'https://github.com/MrKad3n' }
    },

    /* ------------------------------------------------ The Proving Grounds */
    /* Credentials cluster */
    {
        id: 'cert-computational-thinking',
        region: 'experience',
        code: 'CERT',
        kind: 'Certification',
        title: 'IT Specialist — Computational Thinking',
        short: 'Certiport IT Specialist certification',
        image: 'images/computationalThinking.webp',
        x: -760,
        y: 540,
        z: 120,
        meta: ['Certification', 'IT Specialist'],
        body: `
            <p>Certiport IT Specialist certification in Computational Thinking.</p>
        `,
        tags: ['Algorithms', 'Logic']
    },
    {
        id: 'cert-java',
        region: 'experience',
        code: 'CERT',
        kind: 'Certification',
        title: 'IT Specialist — Java',
        short: 'Certiport IT Specialist certification',
        image: 'images/javaLogo.png',
        x: -390,
        y: 505,
        z: 105,
        meta: ['Certification', 'IT Specialist'],
        body: `
            <p>Certiport IT Specialist certification in Java. I use Java for robotics and USACO Competitions.</p>
        `,
        tags: ['Java', 'Robotics']
    },
    {
        id: 'cert-javascript',
        region: 'experience',
        code: 'CERT',
        kind: 'Certification',
        title: 'IT Specialist — JavaScript',
        short: 'Certiport IT Specialist certification',
        image: 'images/javaScriptLogo.png',
        x: -190,
        y: 695,
        z: 155,
        meta: ['Certification', 'IT Specialist'],
        body: `
            <p>Certiport IT Specialist certification in JavaScript.</p>
        `,
        tags: ['JavaScript', 'DOM']
    },
    {
        id: 'cert-html-css',
        region: 'experience',
        code: 'CERT',
        kind: 'Certification',
        title: 'IT Specialist — HTML and CSS',
        short: 'Certiport IT Specialist certification',
        image: 'images/htmlLogo.png',
        image2: 'images/cssLogo.png',
        x: -520,
        y: 810,
        z: 85,
        meta: ['Certification', 'IT Specialist'],
        body: `
            <p>Certiport IT Specialist certification in HTML and CSS.</p>
        `,
        tags: ['HTML', 'CSS', 'Layout']
    },
    {
        id: 'workkeys-gold',
        region: 'experience',
        code: 'GOLD',
        kind: 'Credential',
        title: 'ACT WorkKeys — Gold',
        short: 'National Career Readiness Certificate, Gold level',
        image: 'images/goldWorkKeys.png',
        x: -830,
        y: 920,
        z: 150,
        featured: true,
        meta: ['Credential', 'ACT WorkKeys', 'Gold level'],
        body: `
            <p>ACT WorkKeys Gold. National Career Readiness Certificate.</p>
        `,
        tags: ['Applied math', 'Graphic literacy', 'Workplace documents']
    },

    /* Education cluster */
    {
        id: 'lindbergh',
        region: 'experience',
        code: 'EDU',
        kind: 'Education',
        title: 'Lindbergh High School',
        short: 'Class of 2027',
        image: 'images/LindberghLogo.png',
        x: -120,
        y: 1060,
        z: 125,
        meta: ['Education', 'Class of 2027'],
        body: `
            <p>Lindbergh High School, class of 2027.</p>
        `,
        tags: ['Class of 2027', 'Saint Louis']
    },
    {
        id: 'south-tech',
        region: 'experience',
        code: 'EDU',
        kind: 'Education',
        title: 'South Tech Academy — Web and Computer Programming',
        short: 'Class of 2027',
        image: 'images/southTechClassAtSixFlags.jpg',
        x: 215,
        y: 1210,
        z: 95,
        featured: true,
        meta: ['Education', 'Web & Computer Programming', 'Class of 2027'],
        body: `
            <p>South Tech Academy, Web and Computer Programming, class of 2027. The IT Specialist
            certifications and the SkillsUSA web design entry are from this program.
            
            The photo is my class and I at Six Flags.</p>
        `,
        tags: ['Web', 'Programming', 'Class of 2027']
    },
    {
        id: 'nextgeo',
        region: 'experience',
        code: 'GEO',
        kind: 'Program',
        title: 'NextGeo Summer Academy 2026',
        short: 'Geospatial intelligence',
        image: 'images/arcGIS.png',
        x: -190,
        y: 1320,
        z: 165,
        featured: true,
        meta: ['Program', 'Geospatial intelligence', '2026'],
        body: `
            <p>2026 NextGeo Summer Academy. Geospatial intelligence.</p>
        `,
        tags: ['Geospatial intelligence', 'Maps', '2026']
    },

    /* Leadership cluster */
    {
        id: 'cshs-president',
        region: 'experience',
        code: 'LEAD',
        kind: 'Leadership',
        title: 'President — Computer Science Honor Society',
        short: 'I run the chapter at Lindbergh',
        image: 'images/computerScienceHS.png',
        x: 555,
        y: 575,
        z: 170,
        featured: true,
        meta: ['Leadership', 'President'],
        body: `
            <p>President of the Computer Science Honor Society at Lindbergh.</p>
        `,
        tags: ['President', 'Computer Science']
    },
    {
        id: 'robotics',
        region: 'experience',
        code: 'LEAD',
        kind: 'Leadership',
        title: 'Robotics Club — President & Lead Programmer',
        short: 'Officer, then president, and lead programmer',
        image: 'images/FlybotsLogo.png',
        x: 850,
        y: 820,
        z: 110,
        featured: true,
        meta: ['Leadership', 'Officer → President', 'Lead Programmer'],
        body: `
            <p>Officer, then president, and lead programmer. I programmed our competition robot and
            repaired it when parts failed at a meet.</p>
        `,
        tags: ['Robotics', 'Lead programmer', 'Java']
    },
    {
        id: 'ai-ethics',
        region: 'experience',
        code: 'AI',
        kind: 'Initiative',
        title: 'Student AI Ethical Use Group',
        short: 'Students helping write a class on AI use',
        x: 450,
        y: 955,
        z: 145,
        featured: true,
        meta: ['Initiative', 'AI ethics', 'Curriculum'],
        body: `
            <p>Student group helping build a school course on ethical AI use at Lindbergh High School.</p>
        `,
        tags: ['AI ethics', 'School course']
    },

    /* Competition */
    {
        id: 'skillsusa',
        region: 'experience',
        code: 'AWD',
        kind: 'Award',
        title: 'SkillsUSA District — 3rd Place, Web Design',
        short: '3rd in my district',
        image: 'images/skillsUS.jpg',
        x: 230,
        y: 400,
        z: 195,
        featured: true,
        meta: ['Award', 'SkillsUSA', '3rd place — District'],
        body: `
            <p>3rd place, SkillsUSA district web design.</p>
        `,
        tags: ['SkillsUSA', 'Web design', '3rd place']
    },
    {
        id: 'copilot',
        region: 'experience',
        code: 'DESK',
        kind: 'Course',
        title: 'Copilot Help Desk',
        short: 'Fixing student tech at school',
        image: 'images/copliot.webp',
        x: 480,
        y: 1480,
        z: 140,
        featured: true,
        meta: ['Course', 'Help desk'],
        body: `
            <p>Copilot Help Desk. Chromebooks and other laptops, programming, servers, ticketing, and 3D prints.</p>
        `,
        tags: ['Chromebooks', 'Servers', 'Tickets', '3D printing']
    },

    /* ---------------------------------------------------------- The Commons */
    {
        id: 'mentorship',
        region: 'service',
        code: 'SRV',
        kind: 'Service',
        title: 'Newer members',
        short: 'Honor society and robotics',
        x: -1300,
        y: 280,
        z: 150,
        meta: ['Service', 'Mentorship'],
        body: `
            <p>As the president of CS HS and Robotics I often help newer members with learning programming.</p>
        `,
        tags: ['Honor society', 'Robotics']
    },
    {
        id: 'collaborate',
        region: 'service',
        code: 'WHY',
        kind: 'Service',
        title: 'Robotics fair',
        short: 'April 24, then another on March 27',
        x: -1680,
        y: 660,
        z: 95,
        meta: ['Service', 'Collaboration'],
        body: `
            <p>The robotics fair at Lindbergh High School is an annual event that I designed and promoted. It was to get the robotics club more engaged and help raise funds.</p>
        `,
        tags: ['Robotics fair', 'Outreach', 'Lindbergh']
    },
    {
        id: 'community',
        region: 'service',
        code: 'SRV',
        kind: 'Service',
        title: 'Parish youth group',
        short: 'I go, and I have given talks there',
        x: -1300,
        y: 660,
        z: 180,
        meta: ['Service', 'Community'],
        body: `
            <p>I am apart of Saint Paul's youth group. I go there for weekly meetings, help with the luke 18 retreat and often give talks to my peers.</p>
        `,
        tags: ['Youth group', 'Parish']
    },
    {
        id: 'tutoring',
        region: 'service',
        code: 'TUTR',
        kind: 'Tutoring',
        title: 'Coding tutor',
        short: 'New programmers at Lindbergh and South Tech',
        x: -1680,
        y: 280,
        z: 125,
        featured: true,
        meta: ['Service', 'Tutoring'],
        body: `
            <p>I often get students directed to me by my current/previous teachers to help them with programming projects.</p>
        `,
        tags: ['Tutoring', 'Lindbergh', 'South Tech']
    },
    {
        id: 'church-service',
        region: 'service',
        code: 'MASS',
        kind: 'Parish',
        title: 'At church',
        short: 'Reading, ushering, and the stands',
        image: 'images/myChurch.jpg',
        x: -1680,
        y: 1040,
        z: 165,
        meta: ['Service', 'Parish'],
        body: `
            <p>I proclaim the readings at Mass, usher, and work the stands at parish events.</p>
        `,
        tags: ['Lector', 'Usher', 'Stands']
    },
    {
        id: 'youth-channel',
        region: 'service',
        code: 'TALK',
        kind: 'Channel',
        title: 'Youth channel',
        short: 'Short Catholic talks and interviews',
        x: -1300,
        y: 1040,
        z: 200,
        featured: true,
        meta: ['Service', 'Youth channel'],
        body: `
            <p>A youtube channel I started to share short Catholic talks and interviews with my peers. I upload when I can which could be every month or week</p>
        `,
        tags: ['Catholic talks', 'Interviews']
    },

    /* --------------------------------------------------------- Off the Clock */
    {
        id: 'running',
        region: 'person',
        code: 'RUN',
        kind: 'Beyond code',
        title: 'Track',
        short: '400 and 800',
        x: 1280,
        y: 420,
        z: 160,
        featured: true,
        image: 'images/meRunning\'.jpg',
        meta: ['Beyond code', 'Running'],
        body: `
            <p>I have been running since my freshmen year of highschool. I am varsity for XC and Track. My best PRs are 57.6 in the 400m and 2:10.1 in the 800m.</p>
        `,
        tags: ['400m', '800m', 'Track']
    },
    {
        id: 'track-camp',
        region: 'person',
        code: 'CAMP',
        kind: 'Track',
        title: 'Track Camp',
        short: 'Group nanny, 14 hours a year',
        image: 'images/trackCamp.webp',
        x: 1660,
        y: 420,
        z: 120,
        featured: true,
        meta: ['Track', 'Track Camp'],
        body: `
            <p>I was a group nanny for 7th and 8th grade boys at Lindbergh Track Camp. happens for 4.5 hours a day, 3 days a year in may.</p>
        `,
        tags: ['Track Camp', '7th–8th grade']
    },
    {
        id: 'training',
        region: 'person',
        code: 'TRI',
        kind: 'Training',
        title: 'Sprint triathlon',
        short: '1 hour, and weights 4 days a week',
        x: 1280,
        y: 800,
        z: 150,
        image: 'images/meAfterMyTriathlon.jpg',
        featured: true,
        meta: ['Training', 'Triathlon'],
        body: `
            <p>ontop of running I weight train, bike, and then swim occassionally. Last summer I decided to try a triathlon and did a sprint triathlon sub 1 hour.</p>
        `,
        tags: ['Sprint triathlon', 'Weight training']
    },
    {
        id: 'saint-louis',
        region: 'person',
        code: 'STL',
        kind: 'Beyond code',
        title: 'Saint Louis',
        short: 'School and parish',
        x: 1280,
        y: 1180,
        z: 90,
        image: 'images/family.jpg',
        meta: ['Beyond code', 'Saint Louis'],
        body: `
            <p>Saint Louis. I go to Lindbergh and South Tech.</p>
        `,
        tags: ['Saint Louis', 'Lindbergh', 'Parish']
    },
    {
        id: 'family',
        region: 'person',
        code: 'FAM',
        kind: 'Beyond code',
        title: 'Family',
        short: 'At NHS',
        x: 1660,
        y: 800,
        z: 145,
        image: 'images/familyAtNHS.jpg',
        meta: ['Beyond code', 'Family'],
        body: `
            <p>This is my Grandparents.</p>
        `,
        tags: ['Family', 'NHS']
    },
    {
        id: 'cat',
        region: 'person',
        code: 'CAT',
        kind: 'Beyond code',
        title: 'My cat',
        short: 'At home',
        x: 1660,
        y: 1180,
        z: 110,
        image: 'images/myCat.jpg',
        meta: ['Beyond code'],
        body: `
            <p>This is my cat.</p>
        `,
        tags: ['Cat']
    }
];
