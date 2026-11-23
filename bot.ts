import { App } from "@slack/bolt";
import process from "node:process";
import "@std/dotenv/load"; // need otherwise "Missing environment variables. Check for your bot & app tokens." this is deprecated though
import { parse } from "jsr:@libs/xml";
const botToken = process.env.BOT_TOKEN;
const appToken = process.env.APP_TOKEN;
const password: string = process.env.PASSWORD ?? "";
const nation=`democratic_republic_of_hack_club`;
const userAgent = `${nation}, ${process.env.USER_AGENT}`;
let isLoggedIn = false;
let storedIssues = {};
let loginPin: string  = '4'; // placeholder number. dodgy null type guard
let autologin: string = 'default';

if ( !botToken ) { // Missing env safeguard
  throw new Error("Missing environment variables. Check for your bot & app tokens.");
}

export const app = new App({
  token: botToken,
  appToken: appToken,
  socketMode: true,
});

// response shape of one of many from one like https://www.nationstates.net/cgi-bin/api.cgi?nation=testlandia
interface nationStates{
    NATION: {
        NAME: string;
        TYPE: string;
        MOTTO: string;
        CATEGORY: string;
        UNSTATUS: string;
        ENDORSEMENTS: string;
        ISSUES_ANSWERED: string;
    }

}

async function getNation(): Promise<nationStates| null> { // dodgy comment
    try {
        const response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);
        const body= response.text()
        console.log(await body);
        const parsed: nationStates = parse(await body) as unknown as nationStates;
        return parsed;
    } catch (error) { 
        console.log("error fetching nation:", error);
        return null as unknown as nationStates;
    }
    // console.log(await response.text());
}

app.command("/nationstates", async ({ command, ack, respond }) => {
    try{await ack();
    const payload = await getNation() ?? {NATION: {NAME: "null"}};
    // const name = payload.NATION.NAME;
    await respond({ text: JSON.stringify(payload.NATION.NAME) })
    }catch (error) {console.log(error);}
});

async function respond() {
    let request;
    request = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);
}

async function respondToIssue(issueId: string, chosenOption: number) {
    let request;
    request = await fetch(
        // `https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=issue&id${issueId}`,    {
        `https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&c=issue&id=${issueId}&option=${chosenOption}`,    {
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
            // "Authorisation": nation,
            "Authorisation": userAgent,
            "X-Password": password
        }
    });
}

async function fetchNotifications() {
    const notificationResponse = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=unread`, { 
        method: "POST",
        headers: {
            // "Authorisation": nation,
            "User-Agent": userAgent,
            "X-Password": password
        }
    });
    console.log(notificationResponse.headers.get("X-Autologin"))

}
// curl -H "X-Password: hunter2" -A "UserAgent Example" "https://www.nationstates.net/cgi-bin/api.cgi?nation=testlandia&q=unread"

async function sendMessage(channelId: string, message: string) {
    await app.client.chat.postMessage({
        channel: channelId,
        text: message
    });
};

async function reactToMessage(channel: string, emojiName: string, timestamp: string) {
    const response = await app.client.reactions.add({
        channel: channel,
        name: emojiName,
        timestamp: timestamp
    })
    
    const reactions = await response;

}

async function readReactions(channel: string, timestamp: string) {
    const response = await app.client.reactions.get({
        channel: channel,
        timestamp: timestamp
    });
    const reactions = await response.message?.reactions || [];

    for (const reaction of reactions) {
        console.log(reaction.name, reaction.count)
    }
}

async function login() {
    if (isLoggedIn == false) {
        // const response = await fetchNotifications();
        // const response = await fetchNotifications();
        try {
        const loginResponse = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=ping`, { // ping request
            method: "GET",
            headers: {
            "User-Agent": userAgent,
            // "Authorisation": userAgent,
            // "X-Password": password
            "X-Pin": loginPin
        }});
        
        if (!loginResponse.ok) throw new Error(`HTTP Error: ${loginResponse.status}`);

        let autologin = loginResponse.headers.get("X-Autologin");
        if (loginPin == loginResponse.headers.get("X-Pin")) {
            return
        } else {
            loginPin = loginResponse.headers.get("X-Pin") ?? '4', console.log("error response is null");
        }
        // loginPin = loginResponse.headers.get("X-Pin") || '4';
        isLoggedIn = true;
        } catch (error) {   console.log(error);  }
    } else {
        return
    }
    // response
}

Deno.cron("daily issues", "0 0 * * *", async () => {
    await fetchDailyIssues();
});

(async () => {
    await app.start();
    console.log("At your service!")
})();