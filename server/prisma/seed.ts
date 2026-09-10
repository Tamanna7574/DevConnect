import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// List of demo emails to safely isolate and refresh without touching real users (e.g. tamanna)
const DEMO_EMAILS = [
  'demo.alexmorgan@devconnect.local',
  'demo.mayachen@devconnect.local',
  'demo.arjunmehta@devconnect.local',
  'demo.sofiawilliams@devconnect.local',
  'demo.danielkim@devconnect.local',
  'demo.priyashah@devconnect.local',
  'demo.ethanbrown@devconnect.local',
  'demo.noorkhan@devconnect.local',
  'demo.carlosrodriguez@devconnect.local',
  'demo.ananyasharma@devconnect.local',
  // Old seed emails from previous runs to clean up
  'sarah.dev@example.com',
  'alex.rivera@example.com',
  'elena.rostova@example.com',
  'david.chen@example.com',
  'maya.patel@example.com',
  'marcus.vance@example.com',
];

async function main() {
  console.log('Seeding DevConnect database with realistic community content and open-source showcases...');

  // 1. SAFELY CHECK OR CLEAN EXISTING DEMO RECORDS ONLY (NEVER TOUCH REAL USERS)
  const existingDemoUsers = await prisma.user.findMany({
    where: {
      email: { in: DEMO_EMAILS },
    },
    select: { id: true, email: true },
  });

  if (existingDemoUsers.length >= 10 && process.env.FORCE_SEED !== 'true') {
    console.log(`Demo dataset already present in database (${existingDemoUsers.length} accounts). Skipping duplicate seed.`);
    return;
  }

  const demoUserIds = existingDemoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    console.log(`Cleaning previous demo records for ${demoUserIds.length} demo accounts (preserving real users)...`);
    await prisma.notification.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.endorsement.deleteMany({
      where: {
        OR: [
          { endorserId: { in: demoUserIds } },
          { userSkill: { userId: { in: demoUserIds } } },
        ],
      },
    });
    await prisma.connection.deleteMany({
      where: {
        OR: [
          { requesterId: { in: demoUserIds } },
          { receiverId: { in: demoUserIds } },
        ],
      },
    });
    await prisma.userSkill.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.project.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.blogPost.deleteMany({
      where: { authorId: { in: demoUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('DemoPassword123!', salt);

  // 2. SEED REFERENCE SKILLS
  const skillDefinitions = [
    { name: 'React', category: 'FRONTEND' },
    { name: 'TypeScript', category: 'FRONTEND' },
    { name: 'Tailwind CSS', category: 'FRONTEND' },
    { name: 'Next.js', category: 'FRONTEND' },
    { name: 'Vite', category: 'FRONTEND' },
    { name: 'Node.js', category: 'BACKEND' },
    { name: 'Express', category: 'BACKEND' },
    { name: 'FastAPI', category: 'BACKEND' },
    { name: 'Python', category: 'BACKEND' },
    { name: 'Go', category: 'BACKEND' },
    { name: 'Rust', category: 'BACKEND' },
    { name: 'PostgreSQL', category: 'DATABASE' },
    { name: 'Redis', category: 'DATABASE' },
    { name: 'Prisma ORM', category: 'DATABASE' },
    { name: 'Docker', category: 'DEVOPS' },
    { name: 'Kubernetes', category: 'DEVOPS' },
    { name: 'CI/CD', category: 'DEVOPS' },
    { name: 'Linux', category: 'DEVOPS' },
    { name: 'Machine Learning', category: 'AI' },
    { name: 'PyTorch', category: 'AI' },
    { name: 'Pandas', category: 'DATA' },
    { name: 'Data Visualization', category: 'FRONTEND' },
    { name: 'Accessibility', category: 'FRONTEND' },
    { name: 'Security', category: 'BACKEND' },
  ];

  const skillsMap: Record<string, any> = {};
  for (const skill of skillDefinitions) {
    const record = await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
    skillsMap[skill.name] = record;
  }

  // 3. SEED 10 DIVERSE DEMO PROFILES (CLEARLY IDENTIFIED FICTIONAL IDENTITIES, NO REAL PHOTOS)
  const demoUsersData = [
    {
      email: 'demo.alexmorgan@devconnect.local',
      username: 'alexmorgan',
      name: 'Alex Morgan — Demo Developer',
      bio: 'Frontend Engineer & Design Systems Specialist. Building accessible component architectures, robust design tokens, and high-performance web applications with React and TypeScript.',
      location: 'Bengaluru, India',
      portfolioUrl: 'https://ui.shadcn.com',
      avatarUrl: null, // Renders high-contrast initial badge
    },
    {
      email: 'demo.mayachen@devconnect.local',
      username: 'mayachen',
      name: 'Maya Chen — Demo Developer',
      bio: 'Full-Stack Architect & Cloud Native Developer. Passionate about event-driven architectures, microservices in Node.js/Go, and zero-downtime PostgreSQL migrations.',
      location: 'Ahmedabad, India',
      portfolioUrl: 'https://prisma.io',
      avatarUrl: null,
    },
    {
      email: 'demo.arjunmehta@devconnect.local',
      username: 'arjunmehta',
      name: 'Arjun Mehta — Demo Developer',
      bio: 'Backend & Distributed Systems Engineer. Experienced in high-throughput API design, cache optimization, and database connection reliability with Express and PostgreSQL.',
      location: 'Pune, India',
      portfolioUrl: 'https://github.com/BurntSushi/ripgrep',
      avatarUrl: null,
    },
    {
      email: 'demo.sofiawilliams@devconnect.local',
      username: 'sofiawilliams',
      name: 'Sofia Williams — Demo Developer',
      bio: 'Frontend Specialist & Accessibility Advocate. Crafting responsive UI patterns, WCAG 2.1 AA compliant design systems, and fluid micro-interactions with Tailwind and React.',
      location: 'London, UK',
      portfolioUrl: 'https://tanstack.com/query',
      avatarUrl: null,
    },
    {
      email: 'demo.danielkim@devconnect.local',
      username: 'danielkim',
      name: 'Daniel Kim — Demo Developer',
      bio: 'AI Engineering & Applied Machine Learning. Integrating LLM pipelines, vector databases, and semantic retrieval systems with Python and FastAPI.',
      location: 'Toronto, Canada',
      portfolioUrl: 'https://fastapi.tiangolo.com',
      avatarUrl: null,
    },
    {
      email: 'demo.priyashah@devconnect.local',
      username: 'priyashah',
      name: 'Priya Shah — Demo Developer',
      bio: 'Data Engineer & Pipeline Developer. Building robust ETL/ELT pipelines, streaming transformations, and analytical data models using Python, PostgreSQL, and Pandas.',
      location: 'Hyderabad, India',
      portfolioUrl: 'https://scikit-learn.org',
      avatarUrl: null,
    },
    {
      email: 'demo.ethanbrown@devconnect.local',
      username: 'ethanbrown',
      name: 'Ethan Brown — Demo Developer',
      bio: 'DevOps & Infrastructure Engineer. Automating CI/CD pipelines, container orchestration with Kubernetes, and telemetry monitoring with Grafana and Prometheus.',
      location: 'Berlin, Germany',
      portfolioUrl: 'https://charm.sh',
      avatarUrl: null,
    },
    {
      email: 'demo.noorkhan@devconnect.local',
      username: 'noorkhan',
      name: 'Noor Khan — Demo Developer',
      bio: 'Full-Stack Developer & Technical Writer. Building modern web apps with Next.js, exploring developer experience tooling, and documenting software architecture best practices.',
      location: 'Mumbai, India',
      portfolioUrl: 'https://trpc.io',
      avatarUrl: null,
    },
    {
      email: 'demo.carlosrodriguez@devconnect.local',
      username: 'carlosrodriguez',
      name: 'Carlos Rodriguez — Demo Developer',
      bio: 'Platform Security & API Reliability Specialist. Hardening web authentication protocols, session security, rate limiting, and zero-trust services.',
      location: 'Singapore',
      portfolioUrl: 'https://zod.dev',
      avatarUrl: null,
    },
    {
      email: 'demo.ananyasharma@devconnect.local',
      username: 'ananyasharma',
      name: 'Ananya Sharma — Demo Developer',
      bio: 'Data Visualization & Frontend Performance Specialist. Designing real-time data dashboards, Canvas/SVG chart libraries, and optimized React query boundaries.',
      location: 'Delhi, India',
      portfolioUrl: 'https://recharts.org',
      avatarUrl: null,
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of demoUsersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        passwordHash,
      },
    });
    createdUsers[u.username] = user;
  }

  // 4. ATTACH SKILLS TO DEMO DEVELOPERS
  const userSkillsMap: Record<string, any> = {};

  const userSkillAssignments = [
    // Alex Morgan
    { username: 'alexmorgan', skill: 'React', years: 6 },
    { username: 'alexmorgan', skill: 'TypeScript', years: 5 },
    { username: 'alexmorgan', skill: 'Tailwind CSS', years: 4 },
    { username: 'alexmorgan', skill: 'Next.js', years: 3 },
    { username: 'alexmorgan', skill: 'Vite', years: 3 },

    // Maya Chen
    { username: 'mayachen', skill: 'Node.js', years: 6 },
    { username: 'mayachen', skill: 'PostgreSQL', years: 5 },
    { username: 'mayachen', skill: 'TypeScript', years: 5 },
    { username: 'mayachen', skill: 'Docker', years: 4 },
    { username: 'mayachen', skill: 'Redis', years: 3 },

    // Arjun Mehta
    { username: 'arjunmehta', skill: 'Node.js', years: 5 },
    { username: 'arjunmehta', skill: 'PostgreSQL', years: 4 },
    { username: 'arjunmehta', skill: 'Redis', years: 3 },
    { username: 'arjunmehta', skill: 'Docker', years: 3 },
    { username: 'arjunmehta', skill: 'Security', years: 3 },

    // Sofia Williams
    { username: 'sofiawilliams', skill: 'React', years: 5 },
    { username: 'sofiawilliams', skill: 'TypeScript', years: 4 },
    { username: 'sofiawilliams', skill: 'Tailwind CSS', years: 5 },
    { username: 'sofiawilliams', skill: 'Accessibility', years: 4 },

    // Daniel Kim
    { username: 'danielkim', skill: 'Python', years: 6 },
    { username: 'danielkim', skill: 'FastAPI', years: 4 },
    { username: 'danielkim', skill: 'Machine Learning', years: 4 },
    { username: 'danielkim', skill: 'PyTorch', years: 3 },

    // Priya Shah
    { username: 'priyashah', skill: 'Python', years: 5 },
    { username: 'priyashah', skill: 'PostgreSQL', years: 5 },
    { username: 'priyashah', skill: 'Pandas', years: 4 },
    { username: 'priyashah', skill: 'Docker', years: 3 },

    // Ethan Brown
    { username: 'ethanbrown', skill: 'Docker', years: 5 },
    { username: 'ethanbrown', skill: 'Kubernetes', years: 4 },
    { username: 'ethanbrown', skill: 'Linux', years: 6 },
    { username: 'ethanbrown', skill: 'CI/CD', years: 4 },
    { username: 'ethanbrown', skill: 'Go', years: 3 },

    // Noor Khan
    { username: 'noorkhan', skill: 'TypeScript', years: 4 },
    { username: 'noorkhan', skill: 'React', years: 4 },
    { username: 'noorkhan', skill: 'Next.js', years: 3 },
    { username: 'noorkhan', skill: 'Node.js', years: 3 },

    // Carlos Rodriguez
    { username: 'carlosrodriguez', skill: 'Node.js', years: 5 },
    { username: 'carlosrodriguez', skill: 'Security', years: 4 },
    { username: 'carlosrodriguez', skill: 'PostgreSQL', years: 4 },
    { username: 'carlosrodriguez', skill: 'Docker', years: 3 },

    // Ananya Sharma
    { username: 'ananyasharma', skill: 'React', years: 5 },
    { username: 'ananyasharma', skill: 'TypeScript', years: 4 },
    { username: 'ananyasharma', skill: 'Data Visualization', years: 4 },
    { username: 'ananyasharma', skill: 'Tailwind CSS', years: 4 },
  ];

  for (const assign of userSkillAssignments) {
    const user = createdUsers[assign.username];
    const skill = skillsMap[assign.skill];
    if (user && skill) {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          yearsOfExperience: assign.years,
        },
      });
      userSkillsMap[`${assign.username}_${assign.skill}`] = userSkill;
    }
  }

  // 5. SEED REALISTIC NETWORK CONNECTIONS BETWEEN DEMO PROFILES
  const connectionsData = [
    { req: 'alexmorgan', rec: 'mayachen', status: 'ACCEPTED' },
    { req: 'alexmorgan', rec: 'sofiawilliams', status: 'ACCEPTED' },
    { req: 'alexmorgan', rec: 'arjunmehta', status: 'ACCEPTED' },
    { req: 'mayachen', rec: 'danielkim', status: 'ACCEPTED' },
    { req: 'mayachen', rec: 'arjunmehta', status: 'ACCEPTED' },
    { req: 'danielkim', rec: 'priyashah', status: 'ACCEPTED' },
    { req: 'sofiawilliams', rec: 'ananyasharma', status: 'ACCEPTED' },
    { req: 'ethanbrown', rec: 'mayachen', status: 'ACCEPTED' },
    { req: 'carlosrodriguez', rec: 'arjunmehta', status: 'ACCEPTED' },
    { req: 'noorkhan', rec: 'alexmorgan', status: 'ACCEPTED' },
    // Pending requests
    { req: 'noorkhan', rec: 'sofiawilliams', status: 'PENDING' },
    { req: 'ethanbrown', rec: 'danielkim', status: 'PENDING' },
  ];

  for (const conn of connectionsData) {
    const requester = createdUsers[conn.req];
    const receiver = createdUsers[conn.rec];
    if (requester && receiver) {
      await prisma.connection.create({
        data: {
          requesterId: requester.id,
          receiverId: receiver.id,
          status: conn.status,
        },
      });
    }
  }

  // 6. SEED GENUINE ENDORSEMENTS BETWEEN CONNECTED USERS (NO FAKE HARDCODED COUNTERS)
  const endorsementsData = [
    // Alex Morgan's skills endorsed by connected peers
    { userSkillKey: 'alexmorgan_React', endorser: 'mayachen' },
    { userSkillKey: 'alexmorgan_React', endorser: 'sofiawilliams' },
    { userSkillKey: 'alexmorgan_React', endorser: 'arjunmehta' },
    { userSkillKey: 'alexmorgan_TypeScript', endorser: 'mayachen' },
    { userSkillKey: 'alexmorgan_TypeScript', endorser: 'sofiawilliams' },

    // Maya Chen's skills endorsed
    { userSkillKey: 'mayachen_PostgreSQL', endorser: 'alexmorgan' },
    { userSkillKey: 'mayachen_PostgreSQL', endorser: 'arjunmehta' },
    { userSkillKey: 'mayachen_PostgreSQL', endorser: 'ethanbrown' },
    { userSkillKey: 'mayachen_Node.js', endorser: 'alexmorgan' },
    { userSkillKey: 'mayachen_Node.js', endorser: 'arjunmehta' },

    // Daniel Kim's skills endorsed
    { userSkillKey: 'danielkim_Python', endorser: 'mayachen' },
    { userSkillKey: 'danielkim_Python', endorser: 'priyashah' },

    // Sofia Williams's skills endorsed
    { userSkillKey: 'sofiawilliams_React', endorser: 'alexmorgan' },
    { userSkillKey: 'sofiawilliams_React', endorser: 'ananyasharma' },

    // Arjun Mehta's skills endorsed
    { userSkillKey: 'arjunmehta_PostgreSQL', endorser: 'mayachen' },
    { userSkillKey: 'arjunmehta_PostgreSQL', endorser: 'carlosrodriguez' },

    // Priya Shah's skill endorsed
    { userSkillKey: 'priyashah_PostgreSQL', endorser: 'danielkim' },
  ];

  for (const end of endorsementsData) {
    const userSkill = userSkillsMap[end.userSkillKey];
    const endorser = createdUsers[end.endorser];
    if (userSkill && endorser) {
      await prisma.endorsement.create({
        data: {
          userSkillId: userSkill.id,
          endorserId: endorser.id,
        },
      });
    }
  }

  // 7. SEED 12 REAL-WORLD PUBLIC OPEN-SOURCE PROJECTS (COMMUNITY SHOWCASES)
  // Each project represents an actual, publicly maintained open-source project with real repo & metadata.
  const projectsData = [
    {
      username: 'alexmorgan',
      title: 'Shadcn UI Component Architecture',
      description: 'Beautifully designed, accessible components that you can copy and paste into your apps. Built on Radix UI primitives and Tailwind CSS with first-class customization.',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
      githubUrl: 'https://github.com/shadcn-ui/ui',
      liveDemoUrl: 'https://ui.shadcn.com',
      imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'danielkim',
      title: 'FastAPI High-Performance Web Framework',
      description: 'Modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. Features automatic interactive Swagger documentation and async IO.',
      techStack: ['Python', 'FastAPI', 'Pydantic', 'Starlette'],
      githubUrl: 'https://github.com/fastapi/fastapi',
      liveDemoUrl: 'https://fastapi.tiangolo.com',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'mayachen',
      title: 'Prisma Next-Generation Node.js ORM',
      description: 'Next-generation ORM for Node.js and TypeScript. Features declarative modeling, automated type-safe migrations, and an intuitive query engine built in Rust.',
      techStack: ['TypeScript', 'PostgreSQL', 'Node.js', 'Rust'],
      githubUrl: 'https://github.com/prisma/prisma',
      liveDemoUrl: 'https://www.prisma.io',
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'alexmorgan',
      title: 'Vite Next-Generation Frontend Tooling',
      description: 'Blazing fast frontend build tool powering modern web development. Features instant native ESM dev server, lightning-quick HMR, and highly optimized Rollup bundling.',
      techStack: ['TypeScript', 'JavaScript', 'Rollup', 'esbuild'],
      githubUrl: 'https://github.com/vitejs/vite',
      liveDemoUrl: 'https://vitejs.dev',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'danielkim',
      title: 'LangChain LLM Application Framework',
      description: 'Production framework for developing context-aware applications powered by large language models. Simplifies retrieval-augmented generation (RAG) and tool chaining.',
      techStack: ['Python', 'FastAPI', 'Machine Learning', 'PyTorch'],
      githubUrl: 'https://github.com/langchain-ai/langchain',
      liveDemoUrl: 'https://python.langchain.com',
      imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'noorkhan',
      title: 'tRPC End-to-End Typesafe APIs',
      description: 'Build end-to-end typesafe APIs without GraphQL schemas or code generation. Guarantees compile-time synchronization between server endpoints and client callers.',
      techStack: ['TypeScript', 'React', 'Node.js', 'Vite'],
      githubUrl: 'https://github.com/trpc/trpc',
      liveDemoUrl: 'https://trpc.io',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'priyashah',
      title: 'Scikit-Learn Machine Learning in Python',
      description: 'Simple and efficient tools for predictive data analysis and statistical modeling in Python. Built on NumPy, SciPy, and Matplotlib for open reproducible science.',
      techStack: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
      githubUrl: 'https://github.com/scikit-learn/scikit-learn',
      liveDemoUrl: 'https://scikit-learn.org',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'ethanbrown',
      title: 'Bubble Tea Terminal Framework',
      description: 'A fun, functional, and stateful framework for building rich interactive terminal UI applications in Go, based on The Elm Architecture paradigms.',
      techStack: ['Go', 'Linux', 'Docker', 'CI/CD'],
      githubUrl: 'https://github.com/charmbracelet/bubbletea',
      liveDemoUrl: 'https://charm.sh',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'ananyasharma',
      title: 'Recharts Composable React Chart Library',
      description: 'Redefined chart library built with React and D3 SVG primitives. Provides composable chart components, responsive layout containers, and lightweight bundle impact.',
      techStack: ['React', 'TypeScript', 'Data Visualization', 'Tailwind CSS'],
      githubUrl: 'https://github.com/recharts/recharts',
      liveDemoUrl: 'https://recharts.org',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'arjunmehta',
      title: 'Ripgrep High-Performance Search Utility',
      description: 'Line-oriented search tool that recursively searches the current directory for regex patterns. Engineered in Rust for unmatched speed and intelligent gitignore filtering.',
      techStack: ['Rust', 'Linux', 'Security', 'Docker'],
      githubUrl: 'https://github.com/BurntSushi/ripgrep',
      liveDemoUrl: null,
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'sofiawilliams',
      title: 'TanStack Query State Management',
      description: 'Powerful asynchronous server state management for TypeScript and React. Handles caching, background refetching, deduping, and stale-while-revalidate synchronization.',
      techStack: ['TypeScript', 'React', 'Frontend', 'Vite'],
      githubUrl: 'https://github.com/TanStack/query',
      liveDemoUrl: 'https://tanstack.com/query',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    },
    {
      username: 'carlosrodriguez',
      title: 'Zod TypeScript Schema Validation',
      description: 'TypeScript-first schema declaration and data validation library with static type inference. Eliminates duplicate type contracts and validates runtime boundaries.',
      techStack: ['TypeScript', 'Node.js', 'Security', 'Express'],
      githubUrl: 'https://github.com/colinhacks/zod',
      liveDemoUrl: 'https://zod.dev',
      imageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80',
    },
  ];

  for (const proj of projectsData) {
    const user = createdUsers[proj.username];
    if (user) {
      await prisma.project.create({
        data: {
          userId: user.id,
          title: proj.title,
          description: proj.description,
          techStack: proj.techStack,
          githubUrl: proj.githubUrl,
          liveDemoUrl: proj.liveDemoUrl,
          imageUrl: proj.imageUrl,
        },
      });
    }
  }

  // 8. SEED 10 ORIGINAL TECHNICAL PUBLICATIONS (STAGGERED DATES & PRACTICAL ENGINEERING TOPICS)
  const publicationsData = [
    {
      username: 'mayachen',
      title: 'PostgreSQL Indexing: What Actually Matters at Scale',
      slug: 'postgresql-indexing-what-actually-matters-at-scale',
      content: `# PostgreSQL Indexing: What Actually Matters at Scale

When a database table scales past ten million rows, query plans can shift unexpectedly from index scans to expensive sequential table scans.

## 1. B-Tree vs. BRIN for Append-Only Series

For event ledgers, audit trails, or timestamped series, standard B-Trees incur heavy write amplification and memory pressure. **BRIN (Block Range Index)** indexes cost a tiny fraction of RAM:

\`\`\`sql
-- Standard B-Tree: ~220MB for 10M rows
CREATE INDEX idx_events_timestamp ON events (created_at);

-- BRIN Index: ~64KB for 10M rows with near-zero write latency penalty
CREATE INDEX idx_events_created_brin ON events USING brin (created_at);
\`\`\`

## 2. Partial Indexes for Filtered Queries

If 95% of your records reside in an \`ARCHIVED\` or \`PROCESSED\` status, indexing the entire column is wasteful:

\`\`\`sql
CREATE INDEX idx_unprocessed_jobs 
ON background_jobs (priority, created_at) 
WHERE status = 'PENDING';
\`\`\`

## Key Takeaways
- Use \`EXPLAIN (ANALYZE, BUFFERS)\` instead of plain \`EXPLAIN\` to inspect memory buffer hits.
- Index covering with \`INCLUDE\` avoids secondary table page lookups for high-frequency reads.
- Re-index concurrently during low-traffic maintenance windows to eliminate index bloat.`,
      excerpt: 'A practical, benchmarked guide to B-Trees, BRIN indexes, partial indexes, and preventing index bloat on high-throughput PostgreSQL databases.',
      tags: ['Database', 'PostgreSQL', 'Performance', 'Backend'],
      coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
    {
      username: 'alexmorgan',
      title: 'Designing Reusable React Components Without Overengineering',
      slug: 'designing-reusable-react-components-without-overengineering',
      content: `# Designing Reusable React Components Without Overengineering

Creating clean UI component libraries requires balancing flexibility with readability. Over-parameterizing props leads to unmaintainable boolean flags.

## 1. Favor Compound Components Over Monolithic Prop Trees

Instead of a single \`<Modal isOpen={true} showFooter={true} footerButtonText="Save" />\`, compose atomic pieces:

\`\`\`tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Project Deletion</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
\`\`\`

## 2. Headless State Hooks for Custom Views

Separate layout styling from keyboard navigation and focus management:
- Use Radix UI primitives for ARIA attributes and focus traps.
- Keep Tailwind CSS classes close to visual layout elements.
- Expose raw ref forwarders for smooth animations.`,
      excerpt: 'How compound component patterns and headless UI primitives prevent prop explosion in enterprise React applications.',
      tags: ['React', 'TypeScript', 'Frontend', 'Design Systems'],
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      username: 'danielkim',
      title: 'From Notebook to API: Shipping a Machine Learning Model with FastAPI',
      slug: 'from-notebook-to-api-shipping-ml-model-fastapi',
      content: `# From Notebook to API: Shipping a Machine Learning Model with FastAPI

Jupyter notebooks are great for exploratory data analysis, but deploying models into production requires robust input validation, async worker decoupling, and health check probes.

## 1. Pydantic v2 Serialization for Clean Payloads

\`\`\`python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib

app = FastAPI(title="Vector Scoring Inference Engine")
model = joblib.load("models/classifier_v2.pkl")

class InferenceRequest(BaseModel):
    features: list[float] = Field(..., min_items=10, max_items=10)
    temperature: float = Field(0.7, ge=0.0, le=1.0)

@app.post("/predict")
async def predict(payload: InferenceRequest):
    try:
        prediction = model.predict([payload.features])
        return {"prediction": int(prediction[0]), "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
\`\`\`

## 2. Decouple Long-Running Jobs
For inference jobs taking over 200ms, use an asynchronous background queue (Celery, Redis Queue, or BullMQ) to preserve HTTP server responsiveness.`,
      excerpt: 'A blueprint for transitioning machine learning models from prototype notebooks into resilient, containerized FastAPI endpoints.',
      tags: ['Python', 'FastAPI', 'Machine Learning', 'AI'],
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      username: 'arjunmehta',
      title: 'Understanding Database Connection Pooling in High-Throughput Node.js',
      slug: 'understanding-database-connection-pooling-nodejs',
      content: `# Understanding Database Connection Pooling in High-Throughput Node.js

Node.js asynchronous event loop makes it easy to spawn concurrent database queries, but database servers cannot handle unbounded open TCP sockets.

## 1. Pool Size Formula

The recommended baseline formula:
\`pool_size = (core_count * 2) + effective_spindle_count\`

Setting pool size to 100 on an 8-core database server often increases query latency due to CPU context switching on the database host.

## 2. Prevent Connection Starvation

Always configure connection acquisition timeouts:
\`\`\`typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, // Fail fast rather than hanging the HTTP request
});
\`\`\`

Using **PgBouncer** in transaction pooling mode allows thousands of application pods to share a modest pool of persistent backend connections.`,
      excerpt: 'A deep dive into connection acquisition timeouts, pool exhaustion, and memory leaks in asynchronous database drivers.',
      tags: ['Database', 'Node.js', 'PostgreSQL', 'Performance'],
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      username: 'sofiawilliams',
      title: 'Practical TypeScript Patterns for Growing Frontend Projects',
      slug: 'practical-typescript-patterns-for-growing-frontend-projects',
      content: `# Practical TypeScript Patterns for Growing Frontend Projects

As applications expand, simple interfaces often fail to capture subtle domain rules. These three TypeScript techniques prevent subtle runtime errors.

## 1. Branded Nominal Types for Identity Safety

\`\`\`typescript
declare const brand: unique symbol;
type Brand<K, T> = K & { readonly [brand]: T };

export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;

function deleteProject(userId: UserId, projectId: ProjectId) {
  // Transposed argument orders cause immediate compile errors!
}
\`\`\`

## 2. Discriminated Unions for UI State
Instead of separate flags like \`isLoading\`, \`isError\`, \`data\`, use a single discriminated status object to make impossible states unrepresentable.`,
      excerpt: 'Explore branded nominal types, discriminated unions, and exhaustive pattern matchers for bulletproof frontend codebases.',
      tags: ['TypeScript', 'Frontend', 'Architecture'],
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      username: 'priyashah',
      title: 'Building Resilient Data Pipelines with Python and PostgreSQL',
      slug: 'building-resilient-data-pipelines-python-postgresql',
      content: `# Building Resilient Data Pipelines with Python and PostgreSQL

ETL pipelines frequently encounter transient network hiccups or malformed upstream payloads. Designing for idempotency ensures safe retries.

## 1. Idempotent Ingestion with ON CONFLICT

\`\`\`sql
INSERT INTO daily_metrics (metric_date, metric_key, metric_value)
VALUES (%s, %s, %s)
ON CONFLICT (metric_date, metric_key)
DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();
\`\`\`

## 2. Streaming Fast Ingestion with COPY
When loading hundreds of thousands of rows, avoid one-by-one \`INSERT\` loops. Use Python's \`psycopg2\` or \`asyncpg\` copy buffers for order-of-magnitude faster throughput.`,
      excerpt: 'Techniques for checkpoint recovery, streaming bulk copies, and idempotent upserts in production Python data engineering pipelines.',
      tags: ['Python', 'PostgreSQL', 'Pandas', 'Database'],
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
      username: 'ethanbrown',
      title: 'Zero-Downtime Database Migrations in Continuous Deployment',
      slug: 'zero-downtime-database-migrations-cd',
      content: `# Zero-Downtime Database Migrations in Continuous Deployment

Shipping schema changes while services handle live traffic requires the **Expand and Contract pattern**.

## The Three-Phase Evolution
1. **Expand**: Add new columns as nullable or with safe defaults. Start writing to both old and new columns.
2. **Backfill**: Migrate historical records asynchronously in chunked background transactions.
3. **Contract**: Switch reads to the new column, verify metrics, and deprecate the old column in a subsequent release.

\`\`\`sql
-- Concurrent index creation avoids holding table write locks
CREATE INDEX CONCURRENTLY idx_users_username_lower ON users (LOWER(username));
\`\`\``,
      excerpt: 'A practical framework for shipping schema changes and database migrations in high-concurrency production environments without maintenance windows.',
      tags: ['DevOps', 'Database', 'PostgreSQL', 'CI/CD'],
      coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      username: 'noorkhan',
      title: 'Structuring Modern Next.js and React Applications for Maintainability',
      slug: 'structuring-modern-nextjs-react-maintainability',
      content: `# Structuring Modern Next.js and React Applications for Maintainability

As frontend codebases scale past dozens of routes, organizing files by technical category (all components together, all hooks together) creates cognitive friction.

## Feature-Sliced Organization
Group code by business feature domain:
\`\`\`text
src/features/projects/
├── api/             # Specific query hooks & mutations
├── components/      # UI components scoped to projects
├── types/           # Domain models
└── utils/           # Helper transformations
\`\`\`

Colocating related queries, mutations, and presentation components makes features easy to refactor or delete cleanly.`,
      excerpt: 'How feature-sliced architecture and query colocation simplify team collaboration in large React and Next.js applications.',
      tags: ['Next.js', 'React', 'Architecture', 'TypeScript'],
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
    {
      username: 'carlosrodriguez',
      title: 'Hardening REST APIs: Authentication, Rate Limiting, and Session Defense',
      slug: 'hardening-rest-apis-authentication-rate-limiting',
      content: `# Hardening REST APIs: Authentication, Rate Limiting, and Session Defense

A robust API layer implements defense-in-depth across transport, authentication, and endpoint rate limits.

## 1. HTTP-Only SameSite Cookies
Avoid storing authentication tokens in \`localStorage\` where cross-site scripting (XSS) can harvest them. Store JWTs in encrypted, \`HttpOnly\`, \`SameSite=Lax\` cookies.

## 2. Sliding Window Rate Limiting
Protect authentication endpoints against brute force using Redis sliding window log algorithms to throttle anomalous request rates without affecting legitimate users.`,
      excerpt: 'Defensive architecture for modern REST APIs: token rotation, cookie hardening, rate limiting, and strict payload validation.',
      tags: ['Security', 'Node.js', 'Backend', 'Express'],
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    },
    {
      username: 'ananyasharma',
      title: 'Optimizing Data Visualization Dashboards with React and Canvas/SVG',
      slug: 'optimizing-data-visualization-dashboards-react',
      content: `# Optimizing Data Visualization Dashboards with React and Canvas/SVG

Rendering thousands of DOM elements inside SVG charts degrades frame rates during user zooming or brushing.

## Hybrid Canvas and SVG Strategy
- **Background Data Layer**: Render high-density scatter points and time-series paths on an offscreen HTML5 \`<canvas>\` element for 60fps rendering.
- **Interactive Foreground Layer**: Use declarative React SVG elements for axes, legends, and tooltip hover targets.
- **Throttling Mousemove**: Wrap cursor coordinates in \`requestAnimationFrame\` to decouple hover calculations from the layout engine.`,
      excerpt: 'Techniques for rendering responsive, 60fps telemetry dashboards using React, offscreen HTML5 Canvas, and composable SVG.',
      tags: ['Data Visualization', 'React', 'Frontend', 'Performance'],
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },
  ];

  for (const pub of publicationsData) {
    const author = createdUsers[pub.username];
    if (author) {
      await prisma.blogPost.create({
        data: {
          authorId: author.id,
          title: pub.title,
          slug: pub.slug,
          content: pub.content,
          excerpt: pub.excerpt,
          tags: pub.tags,
          coverImage: pub.coverImage,
          isPublished: pub.isPublished,
          publishedAt: pub.publishedAt,
        },
      });
    }
  }

  // 9. SEED REALISTIC NOTIFICATIONS FOR DEMO USERS
  const sofiaUser = createdUsers['sofiawilliams'];
  const noorUser = createdUsers['noorkhan'];
  const alexUser = createdUsers['alexmorgan'];
  const mayaUser = createdUsers['mayachen'];
  const arjunUser = createdUsers['arjunmehta'];
  const danielUser = createdUsers['danielkim'];
  const ethanUser = createdUsers['ethanbrown'];

  const notificationsToCreate = [
    {
      user: sofiaUser,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: 'Noor Khan sent you a connection request.',
      entityId: noorUser?.id,
      entityType: 'User',
      metadata: JSON.stringify({ requesterId: noorUser?.id, requesterName: noorUser?.name }),
    },
    {
      user: danielUser,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: 'Ethan Brown sent you a connection request.',
      entityId: ethanUser?.id,
      entityType: 'User',
      metadata: JSON.stringify({ requesterId: ethanUser?.id, requesterName: ethanUser?.name }),
    },
    {
      user: alexUser,
      type: 'SKILL_ENDORSEMENT',
      title: 'Skill Endorsed!',
      message: 'Maya Chen endorsed your React skill.',
      entityId: userSkillsMap['alexmorgan_React']?.id,
      entityType: 'UserSkill',
      metadata: JSON.stringify({ skillName: 'React', endorserId: mayaUser?.id, endorserUsername: mayaUser?.username }),
    },
    {
      user: mayaUser,
      type: 'SKILL_ENDORSEMENT',
      title: 'Skill Endorsed!',
      message: 'Arjun Mehta endorsed your PostgreSQL skill.',
      entityId: userSkillsMap['mayachen_PostgreSQL']?.id,
      entityType: 'UserSkill',
      metadata: JSON.stringify({ skillName: 'PostgreSQL', endorserId: arjunUser?.id, endorserUsername: arjunUser?.username }),
    },
    {
      user: alexUser,
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection Accepted',
      message: 'Sofia Williams accepted your connection request.',
      entityId: sofiaUser?.id,
      entityType: 'User',
      metadata: JSON.stringify({ connectedUserId: sofiaUser?.id, connectedUserName: sofiaUser?.name }),
    },
  ];

  for (const n of notificationsToCreate) {
    if (n.user) {
      await prisma.notification.create({
        data: {
          userId: n.user.id,
          type: n.type,
          title: n.title,
          message: n.message,
          entityId: n.entityId,
          entityType: n.entityType,
          isRead: false,
          metadata: n.metadata,
        },
      });
    }
  }

  console.log('✅ DevConnect demo dataset seeded successfully!');
  console.log(`- Demo Developers: ${demoUsersData.length}`);
  console.log(`- Open Source Showcase Projects: ${projectsData.length}`);
  console.log(`- Technical Publications: ${publicationsData.length}`);
  console.log(`- Network Connections: ${connectionsData.length}`);
  console.log(`- Genuine Skill Endorsements: ${endorsementsData.length}`);
  console.log(`- Notifications: ${notificationsToCreate.length}`);
  console.log('Credentials for all demo developers: password is "DemoPassword123!"');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
