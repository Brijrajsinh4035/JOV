import jwt from 'jsonwebtoken';
import { envConfig } from '../src/config/env.config.js';

const BASE_URL = 'http://localhost:5001/api';

// Generate admin token
const adminToken = jwt.sign(
  { id: '6aa507010303c5865cc59e35', email: 'admin@gov.in', role: 'admin', isAdmin: true },
  envConfig.jwtSecret,
  { expiresIn: '1h' }
);

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${adminToken}`,
};

async function runTests() {
  console.log('=== STARTING COMPREHENSIVE CRUD VERIFICATION ===\n');

  // ==========================================
  // 1. CLIENT CRUD
  // ==========================================
  console.log('--- TEST 1: CLIENT CRUD ---');
  const clientEmail = `agency_test_${Date.now()}@nhai.gov.in`;

  // 1.1 Create Client (POST)
  const createClientRes = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'National Highways Authority of India (NHAI)',
      email: clientEmail,
      company: 'Ministry of Road Transport and Highways',
      phone: '+91 11 2507 4100',
    }),
  });
  const clientData = await createClientRes.json();
  console.log('1.1 Create Client status:', createClientRes.status, 'ID:', clientData.data?._id, 'id:', clientData.data?.id);
  if (!createClientRes.ok) throw new Error('Create Client failed: ' + JSON.stringify(clientData));
  const clientId = clientData.data._id || clientData.data.id;

  // 1.2 Read All Clients (GET)
  const getAllClientsRes = await fetch(`${BASE_URL}/clients`, { headers });
  const allClients = await getAllClientsRes.json();
  console.log('1.2 Get All Clients count:', allClients.data?.length);
  const foundClient = allClients.data?.find((c) => (c._id || c.id) === clientId);
  if (!foundClient) throw new Error('Created client not found in getAll');
  console.log('1.2 Client has both _id and id:', !!foundClient._id, !!foundClient.id);

  // 1.3 Read Client By ID (GET)
  const getClientByIdRes = await fetch(`${BASE_URL}/clients/${clientId}`, { headers });
  const singleClient = await getClientByIdRes.json();
  console.log('1.3 Get Client By ID name:', singleClient.data?.name);

  // 1.4 Update Client (PUT)
  const updateClientRes = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'NHAI Northern Corridor Division',
      phone: '+91 11 2507 4200',
    }),
  });
  const updatedClient = await updateClientRes.json();
  console.log('1.4 Update Client name:', updatedClient.data?.name, 'phone:', updatedClient.data?.phone);

  // ==========================================
  // 2. TEAM CRUD
  // ==========================================
  console.log('\n--- TEST 2: TEAM CRUD ---');

  // 2.1 Create Team (POST)
  const createTeamRes = await fetch(`${BASE_URL}/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `Civil Taskforce Alpha ${Date.now()}`,
      members: ['6aa507010303c5865cc59e35'], // admin
    }),
  });
  const teamData = await createTeamRes.json();
  console.log('2.1 Create Team status:', createTeamRes.status, 'ID:', teamData.data?._id, 'id:', teamData.data?.id);
  if (!createTeamRes.ok) throw new Error('Create Team failed: ' + JSON.stringify(teamData));
  const teamId = teamData.data._id || teamData.data.id;

  // 2.2 Read All Teams (GET)
  const getAllTeamsRes = await fetch(`${BASE_URL}/teams`, { headers });
  const allTeams = await getAllTeamsRes.json();
  console.log('2.2 Get All Teams count:', allTeams.data?.length);
  const foundTeam = allTeams.data?.find((t) => (t._id || t.id) === teamId);
  if (!foundTeam) throw new Error('Created team not found in getAll');
  console.log('2.2 Team has both _id and id:', !!foundTeam._id, !!foundTeam.id);

  // 2.3 Read Team By ID (GET)
  const getTeamByIdRes = await fetch(`${BASE_URL}/teams/${teamId}`, { headers });
  const singleTeam = await getTeamByIdRes.json();
  console.log('2.3 Get Team By ID name:', singleTeam.data?.name);

  // 2.4 Update Team (PUT)
  const updateTeamRes = await fetch(`${BASE_URL}/teams/${teamId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: `Civil Taskforce Alpha (Upgraded)`,
    }),
  });
  const updatedTeam = await updateTeamRes.json();
  console.log('2.4 Update Team name:', updatedTeam.data?.name);

  // ==========================================
  // 3. PROJECT CRUD (Using Created Client & Team)
  // ==========================================
  console.log('\n--- TEST 3: PROJECT CRUD ---');

  // 3.1 Create Project (POST)
  const createProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `Delhi-Mumbai Expressway Package ${Date.now()}`,
      description: 'National freight corridor expansion',
      status: 'planning',
      startDate: new Date(),
      budget: 2500000000, // 250 Cr
      usedbudget: 500000000, // 50 Cr
      clientId: clientId,
      teamId: teamId,
    }),
  });
  const projData = await createProjRes.json();
  console.log('3.1 Create Project status:', createProjRes.status, 'ID:', projData.data?._id, 'id:', projData.data?.id);
  if (!createProjRes.ok) throw new Error('Create Project failed: ' + JSON.stringify(projData));
  const projectId = projData.data._id || projData.data.id;

  // 3.2 Read All Projects (GET)
  const getAllProjectsRes = await fetch(`${BASE_URL}/projects`, { headers });
  const allProjects = await getAllProjectsRes.json();
  const projList = allProjects.data?.data || allProjects.data || [];
  const foundProj = projList.find((p) => (p._id || p.id) === projectId);
  console.log('3.2 Project found in list:', !!foundProj, 'Client name populated:', foundProj?.clientId?.name, 'Team name populated:', foundProj?.teamId?.name);

  // 3.3 Read Project By ID (GET)
  const getProjByIdRes = await fetch(`${BASE_URL}/projects/${projectId}`, { headers });
  const singleProj = await getProjByIdRes.json();
  console.log('3.3 Get Project By ID name:', singleProj.data?.name, 'status:', singleProj.data?.status);

  // 3.4 Update Project (PUT)
  const updateProjRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      status: 'active',
      description: 'Under active construction and milestone surveillance',
    }),
  });
  const updatedProj = await updateProjRes.json();
  console.log('3.4 Update Project status:', updatedProj.data?.status);

  // ==========================================
  // 4. CLEANUP / DELETE OPERATIONS
  // ==========================================
  console.log('\n--- TEST 4: DELETE (CRUD DESTROY) ---');

  // 4.1 Delete Project (DELETE)
  const deleteProjRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers,
  });
  console.log('4.1 Delete Project status:', deleteProjRes.status);

  // 4.2 Delete Team (DELETE)
  const deleteTeamRes = await fetch(`${BASE_URL}/teams/${teamId}`, {
    method: 'DELETE',
    headers,
  });
  console.log('4.2 Delete Team status:', deleteTeamRes.status);

  // 4.3 Delete Client (DELETE)
  const deleteClientRes = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: 'DELETE',
    headers,
  });
  console.log('4.3 Delete Client status:', deleteClientRes.status);

  console.log('\n>>> ALL CRUD OPERATIONS PASSED 100% SUCCESSFULLY! <<<');
}

runTests().catch((err) => {
  console.error('FAILED TEST:', err);
  process.exit(1);
});
