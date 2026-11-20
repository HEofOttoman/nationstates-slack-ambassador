import { App } from "@slack/bolt";
import process from "node:process";
import "@std/dotenv/load"; // need otherwise "Missing environment variables. Check for your bot & app tokens." this is deprecated though
const botToken = process.env.BOT_TOKEN;
const appToken = process.env.APP_TOKEN;
const password: string = process.env.PASSWORD ?? "";
const nation=`democratic_republic_of_hack_club`;

if ( !botToken ) { // Missing env safeguard
  throw new Error("Missing environment variables. Check for your bot & app tokens.");
}

const app = new App({
  token: botToken,
  appToken: appToken,
  socketMode: true,
});

async function getNation() {
    let response;
    response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);

    // console.log(await response.text());
    console.log(response);
    return response;
}

app.command("/nationstates", async ({ command, ack, respond }) => {
    try{await ack();
    const payload = await getNation() ?? "error 🥀";
    await respond({ text: `${payload}` })
    }catch (error) {console.log(error);}
});

async function respond() {
    let request;
    request = await fetch(`https://example.com`);
}

async function respondToIssue() {
    let request;
    request = await fetch(
        `https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=issues`,    {
            method: "POST",
            headers: {
            "Authorisation": nation,
            "X-Password": password
        }
    });
    return request;
}

async function fetchDailyIssues() {
    await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=issues`, {
        method: "POST",
        headers: {
            "Authorisation": nation,
            "X-Password": password
        }
    });
}

async function fetchNotifications() {
    await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=unread`, { 
        method: "POST",
        headers: {
            "Authorisation": nation,
            "X-Password": password
        }
    });
}
// curl -H "X-Password: hunter2" -A "UserAgent Example" "https://www.nationstates.net/cgi-bin/api.cgi?nation=testlandia&q=unread"

async function sendMessage(channelId: string, message: string) {
    await app.client.chat.postMessage({
        channel: channelId,
        text: message
    });
};

async function reactToMessage(channel: string, emojiName: string, timestamp: string) {
    await app.client.reactions.add({
        channel: channel,
        name: emojiName,
        timestamp: timestamp
    })
}

async function readReactions(channel: string, timestamp: string) {
    await app.client.reactions.get({
        channel: channel,
        timestamp: timestamp
    });
}

async function login() {
    const response = await fetchNotifications();
    // response
}

Deno.cron("daily issues", "0 0 * * *", async () => {
    await fetchDailyIssues();
});

(async () => {
    await app.start();
    console.log("At your service!")
})();