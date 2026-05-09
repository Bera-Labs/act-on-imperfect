const { kv } = require('@vercel/kv');

const KEYS = {
  log: 'app:log',
  pending: 'app:pending',
  draft: 'app:draft',
  archive: 'app:archive'
};

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [log, pending, draft, archive] = await Promise.all([
        kv.get(KEYS.log),
        kv.get(KEYS.pending),
        kv.get(KEYS.draft),
        kv.get(KEYS.archive)
      ]);

      return res.status(200).json({
        log: normalizeArray(log),
        pending: normalizeArray(pending),
        draft: draft ?? null,
        archive: normalizeArray(archive)
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to read persisted state' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    try {
      await Promise.all([
        kv.set(KEYS.log, normalizeArray(body.log)),
        kv.set(KEYS.pending, normalizeArray(body.pending)),
        kv.set(KEYS.draft, body.draft ?? null),
        kv.set(KEYS.archive, normalizeArray(body.archive))
      ]);

      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to write persisted state' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
