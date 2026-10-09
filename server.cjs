const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Password hashing helpers
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Initialize SQLite DB
const db = new sqlite3.Database(path.join(__dirname, 'bills.db'), (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workOrderNo TEXT,
      contractorName TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE COLLATE NOCASE,
      passwordHash TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (!tableErr) {
        // Seed default account if it doesn't already exist
        const defaultEmail = 'amitkumar30072006@gmail.com';
        db.get('SELECT id FROM users WHERE email = ?', [defaultEmail], (queryErr, row) => {
          if (!row) {
            const defaultHash = hashPassword('Amit@3012');
            db.run('INSERT INTO users (email, passwordHash) VALUES (?, ?)', [defaultEmail, defaultHash], (insertErr) => {
              if (!insertErr) {
                console.log(`Default user seeded: ${defaultEmail}`);
              }
            });
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      partyCode TEXT,
      address TEXT,
      gstin TEXT,
      pan TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (contractorErr) => {
      if (!contractorErr) {
        db.get('SELECT COUNT(*) as count FROM contractors', [], (countErr, row) => {
          if (!countErr && row && row.count === 0) {
            db.run(
              'INSERT INTO contractors (name, partyCode, address, gstin, pan) VALUES (?, ?, ?, ?, ?)',
              [
                'M/S. R. ENTERPRISE',
                '',
                '109/3 COLLIN STREET-Gr. FLOOR KOLKATA- 700 016',
                '19BBRPS4179M1ZH',
                'BBRPS4179M'
              ]
            );
          }
        });
      }
    });
  }
});

// Save a bill (prevents duplicate workOrderNo records)
app.post('/api/bills', (req, res) => {
  const { workOrderNo, contractorName } = req.body;
  if (!workOrderNo) {
    return res.status(400).json({ error: 'Work Order No is required' });
  }

  db.get('SELECT id FROM bills WHERE workOrderNo = ?', [workOrderNo], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (existing) {
      return res.status(409).json({
        error: `A bill for "${workOrderNo}" is already saved!`,
        existingId: existing.id
      });
    }

    const dataString = JSON.stringify(req.body);
    db.run(
      'INSERT INTO bills (workOrderNo, contractorName, data) VALUES (?, ?, ?)',
      [workOrderNo, contractorName, dataString],
      function (runErr) {
        if (runErr) {
          return res.status(500).json({ error: runErr.message });
        }
        res.json({ id: this.lastID, message: 'Bill saved successfully!' });
      }
    );
  });
});

// Get all bills (includes workName extracted from bill data)
app.get('/api/bills', (req, res) => {
  db.all('SELECT id, workOrderNo, contractorName, data, createdAt FROM bills ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const formatted = rows.map((r) => {
      let workName = '';
      let totalAmount = '';
      try {
        const parsed = JSON.parse(r.data);
        workName = parsed.workName || '';
        if (Array.isArray(parsed.items)) {
          const sum = parsed.items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
          const hasGST = (parsed.taxType || '').includes('GST');
          const hasCess = (parsed.taxType || '').includes('Cess');
          const gst = hasGST ? sum * 0.18 : 0;
          const preCess = sum + gst;
          const cess = hasCess ? preCess * 0.01 : 0;
          totalAmount = (preCess + cess).toFixed(2);
        }
      } catch {}
      return {
        id: r.id,
        workOrderNo: r.workOrderNo,
        contractorName: r.contractorName,
        workName: workName,
        totalAmount: totalAmount,
        createdAt: r.createdAt
      };
    });
    res.json(formatted);
  });
});

// Get specific bill by ID
app.get('/api/bills/:id', (req, res) => {
  db.get('SELECT * FROM bills WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      row.data = JSON.parse(row.data);
      res.json(row);
    } else {
      res.status(404).json({ error: 'Bill not found' });
    }
  });
});

// Delete a bill by ID
app.delete('/api/bills/:id', (req, res) => {
  db.run('DELETE FROM bills WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Bill deleted successfully!' });
  });
});

// Update an existing bill
app.put('/api/bills/:id', (req, res) => {
  const { workOrderNo, contractorName } = req.body;
  const dataString = JSON.stringify(req.body);
  
  db.run(
    'UPDATE bills SET workOrderNo = ?, contractorName = ?, data = ?, createdAt = CURRENT_TIMESTAMP WHERE id = ?',
    [workOrderNo, contractorName, dataString, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: Number(req.params.id), message: 'Bill updated successfully!' });
    }
  );
});

// User Registration endpoint
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    if (user) {
      return res.status(409).json({ success: false, error: 'Account already exists with this email' });
    }

    const passwordHash = hashPassword(password);
    db.run('INSERT INTO users (email, passwordHash) VALUES (?, ?)', [normalizedEmail, passwordHash], function (insertErr) {
      if (insertErr) {
        return res.status(500).json({ success: false, error: 'Failed to create user account' });
      }
      res.json({ success: true, message: 'Account created successfully! You can now log in.' });
    });
  });
});

// User Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Database query error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email }
    });
  });
});

// Get all saved contractors
app.get('/api/contractors', (req, res) => {
  db.all('SELECT * FROM contractors ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add a new contractor
app.post('/api/contractors', (req, res) => {
  const { name, partyCode, address, gstin, pan } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Contractor name is required' });
  }

  db.run(
    'INSERT INTO contractors (name, partyCode, address, gstin, pan) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), partyCode || '', address || '', gstin || '', pan || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id: this.lastID,
        name: name.trim(),
        partyCode: partyCode || '',
        address: address || '',
        gstin: gstin || '',
        pan: pan || '',
        message: 'Contractor saved successfully!'
      });
    }
  );
});

// Delete a contractor
app.delete('/api/contractors/:id', (req, res) => {
  db.run('DELETE FROM contractors WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Contractor removed' });
  });
});

// Update a contractor
app.put('/api/contractors/:id', (req, res) => {
  const { name, partyCode, address, gstin, pan } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Contractor name is required' });
  }

  db.run(
    'UPDATE contractors SET name = ?, partyCode = ?, address = ?, gstin = ?, pan = ? WHERE id = ?',
    [name.trim(), partyCode || '', address || '', gstin || '', pan || '', req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id: Number(req.params.id),
        name: name.trim(),
        partyCode: partyCode || '',
        address: address || '',
        gstin: gstin || '',
        pan: pan || '',
        message: 'Contractor updated successfully!'
      });
    }
  );
});

// Serve static frontend assets in production (if built)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA client-side fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
