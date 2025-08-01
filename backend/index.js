require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ status: 'ok' }));

app.post('/todos', async (req, res) => {
  const { title, description, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const result = await db.query(
      `INSERT INTO todos(title, description, due_date)
       VALUES($1,$2,$3) RETURNING *`,
      [title, description || '', due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/todos', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.patch('/todos/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const curr = await db.query('SELECT completed FROM todos WHERE id=$1', [id]);
    if (curr.rowCount === 0) return res.status(404).json({ error: 'not found' });
    const newStatus = !curr.rows[0].completed;
    const updated = await db.query(
      'UPDATE todos SET completed=$1 WHERE id=$2 RETURNING *',
      [newStatus, id]
    );
    res.json(updated.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.query('DELETE FROM todos WHERE id=$1 RETURNING *', [id]);
    if (deleted.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
