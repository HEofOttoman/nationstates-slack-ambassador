// import process from node:process;
// const BOT_TOKEN = process.env.BOT_TOKEN;

const nation=`democratic_republic_of_hack_club`;



async function getNation() {
    let response;
    response = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`);


}

async function respond() {
    let request;
    request = await fetch(`https://example.com`);
}
