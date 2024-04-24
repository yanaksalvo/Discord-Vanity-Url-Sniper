"use strict"
const tls = require("tls");
const WebSocket = require("ws");
const extractJsonFromString = require("extract-json-from-string");

let vanity;
const guilds = {};

const connectWebSocket = () => {
    const websocket = new WebSocket("wss://gateway.discord.gg");

    websocket.onclose = (event) => {
        console.log(`ws connection closed ${event.reason} ${event.code}`);
        reconnectWebSocket();
    };

    websocket.onmessage = async (message) => {
        const { d, op, t } = JSON.parse(message.data);

        if (t === "GUILD_UPDATE") {
            const start = process.hrtime();
            const find = guilds[d.guild_id];
            if (find && find !== d.vanity_url_code) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write([
                    `PATCH /api/v7/guilds/1226516278316109845/vanity-url HTTP/1.1`, // Server Id
                    "Host: canary.discord.com",
                    `Authorization: V6FuvnnT79pESArZB9oqmZBDb-ZRNb8fYX0MpA`, // TOKEN
                    "Content-Type: application/json",
                    `Content-Length: ${requestBody.length}`,
                    "",
                    "",
                ].join("\r\n") + requestBody);
                const end = process.hrtime(start);
                const elapsedMillis = end[0] * 1000 + end[1] / 1e6;
                vanity = `${find} guild update `;
            }
        }
        else if (t === "GUILD_DELETE") {
            const find = guilds[d.id];
            if (find) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write([
                    `PATCH /api/v7/guilds/1226516278316109845/vanity-url HTTP/1.1`, // SERVER ID
                    "Host: canary.discord.com",
                    `Authorization: V6FuvnnT79pESArZB9oqmZBDb-ZRNb8fYX0MpA`, // TOKEN
                    "Content-Type: application/json",
                    `Content-Length: ${requestBody.length}`,
                    "",
                    "",
                ].join("\r\n") + requestBody);
                vanity = `${find} guild delete`;
            }
        }
        else if (t === "READY") {
            d.guilds.forEach((guild) => {
                if (guild.vanity_url_code) {
                    guilds[guild.id] = guild.vanity_url_code;
                }
                else {
                }
            });
            console.log(guilds);
        }

        if (op === 10) {
            websocket.send(JSON.stringify({
                op: 2,
                d: {
                    token: "KFdsdjSCCOBi-DVJbBRKcxuJ6cHs6FBPRo_SRM", // LİSTENER TOKEN
                    intents: 513 << 0,
                    properties: {
                        os: "linux",
                        browser: "firefox",
                        device: "1337",
                    },
                },
            }));
            setInterval(() => websocket.send(JSON.stringify({ op: 0, d: {}, s: null, t: "heartbeat" })), d.heartbeat_interval);
        }
        else if (op === 7)
            return process.exit();
    };

    websocket.onerror = (error) => {
        console.error(`WebSocket error: ${error.message}`);
    };

    return websocket;
};

const reconnectWebSocket = () => {
    console.log("Trying to reconnect WebSocket...");
    setTimeout(() => {
        connectWebSocket();
        
    }, 29);
};

const tlsOptions = {
    host: "canary.discord.com",
    port: 8443,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    handshakeTimeout: 1,
    servername: "canary.discord.com"
};

const tlsSocket = tls.connect(tlsOptions);

tlsSocket.on("data", async (data) => {
    const ext = await extractJsonFromString(data.toString());
    const find = ext.find((e) => e.code) || ext.find((e) => e.message);

    if (find) {
        console.log(find);

        const requestBody = JSON.stringify({
            content: `@everyone ${vanity} \n\`\`\`json\n${JSON.stringify(find)}\`\`\``,
        });

        const contentLength = Buffer.byteLength(requestBody);

        const requestHeader = [
            `POST /api/channels/1224749178207469609/messages HTTP/1.1`, // CHANNEL ID
            "Host: canary.discord.com",
            `Authorization: KFdsdjSCCOBi-DVJbBRKcxuJ6cHs6FBPRo_SRM`, // MESSAGE TOKEN
            "Content-Type: application/json",
            `Content-Length: ${contentLength}`,
            "",
            "",
        ].join("\r\n");

        const startRequest = process.hrtime();

        const request = requestHeader + requestBody;
        tlsSocket.write(request);

        const endRequest = process.hrtime(startRequest);
        const elapsedMillis = endRequest[0] * 1000 + endRequest[1] / 1e6;

        console.log(`Ms: ${elapsedMillis.toFixed(3)}ms`);
    }
});

tlsSocket.on("error", (error) => {
    console.log(`tls error`, error);
    return process.exit();
});

tlsSocket.on("end", (event) => {
    console.log("tls connection closed");
    return process.exit();
});

tlsSocket.on("secureConnect", () => {
    connectWebSocket();
    setInterval(() => {
        tlsSocket.write(["GET / HTTP/1.1", "Host: canary.discord.com", "", ""].join("\r\n"));
    }, 29);
});
