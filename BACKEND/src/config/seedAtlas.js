import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('[Seeder] Error: MONGODB_URI is not set in .env');
  process.exit(1);
}

export async function seedAtlasData() {
  console.log('[Seeder] Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;

  console.log('[Seeder] Connected to database:', db.databaseName);

  // 1. Check existing users
  const users = await db.collection('users').find({}).toArray();
  console.log(`[Seeder] Found ${users.length} users in database.`);
  const adminUser = users.find((u) => u.role === 'admin' || u.email === 'admin@gov.in') || users[0];
  const viewerUser = users.find((u) => u.role === 'viewer' || u.email === 'viewer@gov.in') || users[1] || adminUser;

  // 2. Check existing projects
  const projects = await db.collection('projects').find({}).toArray();
  console.log(`[Seeder] Found ${projects.length} projects in database.`);
  if (projects.length === 0) {
    console.warn('[Seeder] No projects found in database. Please ensure projects exist.');
    return;
  }

  // 3. Seed Milestones if collection is empty
  const milestoneCount = await db.collection('milestones').countDocuments();
  console.log(`[Seeder] Milestones collection has ${milestoneCount} documents.`);
  if (milestoneCount === 0) {
    const milestonesToInsert = [];
    for (const proj of projects) {
      if (Array.isArray(proj.milestones) && proj.milestones.length > 0) {
        for (const m of proj.milestones) {
          const rawStatus = (m.status || 'pending').toLowerCase();
          let status = 'pending';
          if (rawStatus.includes('comp') || rawStatus === 'done') status = 'completed';
          else if (rawStatus.includes('prog') || rawStatus === 'active') status = 'in-progress';
          else if (rawStatus.includes('delay') || rawStatus.includes('hold')) status = 'delayed';

          milestonesToInsert.push({
            _id: m._id ? new mongoose.Types.ObjectId(m._id) : new mongoose.Types.ObjectId(),
            projectId: proj._id,
            title: m.title || 'Milestone Target',
            description: m.remarks || m.description || `Surveillance stage for ${proj.title || proj.name}`,
            dueDate: m.targetDate ? new Date(m.targetDate) : (m.dueDate ? new Date(m.dueDate) : new Date('2026-12-31')),
            status: status,
            responsiblePerson: m.responsiblePerson || proj.responsibleOfficer || 'Chief Engineer',
            createdAt: new Date(),
          });
        }
      }
    }

    if (milestonesToInsert.length > 0) {
      await db.collection('milestones').insertMany(milestonesToInsert);
      console.log(`[Seeder] Successfully seeded ${milestonesToInsert.length} milestones into MongoDB Atlas!`);
    }
  }

  // 4. Seed Departments if collection is empty
  const deptCount = await db.collection('departments').countDocuments();
  console.log(`[Seeder] Departments collection has ${deptCount} documents.`);
  if (deptCount === 0) {
    const departments = [
      { name: 'Ministry of Road Transport & Highways (MoRTH)', code: 'MoRTH', createdAt: new Date() },
      { name: 'Ministry of Jal Shakti (DoWR)', code: 'MJS', createdAt: new Date() },
      { name: 'Ministry of Health & Family Welfare (MoHFW)', code: 'MoHFW', createdAt: new Date() },
      { name: 'Ministry of Education & Skill Development', code: 'MoE', createdAt: new Date() },
      { name: 'Ministry of Housing & Urban Affairs (MoHUA)', code: 'MoHUA', createdAt: new Date() },
      { name: 'Ministry of Power & Renewable Energy (MNRE)', code: 'MNRE', createdAt: new Date() },
      { name: 'NITI Aayog Public Infrastructure Monitoring', code: 'NITI', createdAt: new Date() },
    ];
    await db.collection('departments').insertMany(departments);
    console.log(`[Seeder] Seeded ${departments.length} departments into MongoDB Atlas.`);
  }

  // 5. Seed Clients / Statutory Authorities if empty
  const clientCount = await db.collection('clients').countDocuments();
  console.log(`[Seeder] Clients collection has ${clientCount} documents.`);
  if (clientCount === 0) {
    const clients = [
      { name: 'National Highways Authority of India (NHAI)', email: 'director@nhai.gov.in', phone: '+91-11-25074100', company: 'NHAI', createdAt: new Date() },
      { name: 'National Jal Jeevan Mission Authority', email: 'dg-jjm@gov.in', phone: '+91-11-24362705', company: 'Dept of Drinking Water', createdAt: new Date() },
      { name: 'AIIMS Directorate & Engineering Board', email: 'director@aiims.edu', phone: '+91-11-26588500', company: 'MoHFW Apex Hospitals', createdAt: new Date() },
      { name: 'Bangalore Metro Rail Corporation (BMRCL)', email: 'contact@bmrcl.co.in', phone: '+91-80-22969300', company: 'BMRCL Feeder Rail', createdAt: new Date() },
      { name: 'Solar Energy Corporation of India (SECI)', email: 'info@seci.co.in', phone: '+91-11-26818888', company: 'SECI Renewable Power', createdAt: new Date() },
    ];
    await db.collection('clients').insertMany(clients);
    console.log(`[Seeder] Seeded ${clients.length} statutory clients into MongoDB Atlas.`);
  }

  // 6. Seed Teams if empty
  const teamCount = await db.collection('teams').countDocuments();
  console.log(`[Seeder] Teams collection has ${teamCount} documents.`);
  if (teamCount === 0) {
    const teams = [
      { name: 'Greenfield Expressway Strategic PMU', description: 'Civil structures and advanced ITS monitoring cell', createdAt: new Date() },
      { name: 'National Water Grid Technical Cell', description: 'Pipeline telemetry and intake well inspection cell', createdAt: new Date() },
      { name: 'Tertiary Healthcare Infrastructure Wing', description: 'Hospital medical architecture and equipment engineering', createdAt: new Date() },
      { name: 'Smart Transit Feeder & Metro Cell', description: 'Rolling stock, signaling, and viaduct track deployment', createdAt: new Date() },
      { name: 'Renewable Clean Energy Mission Team', description: 'Solar PV farm high-voltage grid synchronization unit', createdAt: new Date() },
    ];
    await db.collection('teams').insertMany(teams);
    console.log(`[Seeder] Seeded ${teams.length} implementation teams into MongoDB Atlas.`);
  }

  // 7. Seed Tasks if collection is empty
  const taskCount = await db.collection('tasks').countDocuments();
  console.log(`[Seeder] Tasks collection has ${taskCount} documents.`);
  if (taskCount === 0) {
    const allMilestones = await db.collection('milestones').find({}).toArray();
    const getMilestoneId = (projId) => {
      const found = allMilestones.find((m) => m.projectId.toString() === projId.toString());
      return found ? found._id : null;
    };

    const tasksToInsert = [
      // Project 1: Delhi-Mumbai Expressway
      {
        title: 'Geotechnical testing and soil stabilization at Ch. 182-195',
        description: 'Verify subgrade CBR ratio and dynamic cone penetrometer test benchmarks.',
        projectId: projects[0]._id,
        milestoneId: getMilestoneId(projects[0]._id),
        assignedTo: adminUser._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date('2026-05-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Complete PQC laying over 14.5km main carriage section',
        description: 'Pavement quality concrete 300mm thickness paving using slipform paver train.',
        projectId: projects[0]._id,
        milestoneId: getMilestoneId(projects[0]._id),
        assignedTo: adminUser._id,
        status: 'in-progress',
        priority: 'critical',
        dueDate: new Date('2026-07-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Deploy Smart ITS High-Speed Weigh-in-Motion sensors',
        description: 'FASTag RFID integration and overhead gantry automated number plate cameras.',
        projectId: projects[0]._id,
        milestoneId: getMilestoneId(projects[0]._id),
        assignedTo: viewerUser._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-09-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Independent Safety Audit & Crash Barrier certification',
        description: 'Final audit report by Central Road Research Institute (CRRI) for tolling clearance.',
        projectId: projects[0]._id,
        milestoneId: getMilestoneId(projects[0]._id),
        assignedTo: adminUser._id,
        status: 'review',
        priority: 'high',
        dueDate: new Date('2026-10-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 2: Jal Jeevan Mission
      {
        title: 'Hydrostatic pressure testing of 48-inch MS bulk water pipeline',
        description: 'Inspect joint leakages at 1.5x working pressure for 24 continuous hours across 32km.',
        projectId: projects[1]._id,
        milestoneId: getMilestoneId(projects[1]._id),
        assignedTo: adminUser._id,
        status: 'blocked',
        priority: 'critical',
        dueDate: new Date('2026-06-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Install multi-stage vertical turbine pumps at Yamuna intake well',
        description: 'Erection of 750 HP vertical turbine pumps and electrical synchronizer panels.',
        projectId: projects[1]._id,
        milestoneId: getMilestoneId(projects[1]._id),
        assignedTo: viewerUser._id,
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2026-08-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'SCADA water quality sensor calibration & village tap telemetry',
        description: 'IoT chlorine, pH, and flow telemetry nodes link to Jal Jeevan national dashboard.',
        projectId: projects[1]._id,
        milestoneId: getMilestoneId(projects[1]._id),
        assignedTo: viewerUser._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-11-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 3: AIIMS Sambalpur
      {
        title: 'Commissioning of 3.0T MRI, CT Scan, and Linac Radiotherapy Suite',
        description: 'Atomic Energy Regulatory Board (AERB) shielding certification and vendor calibration.',
        projectId: projects[2]._id,
        milestoneId: getMilestoneId(projects[2]._id),
        assignedTo: adminUser._id,
        status: 'done',
        priority: 'critical',
        dueDate: new Date('2026-04-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Central sterile services department (CSSD) validation and clean room testing',
        description: 'Particulate matter testing and positive pressure laminar airflow validation in 18 OTs.',
        projectId: projects[2]._id,
        milestoneId: getMilestoneId(projects[2]._id),
        assignedTo: viewerUser._id,
        status: 'review',
        priority: 'high',
        dueDate: new Date('2026-05-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Final occupancy certificate handover and fire safety clearance',
        description: 'Fire service department NOC and municipal water-sanitation final commissioning.',
        projectId: projects[2]._id,
        milestoneId: getMilestoneId(projects[2]._id),
        assignedTo: adminUser._id,
        status: 'done',
        priority: 'medium',
        dueDate: new Date('2026-03-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 4: PM-SHRI Model Smart Schools
      {
        title: 'Installation of interactive flat panel displays and fiber broadband in 120 schools',
        description: 'BharatNet connectivity verification and smart class digital content pre-loading.',
        projectId: projects[3]._id,
        milestoneId: getMilestoneId(projects[3]._id),
        assignedTo: viewerUser._id,
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date('2026-07-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'STEM innovation robotics lab equipment delivery & teacher training',
        description: 'Distribute 3D printers, coding kits, and conduct 3-day regional master trainer workshop.',
        projectId: projects[3]._id,
        milestoneId: getMilestoneId(projects[3]._id),
        assignedTo: adminUser._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date('2026-08-25'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 5: Narmada Cable-Stayed Bridge
      {
        title: 'Cable stay tensioning and load cell dynamic resonance analysis',
        description: 'High-tensile steel stay cables tension calibration using hydraulic jacks and ultrasonic testing.',
        projectId: projects[4]._id,
        milestoneId: getMilestoneId(projects[4]._id),
        assignedTo: adminUser._id,
        status: 'in-progress',
        priority: 'critical',
        dueDate: new Date('2026-08-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Aerodynamic wind tunnel validation for gale force conditions',
        description: 'Confirm vortex-induced vibration dampers under 160 km/h wind simulation.',
        projectId: projects[4]._id,
        milestoneId: getMilestoneId(projects[4]._id),
        assignedTo: viewerUser._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date('2026-02-28'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 6: Bengaluru Metro Suburban Feeder
      {
        title: 'Viaduct U-girder erection over National Highway 44 intersection',
        description: 'Night traffic diversion clearance and 45-meter pre-cast girder launching.',
        projectId: projects[5]._id,
        milestoneId: getMilestoneId(projects[5]._id),
        assignedTo: adminUser._id,
        status: 'in-progress',
        priority: 'critical',
        dueDate: new Date('2026-09-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'CBTC automated signaling track magnet placement and test runs',
        description: 'Communication-based train control integration with central operations control centre.',
        projectId: projects[5]._id,
        milestoneId: getMilestoneId(projects[5]._id),
        assignedTo: viewerUser._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-11-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 7: Solar Park 750 MW
      {
        title: 'Grid synchronization of 250 MW inverter station Section-C',
        description: 'Power Grid Corporation (PGCIL) 400kV substation charging and anti-islanding test.',
        projectId: projects[6]._id,
        milestoneId: getMilestoneId(projects[6]._id),
        assignedTo: adminUser._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date('2026-04-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Battery Energy Storage System (BESS) 50MWh trial cycles',
        description: 'Peak shaving dispatch trials and thermal runaway safety suppression verification.',
        projectId: projects[6]._id,
        milestoneId: getMilestoneId(projects[6]._id),
        assignedTo: viewerUser._id,
        status: 'review',
        priority: 'medium',
        dueDate: new Date('2026-06-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Project 8: Chennai Flood Mitigation
      {
        title: 'Monsoon dredging and seawall rock armor placement at canal mouth',
        description: 'Excavate 120,000 cubic meters silt and install tetrapods along shoreline breach point.',
        projectId: projects[7]._id,
        milestoneId: getMilestoneId(projects[7]._id),
        assignedTo: adminUser._id,
        status: 'blocked',
        priority: 'critical',
        dueDate: new Date('2026-07-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('tasks').insertMany(tasksToInsert);
    console.log(`[Seeder] Seeded ${tasksToInsert.length} high-impact tasks into MongoDB Atlas!`);
  }

  // 8. Seed Risks if collection is empty
  const riskCount = await db.collection('risks').countDocuments();
  console.log(`[Seeder] Risks collection has ${riskCount} documents.`);
  if (riskCount === 0) {
    const risksToInsert = [
      {
        projectId: projects[0]._id,
        title: 'Heavy monsoon scouring near bridge pier foundation P-14',
        description: 'Erosion around deep caisson foundation during flash floods in Chambal river basin. Pier rip-rap rock protection urgently recommended.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
      },
      {
        projectId: projects[0]._id,
        title: 'Delay in high-voltage 220kV power transmission line shifting',
        description: 'State power transmission utility outage approval pending for 3 tower relocations.',
        severity: 'high',
        status: 'open',
        createdAt: new Date(),
      },
      {
        projectId: projects[1]._id,
        title: 'Factory supply chain delay for heavy ductile iron (DI) K9 pipes',
        description: 'Vendor production constraints causing 6-week lag in 900mm pipeline dispatch. Alternate registered vendors under review.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
      },
      {
        projectId: projects[1]._id,
        title: 'Seasonal drop in raw water intake reservoir levels',
        description: 'Summer drawdown requires extending submersible suction pipes deeper into the dead storage zone.',
        severity: 'medium',
        status: 'mitigated',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        projectId: projects[2]._id,
        title: 'Oxygen plant cryogenic vacuum-insulated evaporator delay',
        description: 'Specialized cryogenic vessel shipping delayed by customs logistics inspection.',
        severity: 'high',
        status: 'mitigated',
        createdAt: new Date(Date.now() - 86400000 * 10),
      },
      {
        projectId: projects[4]._id,
        title: 'High-speed seasonal crosswinds affecting stay cable oscillation',
        description: 'Excessive aerodynamic vibration observed in preliminary wind tunnel tests. Dynamic tuned-mass dampers procured.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
      },
      {
        projectId: projects[5]._id,
        title: 'Underground utility clash with 66kV oil-filled cable grid',
        description: 'Uncharted legacy power line detected during metro foundation piling near suburban junction.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
      },
      {
        projectId: projects[7]._id,
        title: 'Coastal high-tide backflow risking saltwater canal contamination',
        description: 'Desalination conduit requires automated flap gate installation before upcoming cyclone season.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
      },
    ];

    await db.collection('risks').insertMany(risksToInsert);
    console.log(`[Seeder] Seeded ${risksToInsert.length} engineering risks into MongoDB Atlas!`);
  }

  console.log('[Seeder] All collections successfully verified and populated in MongoDB Atlas!');
  await mongoose.disconnect();
}

// Auto-run if executed directly
seedAtlasData()
  .then(() => {
    console.log('[Seeder] Finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seeder] Error during seeding:', err);
    process.exit(1);
  });
