import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "data.sqlite");

export const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

export const initDb = async () => {
  await run(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      jobNumber TEXT,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      site TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      category TEXT,
      template TEXT,
      pricingModel TEXT,
      estimatedCost REAL,
      startDate TEXT,
      dueDate TEXT,
      description TEXT,
      manager TEXT,
      assignedStaff TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS samples (
      id TEXT PRIMARY KEY,
      sampleNo TEXT,
      location TEXT,
      surfaceType TEXT,
      itemDescription TEXT,
      materialType TEXT,
      sampleType TEXT,
      collectionDate TEXT,
      assessmentStatus TEXT,
      friability TEXT,
      materialCondition TEXT,
      deteriorationPotential TEXT,
      activityLevel TEXT,
      accessibility TEXT,
      priorityLevel TEXT,
      reinspectionSchedule TEXT,
      approxQuantity TEXT,
      controlRecommendation TEXT,
      collector TEXT,
      asbestosType TEXT,
      concentration REAL,
      labName TEXT,
      labReference TEXT,
      notes TEXT,
      locationX REAL,
      locationY REAL,
      customFields TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      
      -- Legacy fields for compatibility
      sampleId TEXT,
      site TEXT,
      area TEXT,
      status TEXT,
      riskLevel TEXT
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      sampleId TEXT,
      name TEXT NOT NULL,
      type TEXT,
      size INTEGER,
      path TEXT NOT NULL,
      folderPath TEXT,
      uploadedBy TEXT,
      isOverlay INTEGER,
      overlayId TEXT,
      thumbnail TEXT,
      linkedSampleIds TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(sampleId) REFERENCES samples(id)
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      lastActive TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS shares (
      token TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      targetId TEXT,
      accessType TEXT,
      accessScope TEXT,
      password TEXT,
      allowedEmails TEXT,
      createdBy TEXT,
      expiresAt TEXT,
      views INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )`
  );

  await migrateDb();
};

const getExistingColumns = async (table) => {
  const columns = await all(`PRAGMA table_info(${table})`);
  return new Set(columns.map((col) => col.name));
};

const addColumnIfMissing = async (table, column, definition) => {
  const columns = await getExistingColumns(table);
  if (columns.has(column)) return;
  await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};

const migrateDb = async () => {
  // Projects migrations
  await addColumnIfMissing("projects", "jobNumber", "TEXT");
  await addColumnIfMissing("projects", "category", "TEXT");
  await addColumnIfMissing("projects", "template", "TEXT");
  await addColumnIfMissing("projects", "pricingModel", "TEXT");
  await addColumnIfMissing("projects", "estimatedCost", "REAL");
  await addColumnIfMissing("projects", "assignedStaff", "TEXT");

  // Samples migrations (New Div 6 Fields)
  await addColumnIfMissing("samples", "sampleNo", "TEXT");
  await addColumnIfMissing("samples", "location", "TEXT");
  await addColumnIfMissing("samples", "surfaceType", "TEXT");
  await addColumnIfMissing("samples", "itemDescription", "TEXT");
  await addColumnIfMissing("samples", "materialType", "TEXT");
  await addColumnIfMissing("samples", "assessmentStatus", "TEXT");
  await addColumnIfMissing("samples", "friability", "TEXT");
  await addColumnIfMissing("samples", "materialCondition", "TEXT");
  await addColumnIfMissing("samples", "deteriorationPotential", "TEXT");
  await addColumnIfMissing("samples", "activityLevel", "TEXT");
  await addColumnIfMissing("samples", "accessibility", "TEXT");
  await addColumnIfMissing("samples", "priorityLevel", "TEXT");
  await addColumnIfMissing("samples", "reinspectionSchedule", "TEXT");
  await addColumnIfMissing("samples", "approxQuantity", "TEXT");
  await addColumnIfMissing("samples", "controlRecommendation", "TEXT");
  
  // Legacy sample fields cleanup/sync
  await addColumnIfMissing("samples", "sampleId", "TEXT");
  await addColumnIfMissing("samples", "site", "TEXT");
  await addColumnIfMissing("samples", "area", "TEXT");
  await addColumnIfMissing("samples", "collector", "TEXT");
  await addColumnIfMissing("samples", "labReference", "TEXT");
  await addColumnIfMissing("samples", "locationX", "REAL");
  await addColumnIfMissing("samples", "locationY", "REAL");
  await addColumnIfMissing("samples", "customFields", "TEXT");

  // Files migrations
  const filesCols = await all("PRAGMA table_info(files)");
  const sampleIdCol = filesCols.find(c => c.name === 'sampleId');
  if (sampleIdCol && sampleIdCol.notnull === 1) {
    await run("CREATE TABLE files_new (id TEXT PRIMARY KEY, sampleId TEXT, name TEXT NOT NULL, type TEXT, size INTEGER, path TEXT NOT NULL, folderPath TEXT, uploadedBy TEXT, isOverlay INTEGER, overlayId TEXT, thumbnail TEXT, linkedSampleIds TEXT, createdAt TEXT DEFAULT (datetime('now')), FOREIGN KEY(sampleId) REFERENCES samples(id))");
    await run("INSERT INTO files_new SELECT id, sampleId, name, type, size, path, folderPath, uploadedBy, isOverlay, overlayId, thumbnail, linkedSampleIds, createdAt FROM files");
    await run("DROP TABLE files");
    await run("ALTER TABLE files_new RENAME TO files");
  }

  await addColumnIfMissing("files", "folderPath", "TEXT");
  await addColumnIfMissing("files", "uploadedBy", "TEXT");
  await addColumnIfMissing("files", "isOverlay", "INTEGER");
  await addColumnIfMissing("files", "overlayId", "TEXT");
  await addColumnIfMissing("files", "thumbnail", "TEXT");
  await addColumnIfMissing("files", "linkedSampleIds", "TEXT");

  await addColumnIfMissing("users", "name", "TEXT");
  await addColumnIfMissing("users", "email", "TEXT");
  await addColumnIfMissing("users", "lastActive", "TEXT");

  await addColumnIfMissing("shares", "name", "TEXT");
  await addColumnIfMissing("shares", "type", "TEXT");
  await addColumnIfMissing("shares", "targetId", "TEXT");
  await addColumnIfMissing("shares", "accessType", "TEXT");
  await addColumnIfMissing("shares", "accessScope", "TEXT");
  await addColumnIfMissing("shares", "password", "TEXT");
  await addColumnIfMissing("shares", "allowedEmails", "TEXT");
  await addColumnIfMissing("shares", "createdBy", "TEXT");
  await addColumnIfMissing("shares", "expiresAt", "TEXT");
  await addColumnIfMissing("shares", "views", "INTEGER DEFAULT 0");
};

export const getProjects = async () => {
  const rows = await all("SELECT * FROM projects ORDER BY createdAt DESC");
  return rows.map(r => ({ ...r, assignedStaff: r.assignedStaff ? JSON.parse(r.assignedStaff) : [] }));
};

export const getProject = async (id) => {
  const rows = await all("SELECT * FROM projects WHERE id = ?", [id]);
  const project = rows[0] || null;
  if (project) {
    project.assignedStaff = project.assignedStaff ? JSON.parse(project.assignedStaff) : [];
  }
  return project;
};

export const createProject = async (project) => {
  const id = project.id || Math.random().toString(36).substring(2, 11);
  await run(
    `INSERT INTO projects (id, jobNumber, name, client, site, status, category, template, pricingModel, estimatedCost, startDate, dueDate, description, manager, assignedStaff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      project.jobNumber,
      project.name,
      project.client,
      project.site,
      project.status || 'active',
      project.category,
      project.template,
      project.pricingModel,
      project.estimatedCost,
      project.startDate,
      project.dueDate,
      project.description,
      project.manager,
      JSON.stringify(project.assignedStaff || [])
    ]
  );
  return getProject(id);
};

export const updateProject = async (id, fields) => {
  const project = await getProject(id);
  if (!project) return;

  const data = { ...fields };
  if (data.assignedStaff) {
    data.assignedStaff = JSON.stringify(data.assignedStaff);
  }

  const keys = Object.keys(data);
  if (!keys.length) return;

  if (fields.name && fields.name !== project.name) {
    await run("UPDATE samples SET site = ? WHERE site = ?", [fields.name, project.name]);
    const oldPathPrefix = `/Projects/${project.name}/`;
    const newPathPrefix = `/Projects/${fields.name}/`;
    await run(
      `UPDATE files SET folderPath = REPLACE(folderPath, ?, ?) WHERE folderPath LIKE ?`,
      [oldPathPrefix, newPathPrefix, `${oldPathPrefix}%`]
    );
  }

  const setters = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => data[key]);
  await run(`UPDATE projects SET ${setters}, updatedAt = (datetime('now')) WHERE id = ?`, [...values, id]);
  return getProject(id);
};

