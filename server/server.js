import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initDb, getProjects, getProject, createProject, updateProject, deleteProject, getSamples, getSample, createSample, addFile, updateSample, clearAll, countUsers, getUserByUsername, createUser, listUsers, createShare, getShare, listShares, deleteShare, listFiles, updateFile, deleteFile, updateUserLastActive, updateUser, deleteUser, getFile, updateUserPassword } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const DEFAULT_ADMIN_USER = process.env.ADMIN_USER || "admin";
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20
  }
});

const maybeUpload = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    upload.array("files")(req, res, next);
    return;
  }
  next();
};

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/files", express.static(uploadsDir));

// Serve static frontend files.
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// In production, we serve the built files from dist/
// In development, we typically use the Vite dev server on port 5173,
// but the backend can still serve index.html as a fallback.
if (process.env.NODE_ENV === "production" && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
} else {
  // In development, only serve uploads/ and other specific assets through Express.
  // The Vite dev server handles the frontend.
}

const issueToken = (user) =>
  jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

const authRequired = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Projects API
app.get("/api/projects", authRequired(["admin", "inspector", "viewer"]), async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to load projects." });
  }
});

app.get("/api/projects/:id", authRequired(["admin", "inspector", "viewer"]), async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to load project." });
  }
});

app.post("/api/projects", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    const body = req.body || {};
    const project = {
      id: body.id || randomUUID(),
      name: body.name || "Unnamed Project",
      client: body.client || "",
      site: body.site || "",
      status: body.status || "active",
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || null,
      description: body.description || "",
      manager: body.manager || req.user?.username || "Admin"
    };
    await createProject(project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to create project." });
  }
});

app.patch("/api/projects/:id", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    await updateProject(req.params.id, req.body || {});
    const updated = await getProject(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update project." });
  }
});

