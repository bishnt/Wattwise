const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.json({ ok: true, resource: 'meter' });
});

module.exports = router;