export const deleteProject = async (id) => {
  const project = await getProject(id);
  if (!project) return;
  await run("DELETE FROM samples WHERE site = ?", [project.name]);
  await run("DELETE FROM files WHERE folderPath LIKE ?", [`/Projects/${project.name}%`]);
  await run("DELETE FROM projects WHERE id = ?", [id]);
};

export const getSamples = async () => {
  const samples = await all("SELECT * FROM samples ORDER BY createdAt DESC");
  const files = await all("SELECT * FROM files ORDER BY createdAt DESC");
  const filesBySample = new Map();
  files.forEach((file) => {
    if (!filesBySample.has(file.sampleId)) {
      filesBySample.set(file.sampleId, []);
    }
    filesBySample.get(file.sampleId).push(file);
  });

  return samples.map((sample) => ({
    ...sample,
    files: (filesBySample.get(sample.id) || []).map((file) => ({
      ...file,
      url: `/api/files/${file.path}`
    }))
  }));
};

export const getSample = async (id) => {
  const samples = await all("SELECT * FROM samples WHERE id = ?", [id]);
  if (!samples.length) return null;
  const files = await all("SELECT * FROM files WHERE sampleId = ? ORDER BY createdAt DESC", [id]);
  return {
    ...samples[0],
    files: files.map((file) => ({ ...file, url: `/api/files/${file.path}` }))
  };
};

