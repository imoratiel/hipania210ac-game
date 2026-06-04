'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const pool   = require('../../db');
const { Logger } = require('../utils/logger');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/bug-reports');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
});

class BugReportService {
    get uploadMiddleware() {
        return upload.single('image');
    }

    async List(req, res) {
        const { status, page = 1 } = req.query;
        const PER_PAGE = 20;
        const offset   = (parseInt(page) - 1) * PER_PAGE;

        const VALID_STATUSES = ['Nuevo', 'Pendiente de arreglo', 'Corregido', 'Descartado'];
        const statuses = status
            ? status.split(',').filter(s => VALID_STATUSES.includes(s))
            : ['Nuevo', 'Pendiente de arreglo', 'Corregido']; // Descartado oculto por defecto

        try {
            const { rows } = await pool.query(`
                SELECT
                    br.id, br.message, br.image_path, br.status, br.created_at,
                    p.display_name, p.username
                FROM bug_reports br
                LEFT JOIN players p ON p.player_id = br.player_id
                WHERE br.status = ANY($1::text[])
                ORDER BY
                    CASE br.status WHEN 'Nuevo' THEN 0 WHEN 'Pendiente de arreglo' THEN 1 ELSE 2 END,
                    br.created_at DESC
                LIMIT $2 OFFSET $3
            `, [statuses, PER_PAGE, offset]);

            const { rows: countRows } = await pool.query(
                `SELECT COUNT(*)::int AS total FROM bug_reports WHERE status = ANY($1::text[])`,
                [statuses]
            );

            return res.json({
                success: true,
                reports: rows,
                total: countRows[0].total,
                page: parseInt(page),
                perPage: PER_PAGE,
            });
        } catch (err) {
            Logger.error(err, { context: 'BugReportService.List' });
            return res.status(500).json({ success: false, message: 'Error al obtener reportes.' });
        }
    }

    async UpdateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const VALID = ['Nuevo', 'Pendiente de arreglo', 'Corregido', 'Descartado'];

        if (!VALID.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado no válido.' });
        }

        try {
            const { rowCount } = await pool.query(
                `UPDATE bug_reports SET status = $1 WHERE id = $2`,
                [status, id]
            );
            if (rowCount === 0) return res.status(404).json({ success: false, message: 'Reporte no encontrado.' });
            Logger.action(`Bug report ${id} → ${status}`, req.user.player_id);
            return res.json({ success: true });
        } catch (err) {
            Logger.error(err, { context: 'BugReportService.UpdateStatus', id });
            return res.status(500).json({ success: false, message: 'Error al actualizar estado.' });
        }
    }

    async Submit(req, res) {
        const player_id = req.user?.player_id ?? null;
        const { message } = req.body;
        const image_path = req.file ? `/bug-reports/${req.file.filename}` : null;

        if (!message?.trim() && !image_path) {
            return res.status(400).json({ success: false, message: 'Añade una descripción o una captura de pantalla.' });
        }

        try {
            await pool.query(
                `INSERT INTO bug_reports (player_id, message, image_path) VALUES ($1, $2, $3)`,
                [player_id, message?.trim() || '', image_path]
            );
            Logger.action(`Bug report recibido de player ${player_id}`, player_id);
            return res.json({ success: true });
        } catch (err) {
            Logger.error(err, { context: 'BugReportService.Submit', player_id });
            return res.status(500).json({ success: false, message: 'Error al guardar el reporte.' });
        }
    }
}

module.exports = new BugReportService();
