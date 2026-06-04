const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../middleware/auth');
const PlayerModel = require('../models/PlayerModel');
const pool = require('../../db');
const { Logger } = require('../utils/logger');

async function sendNewPlayerNotification(name, email) {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const apiKey     = process.env.RESEND_API_KEY;
        if (!adminEmail || !apiKey) return;

        const { Resend } = require('resend');
        const resend = new Resend(apiKey);
        await resend.emails.send({
            from: 'noreply@hispania210.com',
            to:   adminEmail,
            subject: `[Hispania 210] Nuevo jugador: ${name}`,
            html: `
                <div style="font-family:serif;max-width:500px;background:#0a0804;color:#d4c4a0;padding:32px;border:1px solid #c9a84c33;border-radius:6px;">
                    <h2 style="color:#c9a84c;font-size:1.3rem;margin-bottom:16px;">⚔️ Nuevo jugador en la beta</h2>
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p style="margin-top:16px;color:#7a6128;font-size:0.85rem;">hispania210.com</p>
                </div>
            `
        });
    } catch (err) {
        Logger.error(err, { context: 'sendNewPlayerNotification', email });
    }
}

const getClient = () => new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.OAUTH_CALLBACK_BASE}/api/auth/google/callback`
);

/**
 * GET /api/auth/google
 * Redirige al consent screen de Google.
 */
async function redirectToGoogle(req, res) {
    try {
        const client = getClient();
        const url = client.generateAuthUrl({
            access_type: 'online',
            scope: ['profile', 'email'],
            prompt: 'select_account'
        });
        res.redirect(url);
    } catch (err) {
        Logger.error(err, { endpoint: '/api/auth/google', method: 'GET' });
        res.redirect(`${process.env.FRONTEND_URL || ''}/?error=oauth`);
    }
}

/**
 * GET /api/auth/google/callback
 * Intercambia el code, busca o crea el player, emite JWT y redirige al mapa.
 */
async function handleGoogleCallback(req, res) {
    const { code, error } = req.query;

    if (error || !code) {
        return res.redirect(`${process.env.FRONTEND_URL || ''}/?error=cancelado`);
    }

    try {
        const client = getClient();

        // 1. Exchange code → tokens
        const { tokens } = await client.getToken(code);

        // 2. Verify id_token → profile
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { sub: googleId, email, name, given_name, family_name } = ticket.getPayload();

        // 3. Buscar cuenta OAuth existente
        const existing = await PlayerModel.FindOAuthAccount('google', googleId);

        let playerId;

        if (existing) {
            playerId = existing.player_id;
            Logger.action(`Login OAuth Google: player ${playerId}`, playerId);
        } else {
            // 4. Crear player nuevo en transacción
            const dbClient = await pool.connect();
            try {
                await dbClient.query('BEGIN');
                const username = `google_${googleId.slice(-10)}`;
                playerId = await PlayerModel.CreateOAuthPlayer(dbClient, {
                    username,
                    display_name: name,
                    first_name:   given_name ?? name,
                    last_name:    family_name ?? '',
                    email,
                    provider: 'google',
                    provider_id: googleId
                });
                await dbClient.query('COMMIT');
                Logger.action(`Registro OAuth Google: nuevo player ${playerId} (${email})`, playerId);
                sendNewPlayerNotification(name, email);
            } catch (err) {
                await dbClient.query('ROLLBACK');
                if (err.code === '23505') {
                    // Email ya registrado con otra cuenta de Google → multicuenta
                    Logger.action(`Intento multicuenta bloqueado: email ${email}`, null);
                    return res.redirect(`${process.env.FRONTEND_URL || ''}/?error=multicuenta`);
                }
                throw err;
            } finally {
                dbClient.release();
            }
        }

        // 5. Fetch player para JWT payload
        const player = await PlayerModel.GetPlayerById(playerId);
        if (!player) {
            return res.redirect('/login.html?error=oauth');
        }

        // 6. Generar JWT y setear cookie (igual que LoginService.Login)
        const token = generateToken({
            player_id:    player.player_id,
            username:     player.username,
            display_name: player.display_name,
            role:         player.role || 'player',
            capital_h3:   player.capital_h3 || null
        });

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });

        const frontend = process.env.FRONTEND_URL || '';
        res.redirect(`${frontend}/map`);

    } catch (err) {
        Logger.error(err, { endpoint: '/api/auth/google/callback', method: 'GET' });
        res.redirect(`${process.env.FRONTEND_URL || ''}/?error=oauth`);
    }
}

module.exports = { redirectToGoogle, handleGoogleCallback };