app.delete("/api/projects/:id", authRequired(["admin"]), async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  try {
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    await updateUserLastActive(user.id, new Date().toISOString());
    res.json({ token: issueToken(user), user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Failed to login." });
  }
});

app.post("/api/users", authRequired(["admin"]), async (req, res) => {
  const { username, password, role, name, email } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!["admin", "inspector", "viewer", "external"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  try {
    const existing = await getUserByUsername(username);
    if (existing) return res.status(409).json({ error: "User exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: randomUUID(),
      username,
      name: name || username,
      email: email || null,
      passwordHash,
      role,
      lastActive: new Date().toISOString()
    };
    await createUser(newUser);
    const { passwordHash: _, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

app.get("/api/users", authRequired(["admin"]), async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      email: user.email || "",
      role: user.role,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to load users." });
  }
});

app.patch("/api/users/:id", authRequired(["admin"]), async (req, res) => {
  try {
    const updates = {};
    if (req.body?.name) updates.name = req.body.name;
    if (req.body?.email) updates.email = req.body.email;
    if (req.body?.role) {
      if (!["admin", "inspector", "viewer", "external"].includes(req.body.role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      updates.role = req.body.role;
    }
    if (req.body?.password) {
      updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    }
    await updateUser(req.params.id, updates);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

app.delete("/api/users/:id", authRequired(["admin"]), async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/shares", authRequired(["admin", "inspector"]), async (req, res) => {
  const {
    name,
    accessType,
    accessScope,
    password,
    allowedEmails,
    createdBy,
    expiresAt,
    type,
    targetId
  } = req.body || {};

  if (!name || !accessType) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (type === "sample" && targetId) {
    const sample = await getSample(targetId);
    if (!sample) return res.status(404).json({ error: "Not found" });
  }

  try {
    const token = randomUUID();
    await createShare({
      token,
      name,
      type: type || null,
      targetId: targetId || null,
      accessType,
      accessScope: accessScope || "public",
      password: accessScope === "password" ? password || null : null,
      allowedEmails: Array.isArray(allowedEmails) ? JSON.stringify(allowedEmails) : null,
      createdBy: createdBy || req.user?.username || "System",
      expiresAt: expiresAt || null,
      views: 0
    });
    res.status(201).json({ token, url: `/share.html?token=${token}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to create share link." });
  }
});

app.get("/api/shares", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    const shares = await listShares();
    res.json(
      shares.map((share) => ({
        id: share.token,
        name: share.name,
        url: `/share.html?token=${share.token}`,
        accessType: share.accessType,
        accessScope: share.accessScope,
        password: share.password,
        allowedEmails: share.allowedEmails ? JSON.parse(share.allowedEmails) : undefined,
        createdBy: share.createdBy,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        views: share.views || 0
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to load shares." });
  }
});

app.delete("/api/shares/:token", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    await deleteShare(req.params.token);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete share." });
  }
});

app.get("/api/shares/:token", async (req, res) => {
  try {
    const share = await getShare(req.params.token);
    if (!share) return res.status(404).json({ error: "Not found" });
    if (share.type === "sample" && share.targetId) {
      const sample = await getSample(share.targetId);
      if (!sample) return res.status(404).json({ error: "Not found" });
      res.json({ type: "sample", sample });
      return;
    }
    res.json({
      type: "share",
      share: {
        id: share.token,
        name: share.name,
        accessType: share.accessType,
        accessScope: share.accessScope,
        createdBy: share.createdBy,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load share." });
  }
});

app.get("/api/samples", authRequired(["admin", "inspector", "viewer", "external"]), async (req, res) => {
  try {
    const samples = await getSamples();
    res.json(samples.map(normalizeSampleForClient));
  } catch (err) {
    res.status(500).json({ error: "Failed to load samples." });
  }
});

app.get("/api/samples/:id", authRequired(["admin", "inspector", "viewer", "external"]), async (req, res) => {
  try {
    const sample = await getSample(req.params.id);
    if (!sample) return res.status(404).json({ error: "Not found" });
    res.json(normalizeSampleForClient(sample));
  } catch (err) {
    res.status(500).json({ error: "Failed to load sample." });
  }
});

app.post("/api/samples", authRequired(["admin", "inspector"]), maybeUpload, async (req, res) => {
  try {
    const body = req.body;
    const sample = {
      id: body.sampleId || body.id || `S-${Date.now().toString().slice(-6)}`,
      sampleId: body.sampleId || body.id || `S-${Date.now().toString().slice(-6)}`,
      site: body.site || "",
      area: body.area || "",
      equipment: body.equipment || body.equipmentName || "",
      collectionDate: body.collectionDate,
      equipmentName: body.equipmentName || body.equipment || "",
      sampleType: body.sampleType,
      status: body.status,
      asbestosType: body.asbestosType,
      concentration: body.concentration ? Number(body.concentration) : null,
      riskLevel: body.riskLevel,
      collectorName: body.collectorName || body.collector || "",
      collector: body.collector || body.collectorName || "",
      labName: body.labName,
      labReference: body.labReference || body.cocRef || null,
      cocRef: body.cocRef || null,
      latitude: body.latitude ? Number(body.latitude) : null,
      longitude: body.longitude ? Number(body.longitude) : null,
      locationX: body.locationX ? Number(body.locationX) : null,
      locationY: body.locationY ? Number(body.locationY) : null,
      notes: body.notes || "",
      customFields: body.customFields ? JSON.stringify(body.customFields) : null
    };

    await createSample(sample);

    const files = req.files || [];
    for (const file of files) {
      await addFile({
        id: randomUUID(),
        sampleId: sample.id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: file.filename,
        folderPath: body.folderPath || null,
        uploadedBy: body.uploadedBy || null,
        isOverlay: body.isOverlay === "true",
        overlayId: body.overlayId || null,
        thumbnail: body.thumbnail || null,
        linkedSampleIds: body.linkedSampleIds ? JSON.stringify(body.linkedSampleIds) : null
      });
    }

    const saved = await getSample(sample.id);
    res.status(201).json(normalizeSampleForClient(saved));
  } catch (err) {
    console.error('[ERROR] Failed to create sample:', err);
    res.status(500).json({ error: "Failed to create sample." });
  }
});

app.post("/api/samples/:id/files", authRequired(["admin", "inspector"]), maybeUpload, async (req, res) => {
  try {
    const sample = await getSample(req.params.id);
    if (!sample) return res.status(404).json({ error: "Not found" });

    const files = req.files || [];
    for (const file of files) {
      await addFile({
        id: randomUUID(),
        sampleId: sample.id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: file.filename,
        folderPath: req.body?.folderPath || null,
        uploadedBy: req.body?.uploadedBy || null,
        isOverlay: req.body?.isOverlay === "true",
        overlayId: req.body?.overlayId || null,
        thumbnail: req.body?.thumbnail || null,
        linkedSampleIds: req.body?.linkedSampleIds ? JSON.stringify(req.body.linkedSampleIds) : null
      });
    }

    const saved = await getSample(sample.id);
    res.status(201).json(normalizeSampleForClient(saved));
  } catch (err) {
    console.error('[ERROR] Failed to upload sample files:', err);
    res.status(500).json({ error: "Failed to upload files." });
  }
});

app.patch("/api/samples/:id", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    const fields = normalizeSampleUpdates(req.body || {});
    await updateSample(req.params.id, fields);
    const saved = await getSample(req.params.id);
    if (!saved) return res.status(404).json({ error: "Not found" });
    res.json(normalizeSampleForClient(saved));
  } catch (err) {
    res.status(500).json({ error: "Failed to update sample." });
  }
});

app.get("/api/files", authRequired(["admin", "inspector", "viewer", "external"]), async (req, res) => {
  try {
    const files = await listFiles();
    res.json(files.map(normalizeFileForClient));
  } catch (err) {
    res.status(500).json({ error: "Failed to load files." });
  }
});

app.post("/api/files", authRequired(["admin", "inspector"]), maybeUpload, async (req, res) => {
  try {
    const body = req.body || {};
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: "No files uploaded." });
    const saved = [];
    for (const file of files) {
      const record = {
        id: randomUUID(),
        sampleId: body.sampleId || null,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: file.filename,
        folderPath: body.folderPath || null,
        uploadedBy: body.uploadedBy || null,
        isOverlay: body.isOverlay === "true",
        overlayId: body.overlayId || null,
        thumbnail: body.thumbnail || null,
        linkedSampleIds: body.linkedSampleIds ? JSON.stringify(body.linkedSampleIds) : null
      };
      await addFile(record);
      saved.push(normalizeFileForClient({ ...record, createdAt: new Date().toISOString() }));
    }
    res.status(201).json(saved);
  } catch (err) {
    console.error('[ERROR] Failed to upload files:', err);
    res.status(500).json({ error: "Failed to upload files." });
  }
});

app.patch("/api/files/:id", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    const fields = normalizeFileUpdates(req.body || {});
    await updateFile(req.params.id, fields);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update file." });
  }
});

app.delete("/api/files/:id", authRequired(["admin", "inspector"]), async (req, res) => {
  try {
    const existing = await getFile(req.params.id);
    await deleteFile(req.params.id);
    if (existing?.path) {
      const filePath = path.join(uploadsDir, existing.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file." });
  }
});

app.post("/api/reset", authRequired(["admin"]), async (req, res) => {
  try {
    await clearAll();
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(uploadsDir, file));
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset data." });
  }
});

// Catch-all: in production, serve the frontend index.html from `dist/`
if (process.env.NODE_ENV === "production" && fs.existsSync(path.join(distDir, "index.html"))) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  // In development, let the Vite dev server (at port 5173) handle the frontend
  // But we can serve a helpful message if someone accidentally visits :3000
  app.get("/", (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1>AIMS Backend API</h1>
        <p>The backend is running on port 3000.</p>
        <p>For development, please visit: <a href="http://localhost:5173">http://localhost:5173</a></p>
        <p>The frontend dev server (Vite) must be running for this link to work.</p>
      </div>
    `);
  });
}

const startServer = async () => {
  await initDb();

  const ensureAdminUser = async () => {
    const count = await countUsers();
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
    if (count === 0) {
      await createUser({
        id: randomUUID(),
        username: DEFAULT_ADMIN_USER,
        passwordHash,
        role: "admin",
        name: "Administrator",
        email: "",
        lastActive: new Date().toISOString()
      });
      console.log(`Admin user created: ${DEFAULT_ADMIN_USER}`);
      return;
    }

    const existing = await getUserByUsername(DEFAULT_ADMIN_USER);
    if (existing) {
      await updateUserPassword(DEFAULT_ADMIN_USER, passwordHash);
      console.log(`Admin user password reset for: ${DEFAULT_ADMIN_USER}`);
    }
  };

  await ensureAdminUser();

  // Start server and handle common listen errors (e.g. port already in use)
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`\n[ERROR] Port ${PORT} is already in use. Another process is listening on this port.`);
      console.error("You can either: (1) stop the other process, (2) set a different PORT environment variable, or (3) change the port in server/.env.");
      console.error("To find the process on Windows: run `netstat -ano | findstr :3000` and then `taskkill /PID <pid> /F` or use PowerShell `Get-Process -Id <pid> | Stop-Process -Force`\n");
      process.exit(1);
    }
    console.error('[ERROR] Server error:', err);
    process.exit(1);
  });
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

function normalizeSampleForClient(sample) {
  const customFields = sample.customFields ? safeJsonParse(sample.customFields, {}) : {};
  const locationX = sample.locationX ?? sample.latitude;
  const locationY = sample.locationY ?? sample.longitude;
  return {
    id: sample.sampleId || sample.id,
    sampleId: sample.sampleId || sample.id,
    site: sample.site || "",
    area: sample.area || "",
    equipment: sample.equipment || sample.equipmentName || "",
    sampleType: sample.sampleType || "",
    collectionDate: sample.collectionDate || "",
    status: sample.status || "pending",
    riskLevel: sample.riskLevel || "medium",
    collector: sample.collector || sample.collectorName || "",
    asbestosType: sample.asbestosType || "",
    concentration: sample.concentration ?? undefined,
    labName: sample.labName || "",
    labReference: sample.labReference || sample.cocRef || "",
    notes: sample.notes || "",
    location: locationX !== null && locationY !== null ? { x: Number(locationX), y: Number(locationY) } : undefined,
    linkedFileIds: (sample.files || []).map((file) => file.id),
    customFields
  };
}

function normalizeSampleUpdates(body) {
  const fields = {};
  if ("sampleId" in body || "id" in body) fields.sampleId = body.sampleId || body.id;
  if ("site" in body) fields.site = body.site;
  if ("area" in body) fields.area = body.area;
  if ("equipment" in body) {
    fields.equipment = body.equipment;
    fields.equipmentName = body.equipment;
  }
  if ("collectionDate" in body) fields.collectionDate = body.collectionDate;
  if ("sampleType" in body) fields.sampleType = body.sampleType;
  if ("status" in body) fields.status = body.status;
  if ("riskLevel" in body) fields.riskLevel = body.riskLevel;
  if ("collector" in body) {
    fields.collector = body.collector;
    fields.collectorName = body.collector;
  }
  if ("asbestosType" in body) fields.asbestosType = body.asbestosType;
  if ("concentration" in body) fields.concentration = body.concentration;
  if ("labName" in body) fields.labName = body.labName;
  if ("labReference" in body) {
    fields.labReference = body.labReference;
    fields.cocRef = body.labReference;
  }
  if ("notes" in body) fields.notes = body.notes;
  if ("location" in body && body.location) {
    fields.locationX = body.location.x;
    fields.locationY = body.location.y;
  }
  if ("customFields" in body) fields.customFields = JSON.stringify(body.customFields || {});
  return fields;
}

function normalizeFileForClient(file) {
  const linkedSampleIds = file.linkedSampleIds ? safeJsonParse(file.linkedSampleIds, []) : [];
  const sizeNumber = typeof file.size === "number" ? file.size : Number(file.size || 0);
  return {
    id: file.id,
    name: file.name,
    type: file.type || "other",
    size: sizeNumber ? `${(sizeNumber / 1024 / 1024).toFixed(2)} MB` : "0 MB",
    uploadedBy: file.uploadedBy || "System",
    uploadedAt: file.createdAt || new Date().toISOString(),
    url: `/api/files/${file.path}`,
    thumbnail: file.thumbnail || undefined,
    isOverlay: Boolean(file.isOverlay),
    overlayId: file.overlayId || undefined,
    linkedSampleIds,
    folderPath: file.folderPath || "/Projects"
  };
}

function normalizeFileUpdates(body) {
  const fields = {};
  if ("folderPath" in body) fields.folderPath = body.folderPath;
  if ("uploadedBy" in body) fields.uploadedBy = body.uploadedBy;
  if ("isOverlay" in body) fields.isOverlay = body.isOverlay ? 1 : 0;
  if ("overlayId" in body) fields.overlayId = body.overlayId;
  if ("thumbnail" in body) fields.thumbnail = body.thumbnail;
  if ("linkedSampleIds" in body) fields.linkedSampleIds = JSON.stringify(body.linkedSampleIds || []);
  if ("sampleId" in body) fields.sampleId = body.sampleId;
  return fields;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
