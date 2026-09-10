import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('DevConnect Critical End-to-End User Journey', () => {
  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let aliceUserSkillId: string;
  let aliceProjectId: string;
  let aliceBlogSlug: string;
  let connectionRequestId: string;

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ['alice.e2e@example.com', 'bob.e2e@example.com'] },
      },
    });
    await prisma.$disconnect();
  });

  it('Step 1: Alice registers for an account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice Developer',
      username: 'alice_e2e',
      email: 'alice.e2e@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('alice_e2e');
    aliceToken = res.body.data.token;
    aliceId = res.body.data.user.id;
  });

  it('Step 2: Alice logs in', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice.e2e@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('Step 3: Alice updates profile and adds technical skills', async () => {
    const profileRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        bio: 'Senior Backend Engineer specializing in Distributed Systems & PostgreSQL',
        location: 'Seattle, WA',
        githubUrl: 'https://github.com/alice-e2e',
      });
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.bio).toContain('Senior Backend');

    const skillRes = await request(app)
      .post('/api/users/skills')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        name: 'TypeScript',
        category: 'FRONTEND',
        yearsOfExperience: 5,
      });
    expect(skillRes.status).toBe(201);
    expect(skillRes.body.data.skill.name).toBe('TypeScript');
    aliceUserSkillId = skillRes.body.data.id;
  });

  it('Step 4: Alice creates a showcase project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Distributed Key-Value Store with Raft Consensus',
        description: 'High throughput, partition tolerant consensus engine built in TypeScript and Node.',
        techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        githubUrl: 'https://github.com/alice-e2e/raft-kv',
        liveDemoUrl: 'https://raft.alice.dev',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Distributed Key-Value Store with Raft Consensus');
    aliceProjectId = res.body.data.id;
  });

  it('Step 5: Alice publishes a technical blog post', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Implementing Raft Consensus in Node.js',
        content: '# Raft Consensus\n\nLeader election and log replication algorithms.\n\n```typescript\nconst term = 1;\n```',
        tags: ['Distributed Systems', 'Architecture', 'TypeScript'],
        isPublished: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBeDefined();
    aliceBlogSlug = res.body.data.slug;
  });

  it('Step 6: Bob registers and discovers Alice in developer directory', async () => {
    const bobReg = await request(app).post('/api/auth/register').send({
      name: 'Bob Rivera',
      username: 'bob_e2e',
      email: 'bob.e2e@example.com',
      password: 'Password123!',
    });
    expect(bobReg.status).toBe(201);
    bobToken = bobReg.body.data.token;
    bobId = bobReg.body.data.user.id;

    const searchRes = await request(app)
      .get('/api/discovery/developers?q=Alice&skill=TypeScript')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items.some((d: any) => d.username === 'alice_e2e')).toBe(true);
  });

  it('Step 7: Bob views Alice profile and sends connection request', async () => {
    const profileRes = await request(app)
      .get('/api/users/profile/alice_e2e')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.connectionStatus.status).toBe('NONE');

    const reqRes = await request(app)
      .post('/api/connections/request')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ receiverId: aliceId });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.data.status).toBe('PENDING');
    connectionRequestId = reqRes.body.data.id;
  });

  it('Step 8: Alice checks notifications and accepts connection', async () => {
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.items[0].type).toBe('CONNECTION_REQUEST');

    const acceptRes = await request(app)
      .put(`/api/connections/${connectionRequestId}/respond`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ action: 'ACCEPT' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');
  });

  it('Step 9: Connected Bob endorses Alice TypeScript skill', async () => {
    const endorseRes = await request(app)
      .post('/api/endorsements')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ userSkillId: aliceUserSkillId });

    expect(endorseRes.status).toBe(201);
    expect(endorseRes.body.data.endorserId).toBe(bobId);
  });

  it('Step 10: Alice receives endorsement notification and dashboard reflects updated metrics', async () => {
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.items.some((n: any) => n.type === 'SKILL_ENDORSEMENT')).toBe(true);

    const dashboardRes = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.data.stats.projectsCount).toBeGreaterThanOrEqual(1);
    expect(dashboardRes.body.data.stats.blogPostsCount).toBeGreaterThanOrEqual(1);
    expect(dashboardRes.body.data.stats.connectionsCount).toBeGreaterThanOrEqual(1);
    expect(dashboardRes.body.data.stats.endorsementsCount).toBeGreaterThanOrEqual(1);
  });
});
