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
let autologin: string | null = 'default';

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
        TYPE?: string;
        MOTTO?: string;
        CATEGORY?: string;
        UNSTATUS?: string;
        ENDORSEMENTS?: string;
        ISSUES_ANSWERED?: string;
        REGION?: string;
        POPULATION?: string;
        TAX?: string;
        ANIMAL?: string;
        CURRENCY?: string;

        FLAG?: string;
    }
// ? fixed, marks as optional 
}

async function getNation(): Promise<nationStates| null> { // dodgy comment
    try {
        const response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);
        const body= response.text()
        // console.log(await body);
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
    await respond(
        { text: `__*#${JSON.stringify(payload.NATION.NAME)}*__\n 
        *Type*: ${JSON.stringify(payload.NATION.TYPE)} \n 
        *Category*: ${JSON.stringify(payload.NATION.CATEGORY)}
        *Motto*: ${JSON.stringify(payload.NATION.MOTTO)}
        *UN Status*: ${JSON.stringify(payload.NATION.UNSTATUS)}
        *Issues Answered*: ${JSON.stringify(payload.NATION.ISSUES_ANSWERED)}
        *Region*: ${JSON.stringify(payload.NATION.REGION)}
        *Population*: ${JSON.stringify(payload.NATION.POPULATION)}
        *Tax*: ${JSON.stringify(payload.NATION.TAX)}
        *Flag*: ${String(payload.NATION.FLAG)}
        *Currency*: ${JSON.stringify(payload.NATION.CURRENCY)}`,
        blocks: [
        /*
        {"type": "image", "title": { "type": "plain_text", "text": `Flag of ${String(payload.NATION.NAME)}`}, "image_url": String(payload.NATION.FLAG), "alt_text": `Flag of ${String(payload.NATION.NAME)}` },
        {
            "type": "markdown",
            "text": `#${JSON.stringify(payload.NATION.NAME)}
            *Type*: ${JSON.stringify(payload.NATION.TYPE)} 
            *Category*: ${JSON.stringify(payload.NATION.CATEGORY)}
            *Motto*: ${JSON.stringify(payload.NATION.MOTTO)}
            *UN Status*: ${JSON.stringify(payload.NATION.UNSTATUS)}
            *Issues Answered*: ${JSON.stringify(payload.NATION.ISSUES_ANSWERED)}
            *Region*: ${JSON.stringify(payload.NATION.REGION)}
            *Population*: ${JSON.stringify(payload.NATION.POPULATION)}
            *Tax*: ${JSON.stringify(payload.NATION.TAX)}
            *Currency*: ${JSON.stringify(payload.NATION.CURRENCY)}`
        },*/
        ]
        }
    )
    }catch (error) {console.log(error);}
});

app.command("/national-notifs", async ({ command, ack, respond }) => {
    try{await ack();
        const notifs = await fetchNotifications();
        respond({text: notifs})
    } catch(error) {console.error(error)}
});

app.command("/national-issues", async ({command, ack, respond}) => {
    try {
        const issues = await fetchIssues();
        respond({text: issues})

    } catch (error) {   console.error(error);   }
})
// async function respond() {
//     let request;
//     request = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);
// }

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

async function fetchIssues() {
    // await login();

    const response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=issues`, {
        method: "GET",
        headers: {
            // "Authorisation": nation,
            // "Authorisation": userAgent, // confirmed to fail, delete next commit
            "User-Agent": userAgent,
            "X-Password": password,
        }
    });
    const issueBody = await response.text();
    console.log(response);
    return issueBody;
}

async function fetchNotifications() { //unread rn
    const notificationResponse = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=unread`, { 
        method: "GET",
        headers: {
            // "Authorisation": nation,
            "User-Agent": userAgent,
            "X-Password": password
        }
    });
    const body = await notificationResponse.text();
    // console.log(notificationResponse);
    console.log(body);
    console.log(notificationResponse.headers.get("X-Autologin"));
    return body;
}
// curl -H "X-Password: hunter2" -A "UserAgent Example" "https://www.nationstates.net/cgi-bin/api.cgi?nation=testlandia&q=unread"

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
        
        if (!loginResponse.ok) {
            console.log(`PIN failed with Error: ${loginResponse.status}, trying password`);
            await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=ping`, {
                method: "GET",
                headers: {
                    "User-Agent": userAgent,
                    "X-Password": password
                }
            })
            loginPin = loginResponse.headers.get("X-Pin") ?? '4';
            isLoggedIn = true;
            // throw new Error(`HTTP Error: ${loginResponse.status}`);
        }

        // autologin = loginResponse.headers.get("X-Autologin");
        // if (loginPin == loginResponse.headers.get("X-Pin")) {
            // return
        // } else {
            // loginPin = loginResponse.headers.get("X-Pin") ?? '4';
        // }
        // loginPin = loginResponse.headers.get("X-Pin") || '4';
        } catch (error) {   console.log(error);  }
    } else {
        return
    }
    // response
}

Deno.cron("daily issues", "0 0 * * *", async () => {
    // await fetchDailyIssues();
    await fetchIssues();
});

(async () => {
    await app.start();
    console.log("At your service!")
})();

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