export const createSample = async (sample) => {
  const id = sample.id || Math.random().toString(36).substring(2, 11);
  await run(
    `INSERT INTO samples (
      id, sampleNo, location, surfaceType, itemDescription, materialType, sampleType, collectionDate, assessmentStatus,
      friability, materialCondition, deteriorationPotential, activityLevel, accessibility, priorityLevel, reinspectionSchedule,
      approxQuantity, controlRecommendation, collector, asbestosType, concentration, labName, labReference, notes, locationX, locationY, customFields,
      sampleId, site, area, status, riskLevel
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  , [
    id,
    sample.sampleNo,
    sample.location,
    sample.surfaceType,
    sample.itemDescription,
    sample.materialType,
    sample.sampleType,
    sample.collectionDate,
    sample.assessmentStatus,
    sample.friability,
    sample.materialCondition,
    sample.deteriorationPotential,
    sample.activityLevel,
    sample.accessibility,
    sample.priorityLevel,
    sample.reinspectionSchedule,
    sample.approxQuantity,
    sample.controlRecommendation,
    sample.collector,
    sample.asbestosType,
    sample.concentration,
    sample.labName,
    sample.labReference,
    sample.notes,
    sample.locationX,
    sample.locationY,
    sample.customFields,
    sample.sampleNo, // Sync sampleId
    sample.location, // Sync site
    sample.itemDescription, // Sync area
    sample.assessmentStatus, // Sync status
    sample.priorityLevel // Sync riskLevel
  ]);
  return getSample(id);
};

export const addFile = async (file) => {
  await run(
    `INSERT INTO files (
      id, sampleId, name, type, size, path, folderPath, uploadedBy, isOverlay, overlayId, thumbnail, linkedSampleIds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  , [
    file.id,
    file.sampleId,
    file.name,
    file.type,
    file.size,
    file.path,
    file.folderPath,
    file.uploadedBy,
    file.isOverlay ? 1 : 0,
    file.overlayId,
    file.thumbnail,
    file.linkedSampleIds
  ]);
};

export const updateSample = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const setters = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => fields[key]);
  await run(`UPDATE samples SET ${setters} WHERE id = ?`, [...values, id]);
  return getSample(id);
};

export const clearAll = async () => {
  await run("DELETE FROM files");
  await run("DELETE FROM samples");
  await run("DELETE FROM shares");
  await run("DELETE FROM projects");
};

export const countUsers = async () => {
  const rows = await all("SELECT COUNT(*) as count FROM users");
  return rows[0]?.count || 0;
};

export const getUserByUsername = async (username) => {
  const rows = await all("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0] || null;
};

export const updateUserPassword = async (username, passwordHash) => {
  await run("UPDATE users SET passwordHash = ? WHERE username = ?", [passwordHash, username]);
};

export const createUser = async (user) => {
  await run(
    `INSERT INTO users (id, username, name, email, passwordHash, role, lastActive) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.username, user.name, user.email, user.passwordHash, user.role, user.lastActive]
  );
};

export const listUsers = async () => {
  return all("SELECT id, username, name, email, role, createdAt, lastActive FROM users ORDER BY createdAt DESC");
};

export const updateUserLastActive = async (id, lastActive) => {
  await run("UPDATE users SET lastActive = ? WHERE id = ?", [lastActive, id]);
};

export const updateUser = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const setters = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => fields[key]);
  await run(`UPDATE users SET ${setters} WHERE id = ?`, [...values, id]);
};

export const deleteUser = async (id) => {
  await run("DELETE FROM users WHERE id = ?", [id]);
};

export const createShare = async (share) => {
  await run(
    `INSERT INTO shares (
      token, name, type, targetId, accessType, accessScope, password, allowedEmails, createdBy, expiresAt, views
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      share.token,
      share.name,
      share.type,
      share.targetId,
      share.accessType,
      share.accessScope,
      share.password,
      share.allowedEmails,
      share.createdBy,
      share.expiresAt,
      share.views ?? 0
    ]
  );
};

export const getShare = async (token) => {
  const rows = await all("SELECT * FROM shares WHERE token = ?", [token]);
  return rows[0] || null;
};

export const listShares = async () => {
  return all("SELECT * FROM shares ORDER BY createdAt DESC");
};

export const deleteShare = async (token) => {
  await run("DELETE FROM shares WHERE token = ?", [token]);
};

export const listFiles = async () => {
  return all("SELECT * FROM files ORDER BY createdAt DESC");
};

export const getFile = async (id) => {
  const rows = await all("SELECT * FROM files WHERE id = ?", [id]);
  return rows[0] || null;
};

export const updateFile = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const setters = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => fields[key]);
  await run(`UPDATE files SET ${setters} WHERE id = ?`, [...values, id]);
};

export const deleteFile = async (id) => {
  await run("DELETE FROM files WHERE id = ?", [id]);
};
