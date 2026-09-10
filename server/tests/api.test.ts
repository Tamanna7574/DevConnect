import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('DevConnect API Integration Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let createdProjectId: string;
  let createdBlogId: string;
  let userSkillId: string;
  let connectionId: string;

  beforeAll(async () => {
    // Database connection active
  });

  afterAll(async () => {
    // Clean up test specific users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test_alice_api@example.com', 'test_bob_api@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('1. Authentication Module', () => {
    it('should register a new user successfully with standardized response format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Developer',
        email: 'test_alice_api@example.com',
        username: 'alice_dev_test',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('test_alice_api@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      user1Token = res.body.data.token;
      user1Id = res.body.data.user.id;
    });

    it('should prevent duplicate email registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Duplicate',
        email: 'test_alice_api@example.com',
        username: 'alice_dev_other',
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
      expect(res.body.message).toContain('already exists');
    });

    it('should register second user (Bob)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bob Architect',
        email: 'test_bob_api@example.com',
        username: 'bob_dev_test',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      user2Token = res.body.data.token;
      user2Id = res.body.data.user.id;
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test_alice_api@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('alice_dev_test');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test_alice_api@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
    });

    it('should get current authenticated user via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(user1Id);
    });

    it('should reject unauthenticated request to protected route', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should clear authentication cookie on logout', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out successfully');
    });
  });

  describe('2. Profile & Skills Module', () => {
    it('should reject unauthenticated profile update', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ bio: 'Attempt unauthorized update' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should update profile details', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          bio: 'Distributed systems engineer',
          location: 'San Francisco, CA',
          githubUrl: 'https://github.com/alice',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('Distributed systems engineer');
    });

    it('should add skill to profile', async () => {
      const res = await request(app)
        .post('/api/users/skills')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'PostgreSQL',
          category: 'DATABASE',
          yearsOfExperience: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skill.name).toBe('PostgreSQL');
      userSkillId = res.body.data.id;
    });

    it('should fetch developer profile by username with skills', async () => {
      const res = await request(app)
        .get('/api/users/profile/alice_dev_test')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('alice_dev_test');
      expect(res.body.data.skills.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Projects Module', () => {
    it('should reject unauthenticated project creation', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Unauthorized Project',
          description: 'No token provided',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should create a project with ownership', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Quantum Task Dispatcher',
          description: 'A distributed queue system with priority routing and fault tolerance.',
          techStack: ['Node.js', 'PostgreSQL', 'Redis'],
          githubUrl: 'https://github.com/alice/quantum-queue',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Quantum Task Dispatcher');
      expect(res.body.data.userId).toBe(user1Id);
      createdProjectId = res.body.data.id;
    });

    it('should prevent non-owners from modifying a project', async () => {
      const res = await request(app)
        .put(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should prevent non-owners from deleting a project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow owner to update their project', async () => {
      const res = await request(app)
        .put(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Quantum Task Dispatcher v2',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Quantum Task Dispatcher v2');
    });

    it('should list projects publicly with search and tech filters', async () => {
      const res = await request(app).get('/api/projects?search=Quantum&tech=PostgreSQL');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0].title).toContain('Quantum');
    });

    it('should retrieve public project details by ID with owner information', async () => {
      const res = await request(app).get(`/api/projects/${createdProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdProjectId);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe(user1Id);
    });
  });

  describe('4. Blog Posts Module', () => {
    it('should create and publish a technical markdown blog post', async () => {
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Deep Dive into Database Indexing Algorithms',
          content: `# Deep Dive into B-Trees\n\nB-Trees provide logarithmic time complexity for indexing.\n\n\`\`\`sql\nCREATE INDEX idx_user_email ON users(email);\n\`\`\``,
          tags: ['Database', 'PostgreSQL', 'Performance'],
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Deep Dive into Database Indexing Algorithms');
      expect(res.body.data.slug).toBeDefined();
      createdBlogId = res.body.data.id;
    });

    it('should prevent non-owners from modifying a blog post', async () => {
      const res = await request(app)
        .put(`/api/blogs/${createdBlogId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Unauthorized Modification of Blog',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should prevent non-owners from deleting a blog post', async () => {
      const res = await request(app)
        .delete(`/api/blogs/${createdBlogId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should list published blogs', async () => {
      const res = await request(app).get('/api/blogs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Developer Discovery Module', () => {
    it('should search developers by text query', async () => {
      const res = await request(app).get('/api/discovery/developers?q=Alice');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.some((d: any) => d.username === 'alice_dev_test')).toBe(true);
    });

    it('should filter developers by skill', async () => {
      const res = await request(app).get('/api/discovery/developers?skill=PostgreSQL');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Connections & Endorsements Module', () => {
    it('should prevent self-connection', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          receiverId: user1Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent skill endorsement before connecting', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          userSkillId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('must be connected');
    });

    it('should send connection request from Bob to Alice', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          receiverId: user1Id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      connectionId = res.body.data.id;
    });

    it('should prevent duplicate pending connection request', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          receiverId: user1Id,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should verify Alice received notification for connection request', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].type).toBe('CONNECTION_REQUEST');
    });

    it('should allow Alice to accept connection request', async () => {
      const res = await request(app)
        .put(`/api/connections/${connectionId}/respond`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          action: 'ACCEPT',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    it('should allow connected Bob to endorse Alice skill', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          userSkillId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.endorserId).toBe(user2Id);
    });

    it('should prevent duplicate endorsement of the same skill', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          userSkillId,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already endorsed');
    });
  });

  describe('7. Dashboard Module', () => {
    it('should return real aggregated dashboard statistics and activity', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.projectsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.blogPostsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.connectionsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.endorsementsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.recentActivity).toBeDefined();
    });
  });

  describe('8. Discovery, Search & Filters Module', () => {
    it('should return discovery filters containing real skills, locations, tech stacks, and tags', async () => {
      const res = await request(app).get('/api/discovery/filters');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.skills)).toBe(true);
      expect(Array.isArray(res.body.data.locations)).toBe(true);
      expect(Array.isArray(res.body.data.techStacks)).toBe(true);
      expect(Array.isArray(res.body.data.blogTags)).toBe(true);
      expect(res.body.data.skills).toContain('TypeScript');
      expect(res.body.data.techStacks).toContain('React');
    });

    it('should search developers by name, username, skill or location', async () => {
      const res = await request(app).get('/api/discovery/developers?q=Alice');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].username).toBe('alice_dev_test');

      // Security check: passwords and emails should not be exposed
      expect(res.body.data.items[0].passwordHash).toBeUndefined();
      expect(res.body.data.items[0].email).toBeUndefined();
    });

    it('should perform global search across all categories (type=all)', async () => {
      const res = await request(app).get('/api/discovery/search?q=Platform&type=all');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.counts).toBeDefined();
      expect(typeof res.body.data.counts.total).toBe('number');
      expect(Array.isArray(res.body.data.projects.items)).toBe(true);
    });

    it('should perform targeted search when specific category type is provided', async () => {
      const res = await request(app).get('/api/discovery/search?q=React&type=projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.developers.items.length).toBe(0); // avoided querying developers
      expect(res.body.data.publications.items.length).toBe(0); // avoided querying publications
    });
  });

  describe('9. Dashboard Module', () => {
    it('should reject unauthenticated dashboard access with 401', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return complete personalized dashboard payload with real stats, userProjects, userBlogs, and network', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Dashboard data retrieved successfully.');

      const { stats, userProjects, userBlogs, network, recentActivity, suggestions, latestProjects, trendingBlogs } = res.body.data;

      // Stats check
      expect(typeof stats.projectsCount).toBe('number');
      expect(typeof stats.blogPostsCount).toBe('number');
      expect(typeof stats.connectionsCount).toBe('number');
      expect(typeof stats.endorsementsCount).toBe('number');
      expect(typeof stats.pendingRequestsCount).toBe('number');
      expect(typeof stats.skillsCount).toBe('number');
      expect(stats.projectsCount).toBeGreaterThanOrEqual(1);
      expect(stats.blogPostsCount).toBeGreaterThanOrEqual(1);
      expect(stats.skillsCount).toBeGreaterThanOrEqual(1);

      // Personal entities check
      expect(Array.isArray(userProjects)).toBe(true);
      expect(userProjects.length).toBeGreaterThanOrEqual(1);
      expect(typeof userProjects[0].title).toBe('string');
      expect(userProjects[0].title.length).toBeGreaterThan(0);
      expect(Array.isArray(userProjects[0].techStack)).toBe(true);

      expect(Array.isArray(userBlogs)).toBe(true);
      expect(userBlogs.length).toBeGreaterThanOrEqual(1);
      expect(typeof userBlogs[0].title).toBe('string');
      expect(userBlogs[0].title.length).toBeGreaterThan(0);

      // Network snapshot check
      expect(typeof network.totalConnections).toBe('number');
      expect(typeof network.pendingCount).toBe('number');
      expect(Array.isArray(network.incomingRequests)).toBe(true);
      expect(Array.isArray(network.recentConnections)).toBe(true);

      // Activity, suggestions, community showcase check
      expect(Array.isArray(recentActivity)).toBe(true);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(Array.isArray(latestProjects)).toBe(true);
      expect(Array.isArray(trendingBlogs)).toBe(true);
    });
  });
});

