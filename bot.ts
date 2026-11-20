import { App } from "@slack/bolt";
import process from "node:process";
const botToken = process.env.BOT_TOKEN;
const appToken = process.env.APP_TOKEN;
const password: string = process.env.PASSWORD ?? "";
const nation=`democratic_republic_of_hack_club`;

if ( !botToken ) { // Missing env safeguard
  throw new Error("Missing environment variables. Check for your bot & app tokens.");
}

const app = new App({
  token: botToken,
  appToken,
  socketMode: true,
});

async function getNation() {
    let response;
    response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);


}

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
    })
}

Deno.cron("daily issues", "0 0 * * *", async () => {
    await fetchDailyIssues();
});
