if (process.platform !== "win32") require("child_process").exec("npm install");

const color = require('ansi-colors');
console.log(`${color.yellow(`Starting bot, this can take a while..`)}`);
const fs = require('fs');

const version = Number(process.version.split('.')[0].replace('v', ''));
if (version < 16) {
  console.log(`${color.red(`[ERROR] Plex Tickets requires a NodeJS version of 16.9 or higher!`)}`)

  let logMsg = `\n\n[${new Date().toLocaleString()}] [ERROR] Plex Tickets requires a NodeJS version of 16.9 or higher!`;
  fs.appendFile("./logs.txt", logMsg, (e) => { 
    if(e) console.log(e);
  });

  process.exit()
}

const botVersion = require('./package.json');
let logMsg = `\n\n[${new Date().toLocaleString()}] [STARTING] Attempting to start the bot..\nNodeJS Version: ${process.version}\nBot Version: ${botVersion.version}`;
fs.appendFile("./logs.txt", logMsg, (e) => { 
  if(e) console.log(e);
});

const { Collection, Client, Discord, ActionRowBuilder, ButtonBuilder, GatewayIntentBits } = require('discord.js');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const client = new Client({ 
  restRequestTimeout: 60000,
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildPresences, 
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ] 
});

module.exports = client
require("./utils.js");

if(config.TicketTranscriptSettings.SaveInFolder && !fs.existsSync('./transcripts')) fs.mkdirSync('./transcripts');

// Error Handler
client.on('warn', async (error) => {
  console.log(error)
  console.log('\x1b[31m%s\x1b[0m', `[v${botVersion.version}] If you need any support, please create a ticket in our discord server and provide the logs.txt file\n\n`)

  let errorMsg = `\n\n[${new Date().toLocaleString()}] [WARN] [v${botVersion.version}]\n${error.stack}`;
  fs.appendFile("./logs.txt", errorMsg, (e) => { 
    if(e) console.log(e);
  });
})

client.on('error', async (error) => {
  console.log(error)
  console.log('\x1b[31m%s\x1b[0m', `[v${botVersion.version}] If you need any support, please create a ticket in our discord server and provide the logs.txt file\n\n`)

  let errorMsg = `\n\n[${new Date().toLocaleString()}] [ERROR] [v${botVersion.version}]\n${error.stack}`;
  fs.appendFile("./logs.txt", errorMsg, (e) => { 
    if(e) console.log(e);
  });
})

process.on('unhandledRejection', async (error) => {
  console.log(error)
  console.log('\x1b[31m%s\x1b[0m', `[v${botVersion.version}] If you need any support, please create a ticket in our discord server and provide the logs.txt file\n\n`)

  let errorMsg = `\n\n[${new Date().toLocaleString()}] [unhandledRejection] [v${botVersion.version}]\n${error.stack}`;
  fs.appendFile("./logs.txt", errorMsg, (e) => { 
    if(e) console.log(e);
  });
})

process.on('uncaughtException', async (error) => {
  console.log(error)
  console.log('\x1b[31m%s\x1b[0m', `[v${botVersion.version}] If you need any support, please create a ticket in our discord server and provide the logs.txt file\n\n`)

  let errorMsg = `\n\n[${new Date().toLocaleString()}] [uncaughtException] [v${botVersion.version}]\n${error.stack}`;
  fs.appendFile("./logs.txt", errorMsg, (e) => { 
    if(e) console.log(e);
  });
})
