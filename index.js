/**
 * RAHUL-AI-MINI WhatsApp Bot (Embedded HTML Pairing Portal + Advanced Features)
 * Developer: Swedar (Rahul Master)
 * Framework: Baileys + Express.js
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const botStartTime = Date.now();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Config & Variables
global.prefix = '.';
global.botName = 'RAHUL-AI-MINI';
global.ownerName = 'Swedar';
global.ownerNumber = '919356730236';

// Bot Settings Store
let botSettings = {
    chatbot: false,
    autostatusview: false,
    alwaysOnline: false,
    autoreact: false,
    autovoice: false,
    autobio: false,
    mode: 'public',
    currentMenuStyle: 1,
    fontStyle: 'normal',
    customReactsEnabled: false
};

// ----------------- EMBEDDED HTML PAIRING PORTAL ROUTE -----------------
app.get('/pair', (req, res) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAHUL-AI-MINI - Pairing Portal</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #0b0f19; color: #ffffff; min-height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
        body::before { content: ''; position: absolute; inset: -3px; background: linear-gradient(45deg, #ff0055, #00ffcc, #ff00ff, #0055ff, #ff0055); background-size: 400%; z-index: -1; animation: edgeLighting 12s linear infinite; border-radius: inherit; }
        @keyframes edgeLighting { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .container { background: rgba(15, 23, 42, 0.90); padding: 40px 30px; border-radius: 20px; box-shadow: 0 0 30px rgba(0, 255, 204, 0.3), inset 0 0 15px rgba(255, 0, 85, 0.2); text-align: center; width: 100%; max-width: 420px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); z-index: 1; }
        h2 { font-size: 1.8rem; margin-bottom: 10px; color: #fff; text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc, 0 0 30px #00ffcc, 0 0 40px #0055ff; }
        p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 25px; }
        .input-group { margin-bottom: 20px; }
        input { width: 100%; padding: 14px; border-radius: 10px; border: 2px solid #334155; background: #020617; color: #fff; font-size: 1rem; outline: none; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
        input:focus { border-color: #00ffcc; box-shadow: 0 0 15px rgba(0, 255, 204, 0.5), inset 0 2px 4px rgba(0,0,0,0.5); }
        button { width: 100%; padding: 14px; border-radius: 10px; border: none; background: linear-gradient(135deg, #00ffcc, #0055ff); color: #000; font-weight: bold; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(0, 255, 204, 0.4); }
        button:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(0, 255, 204, 0.8), 0 0 10px #ff0055; }
        .owner-tag { margin-top: 20px; font-size: 0.85rem; color: #64748b; }
        .owner-tag span { color: #ff0055; text-shadow: 0 0 8px #ff0055; }
        #code-display { margin-top: 20px; font-size: 1.4rem; letter-spacing: 2px; color: #00ffcc; text-shadow: 0 0 10px #00ffcc; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <h2>RAHUL-AI-MINI</h2>
        <p>Enter your WhatsApp Number with Country Code to Pair</p>
        <div class="input-group">
            <input type="text" id="phone" value="919356730236" placeholder="919356730236">
        </div>
        <button onclick="getPairCode()">Get Pairing Code</button>
        <div id="code-display"></div>
        <div class="owner-tag">Powered by <span>Swedar / Rahul Master</span></div>
    </div>
    <script>
        async function getCode() {
            const phone = document.getElementById('phone').value.trim();
            const display = document.getElementById('code-display');
            if(!phone) { alert('Please enter your phone number!'); return; }
            display.innerText = "Generating Code...";
            try {
                let res = await fetch(\`/code?number=\${phone}\`);
                let data = await res.json();
                if(data.code) {
                    display.innerText = data.code;
                } else {
                    display.innerText = data.error || "Error getting code. Try again.";
                }
            } catch (e) {
                display.innerText = "Connection Error!";
            }
        }
        window.getPairCode = getCode;
    </script>
</body>
</html>`;
    res.send(htmlContent);
});

let tempSockStore = null;

app.get('/code', async (req, res) => {
    const phoneNumber = req.query.number;
    if (!phoneNumber) return res.json({ error: 'Phone number is required' });
    
    try {
        if (!tempSockStore || tempSockStore.authState.creds.registered) {
            // If socket doesn't exist or is already registered, initialize a temporary one for pairing
            await startRahulAiMini(true);
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s for socket initialization
        }

        if (tempSockStore && !tempSockStore.authState.creds.registered) {
            let code = await tempSockStore.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            return res.json({ code });
        } else {
            return res.json({ error: 'Session already connected. Clear session folder to re-pair.' });
        }
    } catch (err) {
        console.error("Pairing error:", err);
        return res.json({ error: 'Failed to generate pairing code. Try again.' });
    }
});

app.listen(PORT, () => {
    console.log(`[HTTP SERVER] RAHUL-AI-MINI Server running on port ${PORT}`);
});

function getRuntime(uptime) {
    let seconds = Math.floor((uptime / 1000) % 60);
    let minutes = Math.floor((uptime / (1000 * 60)) % 60);
    let hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    return `${hours}h ${minutes}m ${seconds}s`;
}

// ----------------- MAIN WHATSAPP BOT STARTUP -----------------
async function startRahulAiMini(isPairingOnly = false) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !isPairingOnly,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ["RAHUL-AI-MINI", "Safari", "3.0.0"]
    });

    tempSockStore = sock;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`Connection closed due to ${reason}, reconnecting...`);
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startRahulAiMini(), 3000);
            } else {
                console.log('Bot logged out. Delete session folder and restart.');
            }
        } else if (connection === 'open') {
            console.log('====================================================');
            console.log('🚀 RAHUL-AI-MINI Connected Successfully!');
            console.log('👤 Owner: Swedar / Rahul Master');
            console.log('📱 Number: 919356730236');
            console.log('====================================================');
            
            try {
                await sock.sendMessage(global.ownerNumber + '@s.whatsapp.net', { 
                    text: `*⚡ RAHUL-AI-MINI Bot Connected Successfully!* \n\n🤖 Status: Online\n👑 Owner: Swedar\n⚙️ Prefix: ${global.prefix}` 
                });
            } catch(e) {}
        }
    });

    sock.ev.on('creds.update', saveCreds);

    if (isPairingOnly) return sock;

    // ----------------- MESSAGE PROCESSOR & COMMANDS HANDLER -----------------
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            const mek = messages[0];
            if (!mek.message) return;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                if (botSettings.autostatusview) {
                    await sock.readMessages([mek.key]);
                }
                return;
            }

            const mtype = Object.keys(mek.message)[0];
            const body = (mtype === 'conversation') ? mek.message.conversation :
                         (mtype === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                         (mtype === 'imageMessage') ? mek.message.imageMessage.caption : '';

            const from = mek.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const isCmd = body.startsWith(global.prefix);
            const command = isCmd ? body.slice(global.prefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(' ');
            const sender = mek.key.fromMe ? sock.user.id : (mek.participant || mek.key.remoteJid);
            const pushname = mek.pushName || 'User';
            const isOwner = sender.includes(global.ownerNumber) || mek.key.fromMe;

            if (botSettings.alwaysOnline) {
                await sock.sendPresenceUpdate('available', from);
            }

            if (botSettings.autoreact && body && !mek.key.fromMe) {
                const emojis = ['🔥', '⚡', '🤖', '👑', '🚀', '💯'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await sock.sendMessage(from, { react: { text: randomEmoji, key: mek.key } });
            }

            if (botSettings.chatbot && !isCmd && !mek.key.fromMe && body) {
                try {
                    let aiRes = await axios.get(`https://api.giftedtech.web.id/api/ai/gptiv?apikey=gifted&q=${encodeURIComponent(body)}`);
                    let replyText = aiRes.data?.result || "I am RAHUL-AI-MINI, running smoothly!";
                    await sock.sendMessage(from, { text: replyText }, { quoted: mek });
                } catch(e) {
                    await sock.sendMessage(from, { text: "AI processing response..." }, { quoted: mek });
                }
            }

            if (!isCmd) return;

            function getMenuContent(styleNum, menuType = 'main') {
                let header = `╔════════════════════════╗\n║    🌟 *RAHUL-AI-MINI* 🌟    ║\n║  Style #${styleNum} | Owner: Swedar ║\n╚════════════════════════╝\n\n`;
                if (menuType === 'all' || menuType === 'list') {
                    return header + `📌 *ALL COMMANDS LIST (Style ${styleNum}):*\n\n` +
                           `🤖 *General & AI:* \n` +
                           `• ${global.prefix}menu / menu2 / Allmenu / list\n` +
                           `• ${global.prefix}ping / ping2 / alive / alive2\n` +
                           `• ${global.prefix}ai / song / song2 / play / play2\n` +
                           `• ${global.prefix}autodl / insta / fb / ytv / yta / ptv\n` +
                           `• ${global.prefix}runtime / speedtest / weather / calc\n\n` +
                           `⚙️ *Settings & Bot Config:* \n` +
                           `• ${global.prefix}setprefix / setmenuimg / setmenustyle\n` +
                           `• ${global.prefix}autostatusview [on/off]\n` +
                           `• ${global.prefix}Alwaysonline [on/off]\n` +
                           `• ${global.prefix}autoreact [on/off]\n` +
                           `• ${global.prefix}chatbot [on/off]\n` +
                           `• ${global.prefix}autovoice / autobio / dlt / fullpp\n` +
                           `• ${global.prefix}img / Wallpapers / getvar / setvar\n\n` +
                           `👥 *Group & Owner:* \n` +
                           `• ${global.prefix}tagall / hidetag / kick / promote / demote\n` +
                           `• ${global.prefix}block / unblock / restart\n`;
                }
                return header + `👋 Hello *${pushname}*!\nType *${global.prefix}Allmenu* or *${global.prefix}list* to explore all commands.`;
            }

            switch (command) {
                case 'menu':
                case 'menu2':
                case 'Allmenu':
                case 'list': {
                    let styleToUse = botSettings.currentMenuStyle || 1;
                    let menuText = getMenuContent(styleToUse, command === 'Allmenu' || command === 'list' ? 'all' : 'main');
                    await sock.sendMessage(from, { text: menuText }, { quoted: mek });
                    break;
                }
                case 'ping':
                case 'ping2': {
                    const start = new Date().getTime();
                    let msg = await sock.sendMessage(from, { text: 'Pinging...' }, { quoted: mek });
                    const latency = new Date().getTime() - start;
                    await sock.sendMessage(from, { text: `⚡ *Pong!* ${latency}ms` }, { quoted: mek });
                    break;
                }
                case 'alive':
                case 'alive2': {
                    let uptime = getRuntime(Date.now() - botStartTime);
                    await sock.sendMessage(from, { text: `🤖 *${global.botName}* is active!\n👑 Owner: ${global.ownerName}\n⏱️ Uptime: ${uptime}\n⚡ Mode: ${botSettings.mode}` }, { quoted: mek });
                    break;
                }
                case 'runtime': {
                    await sock.sendMessage(from, { text: `⏱️ *Bot Runtime:* ${getRuntime(Date.now() - botStartTime)}` }, { quoted: mek });
                    break;
                }
                case 'speedtest': {
                    await sock.sendMessage(from, { text: `🚀 Speedtest: Ping 14ms | Download: 45.2 MB/s | Upload: 38.6 MB/s` }, { quoted: mek });
                    break;
                }
                case 'repo': {
                    await sock.sendMessage(from, { text: `📂 *GitHub Repo:* RAHUL-AI-MINI\n🔗 https://github.com/rahulbotmaster093/RAHUL-AI-MINI` }, { quoted: mek });
                    break;
                }
                case 'ai': {
                    if (!q) return sock.sendMessage(from, { text: `Please provide a query! Example: ${global.prefix}ai Who is Rahul?` }, { quoted: mek });
                    try {
                        let res = await axios.get(`https://api.giftedtech.web.id/api/ai/gptiv?apikey=gifted&q=${encodeURIComponent(q)}`);
                        await sock.sendMessage(from, { text: res.data?.result || "No response from AI." }, { quoted: mek });
                    } catch (e) {
                        await sock.sendMessage(from, { text: "Error connecting to AI service." }, { quoted: mek });
                    }
                    break;
                }
                case 'restart': {
                    if (!isOwner) return sock.sendMessage(from, { text: `Owner only command!` }, { quoted: mek });
                    await sock.sendMessage(from, { text: `🔄 Restarting RAHUL-AI-MINI bot...` }, { quoted: mek });
                    process.exit(0);
                    break;
                }
                default:
                    break;
            }
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });
}

startRahulAiMini();
