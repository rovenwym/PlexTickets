const { Collection, Client, Discord, Intents, AttachmentBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');
const yaml = require("js-yaml")
const fetch = require("node-fetch");
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const client = require("./index.js")
const color = require('ansi-colors');
const axios = require('axios')
let discordTranscripts;
if(config.TicketTranscriptSettings.TranscriptType === "HTML") discordTranscripts = require('discord-html-transcripts')

client.commands = new Collection();
client.slashCommands = new Collection();

const Enmap = require("enmap");
client.tickets = new Enmap({ name: "tickets", autoFetch: true, fetchAll: false });
client.globalStats = new Enmap({ name: "globalStats", autoFetch: true, fetchAll: false });
client.userStats = new Enmap({ name: "userStats", autoFetch: true, fetchAll: false }); // recently added
client.suggestions = new Enmap({ name: "suggestions", autoFetch: true, fetchAll: false });
client.suggestionUsers = new Enmap({ name: "suggestionUsers", autoFetch: true, fetchAll: false });
client.blacklistedUsers = new Enmap({ name: "blacklistedUsers", autoFetch: true, fetchAll: false });
client.reviews = new Enmap({ name: "reviews", autoFetch: true, fetchAll: false });
client.reviewsData = new Enmap({ name: "reviewsData", autoFetch: true, fetchAll: false });
client.ticketPanel = new Enmap({ name: "ticketPanel", autoFetch: true, fetchAll: false });
client.stripeInvoices = new Enmap({ name: "stripeInvoices", autoFetch: true, fetchAll: true });
client.paypalInvoices = new Enmap({ name: "paypalInvoices", autoFetch: true, fetchAll: true });
client.cooldowns = new Collection();

const StripeMain = require('stripe');
const stripe = StripeMain(config.StripeSettings.StripeSecretKey);
client.stripe = stripe;

const paypal = require("paypal-rest-sdk");
paypal.configure({
  'mode': 'live',
  'client_id': config.PayPalSettings.PayPalClientID,
  'client_secret': config.PayPalSettings.PayPalSecretKey
});
client.paypal = paypal;


//Slash Commands
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

if(config.SlashCommands) {
const slashCommands = [];
const commandFolders = fs.readdirSync('./slashCommands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./slashCommands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {

  const command = require(`./slashCommands/${folder}/${file}`);
if(command.enabled) {
  slashCommands.push(command.data.toJSON());
  console.log(`[SLASH COMMAND] ${file} loaded!`);
  client.slashCommands.set(command.data.name, command);
}
}
}

  var glob = require("glob")
  glob('./addons/**/*.js', function (err, files) {
    if (err) return console.error(err);
    files.forEach(file => {
      if(file.endsWith('.js')) {
        if(file.search("cmd_") >= 0 ) {
          let comm = require(file);
          slashCommands.push(comm.data.toJSON());
          client.slashCommands.set(comm.data.name, comm);
        } else {
          let event = require(file);
          event.run(client);
        }
      }
    });
  });

  client.on('ready', async () => {
    const rest = new REST({
        version: '10'
    }).setToken(config.Token);
    (async () => {
        try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, config.GuildID), {
                        body: slashCommands
                    },
                );
        } catch (error) {
            if (error) {
              console.log('\x1b[31m%s\x1b[0m', `[ERROR] Slash commands are unavailable because application.commands scope wasn't selected when inviting the bot. Please use the link below to re-invite your bot.`)
              console.log('\x1b[31m%s\x1b[0m', `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
            }
        }
    })();
  });
}
//




// Command and event handler etc..
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {

const props = require(`./commands/${folder}/${file}`);
if(props.help.enabled) {
console.log(`[COMMAND] ${file} loaded!`);
client.commands.set(props.help.name, props);
}
}
}


fs.readdir('./events/', (err, files) => {
  if (err) return console.error

  files.forEach(async (file) => {
    if(!file.endsWith('.js')) return;
      console.log(`[EVENT] ${file} loaded!`)

    const evt = require(`./events/${file}`);
    let evtName = file.split('.')[0];
    client.on(evtName, evt.bind(null, client));
  });
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // %%__USER__%%
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  
  let logMsg = `\n\n[${new Date().toLocaleString()}] [SLASH COMMAND] Command: ${interaction.commandName}, User: ${interaction.user.tag}`;
  fs.appendFile("./logs.txt", logMsg, (e) => { 
    if(e) console.log(e);
  });

  if(config.LogCommands) console.log(`${color.yellow(`[SLASH COMMAND] ${color.cyan(`${interaction.user.tag}`)} used ${color.cyan(`/${interaction.commandName}`)}`)}`);

  try {
      await command.execute(interaction, client);
  } catch (error) {
      if (error) console.error(error);
  }
});


// Get average ticket rating
exports.averageRating = function(client){
  const ratings = client.reviews.get(config.GuildID, 'ratings');
  const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
  var ratingArray = [];

  ratings.forEach(r => {
  let result = r.map(a => a.rating);
  ratingArray.push(parseInt(result));
  })

  let ratingToFixed = average(ratingArray).toFixed(1)
  if(ratingToFixed === "NaN") ratingToFixed = "0.0"

  return ratingToFixed;
  }

// Check config for errors
exports.checkConfig = function(client){
  let foundErrors = [];
  let guild = client.guilds.cache.get(config.GuildID)

  var reg=/^#([0-9a-f]{3}){1,2}$/i;
  if(reg.test(config.EmbedColors) === false)  {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] EmbedColors is not a valid HEX Color!`)
    foundErrors.push("EmbedColors is not a valid HEX Color!");
  }

  // Check for invalid channels
  if(!guild.channels.cache.get(config.TicketSettings.LogsChannelID)) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketSettings.LogsChannelID is not a valid channel!`)
    foundErrors.push("TicketSettings.LogsChannelID is not a valid channel!");
  }
  if(config.ArchiveTickets.Enabled && !guild.channels.cache.get(config.ArchiveTickets.TranscriptChannelID)) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] ArchiveTickets.TranscriptChannelID is not a valid channel!`)
    foundErrors.push("ArchiveTickets.TranscriptChannelID is not a valid channel!");
  }


  // Check if user has removed any buttons from the config
  if(!config.TicketButton1) {
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton1 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton1 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton2) {
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton2 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton2 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton3) { 
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton3 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton3 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton4) {
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton4 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton4 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton5) { 
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton5 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton5 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton6) { 
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton6 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton6 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton7) { 
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton7 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton7 removed from the config!");
    process.exit()
  }
  if(!config.TicketButton8) { 
    console.log('\x1b[31m%s\x1b[0m', `[ERROR] You have removed TicketButton8 from the config which means that the bot won't function properly, You can set Enabled to false if you want to disable it instead.`)
    foundErrors.push("TicketButton8 removed from the config!");
    process.exit()
  }

  // Check for invalid colors in all ticket buttons
  if(!["Blurple", "Gray", "Green", "Red"].includes(config.TicketButton1.ButtonColor)) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("TicketButton1.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.TicketButton2.ButtonColor) && config.TicketButton2.Enabled)  {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("TicketButton2.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.TicketButton3.ButtonColor) && config.TicketButton3.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("TicketButton3.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.TicketButton4.ButtonColor) && config.TicketButton4.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("TicketButton4.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.TicketButton5.ButtonColor) && config.TicketButton5.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("TicketButton5.ButtonColor is not a valid color!");
  }


  // Check for invalid colors in all suggestion buttons
  if(!["Blurple", "Gray", "Green", "Red"].includes(config.SuggestionUpvote.ButtonColor) && config.SuggestionSettings.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] SuggestionUpvote.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("SuggestionUpvote.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.SuggestionDownvote.ButtonColor) && config.SuggestionSettings.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] SuggestionDownvote.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("SuggestionDownvote.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.SuggestionResetvote.ButtonColor) && config.SuggestionSettings.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] SuggestionResetvote.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("SuggestionResetvote.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.SuggestionAccept.ButtonColor) && config.SuggestionSettings.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] SuggestionAccept.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("SuggestionAccept.ButtonColor is not a valid color!");
  }

  if(!["Blurple", "Gray", "Green", "Red"].includes(config.SuggestionDeny.ButtonColor) && config.SuggestionSettings.Enabled) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] SuggestionDeny.ButtonColor is not a valid color! Valid colors: Blurple, Gray, Green, Red (CASE SENSITIVE)`)
    foundErrors.push("SuggestionDeny.ButtonColor is not a valid color!");
  }

  // Check for invalid category channels in all ticket buttons
  if(guild.channels.cache.get(config.TicketButton1.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton1.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton2.Enabled && guild.channels.cache.get(config.TicketButton2.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton2.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton3.Enabled && guild.channels.cache.get(config.TicketButton3.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton3.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton4.Enabled && guild.channels.cache.get(config.TicketButton4.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton4.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton5.Enabled && guild.channels.cache.get(config.TicketButton5.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton5.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton6.Enabled && guild.channels.cache.get(config.TicketButton6.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton6.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton7.Enabled && guild.channels.cache.get(config.TicketButton7.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton7.TicketCategoryID is not a valid category!");
  }

  if(config.TicketButton8.Enabled && guild.channels.cache.get(config.TicketButton8.TicketCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.TicketCategoryID is not a valid category!`)
    foundErrors.push("TicketButton8.TicketCategoryID is not a valid category!");
  }



  // Check for invalid closed category channels in all ticket buttons
  if(config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton1.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton1.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton2.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton2.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton2.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton3.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton3.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton3.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton4.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton4.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton4.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton5.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton5.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton5.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton6.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton6.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton6.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton7.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton7.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton7.ClosedCategoryID is not a valid category!");
  }

  if(config.TicketButton8.Enabled && config.TicketSettings.ArchiveTickets && guild.channels.cache.get(config.TicketButton8.ClosedCategoryID)?.type !== 4) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.ClosedCategoryID is not a valid category!`)
    foundErrors.push("TicketButton8.ClosedCategoryID is not a valid category!");
  }

  // Check for category descriptions longer than 100 characters
  if(config.TicketButton1.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton1.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton2.Enabled && config.TicketButton2.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton2.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton3.Enabled && config.TicketButton3.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton3.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton4.Enabled && config.TicketButton4.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton4.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton5.Enabled && config.TicketButton5.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton5.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton6.Enabled && config.TicketButton6.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton6.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton7.Enabled && config.TicketButton7.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton7.Description can't be longer than 100 characters!");
  }

  if(config.TicketButton8.Enabled && config.TicketButton8.Description.length > 100) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.Description can't be longer than 100 characters!`)
    foundErrors.push("TicketButton8.Description can't be longer than 100 characters!");
  }


  // Check for invalid support roles in all ticket buttons
  config.TicketButton1.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton1.SupportRoles is not a valid role!");
    }
})

  if(config.TicketButton2.Enabled) config.TicketButton2.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton2.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton3.Enabled) config.TicketButton3.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton3.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton4.Enabled) config.TicketButton4.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton4.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton5.Enabled) config.TicketButton5.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton5.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton6.Enabled) config.TicketButton6.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton6.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton7.Enabled) config.TicketButton7.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton7.SupportRoles is not a valid role!");
  }
})

  if(config.TicketButton8.Enabled) config.TicketButton8.SupportRoles.forEach(roleid => {
    role = guild.roles.cache.get(roleid);
    if(!role) {
    console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.SupportRoles is not a valid role! (${roleid})`)
    foundErrors.push("TicketButton8.SupportRoles is not a valid role!");
  }
})

if(foundErrors.length > 0) {
let logMsg = `\n\n[${new Date().toLocaleString()}] [CONFIG ERROR(S)] \n${foundErrors.join("\n ").trim()}`;
fs.appendFile("./logs.txt", logMsg, (e) => { 
  if(e) console.log(e);
});
}
}

exports.duration = function(duration, useMilli = false){
  let remain = duration;
  let days = Math.floor(remain / (1000 * 60 * 60 * 24));
  remain = remain % (1000 * 60 * 60 * 24);
  let hours = Math.floor(remain / (1000 * 60 * 60));
  remain = remain % (1000 * 60 * 60);
  let minutes = Math.floor(remain / (1000 * 60));
  remain = remain % (1000 * 60);
  let seconds = Math.floor(remain / (1000));
  remain = remain % (1000);
  let milliseconds = remain;
  let time = {
      days,
      hours,
      minutes,
      seconds,
      milliseconds
  };
  let parts = []
  if (time.days) {
      let ret = time.days + ' Day'
      if (time.days !== 1) {
          ret += 's'
      }
      parts.push(ret)
  }
  if (time.hours) {
      let ret = time.hours + ' Hour'
      if (time.hours !== 1) {
          ret += 's'
      }
      parts.push(ret)
  }
  if (time.minutes) {
      let ret = time.minutes + ' Minute'
      if (time.minutes !== 1) {
          ret += 's'
      }
      parts.push(ret)

  }
  if (time.seconds) {
      let ret = time.seconds + ' Second'
      if (time.seconds !== 1) {
          ret += 's'
      }
      parts.push(ret)
  }
  if (useMilli && time.milliseconds) {
      let ret = time.milliseconds + ' ms'
      parts.push(ret)
  }
  if (parts.length === 0) {
      return ['instantly']
  } else {
      return parts
  }
}

exports.saveTranscript = async function(interaction, message){
  let attachment;
if(interaction) {
  if(config.TicketTranscriptSettings.TranscriptType === "HTML") {
      attachment = await discordTranscripts.createTranscript(interaction.channel, {
        limit: -1,
        minify: false,
        saveImages: config.TicketTranscriptSettings.SaveImages,
        returnType: 'buffer',
        poweredBy: false,
        fileName: `${interaction.channel.name}.html`
      });
      if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${interaction.channel.name}-transcript-${interaction.channel.id}.html`, attachment);
      attachment = new AttachmentBuilder(Buffer.from(attachment), { name: `${interaction.channel.name}-transcript.html` });
  } else if(config.TicketTranscriptSettings.TranscriptType === "TXT") {
      await interaction.channel.messages.fetch({ limit: 100 }).then(async fetched => {
          let a = fetched.filter(m => m.author.bot !== true).map(m => `${new Date(m.createdTimestamp).toLocaleString()} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).reverse().join('\n');
          if (a.length < 1) a = "Nothing"
          if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${interaction.channel.name}-transcript-${interaction.channel.id}.txt`, Buffer.from(a));
          attachment = new AttachmentBuilder(Buffer.from(a), { name: `${interaction.channel.name}-transcript.txt` });
  })
}
}

if(message) {
  if(config.TicketTranscriptSettings.TranscriptType === "HTML") {
      attachment = await discordTranscripts.createTranscript(message.channel, {
          limit: -1,
          minify: false,
          saveImages: config.TicketTranscriptSettings.SaveImages,
          returnType: 'buffer',
          poweredBy: false,
          fileName: `${message.channel.name}.html`
      });
      if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${message.channel.name}-transcript-${message.channel.id}.html`, attachment);
      attachment = new AttachmentBuilder(Buffer.from(attachment), { name: `${message.channel.name}-transcript.html` });
  } else if(config.TicketTranscriptSettings.TranscriptType === "TXT") {
      await message.channel.messages.fetch({ limit: 100 }).then(async fetched => {
          let a = fetched.filter(m => m.author.bot !== true).map(m => `${new Date(m.createdTimestamp).toLocaleString()} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).reverse().join('\n');
          if (a.length < 1) a = "Nothing"
          if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${message.channel.name}-transcript-${message.channel.id}.txt`, attachment);
          attachment = new AttachmentBuilder(Buffer.from(a), { name: `${message.channel.name}-transcript.txt` });
  })
}
}

  return attachment
}

exports.saveTranscriptAlertCmd = async function(channel){
  if(channel) {
    if(config.TicketTranscriptSettings.TranscriptType === "HTML") {
        attachment = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            minify: false,
            saveImages: config.TicketTranscriptSettings.SaveImages,
            returnType: 'buffer',
            poweredBy: false,
            fileName: `${channel.name}.html`
        });
        if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${channel.name}-transcript-${channel.id}.html`, attachment);
        attachment = new AttachmentBuilder(Buffer.from(attachment), { name: `${channel.name}-transcript.html` });
    } else if(config.TicketTranscriptSettings.TranscriptType === "TXT") {
        await channel.messages.fetch({ limit: 100 }).then(async fetched => {
            let a = fetched.filter(m => m.author.bot !== true).map(m => `${new Date(m.createdTimestamp).toLocaleString()} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).reverse().join('\n');
            if (a.length < 1) a = "Nothing"
            if(config.TicketTranscriptSettings.SaveInFolder) fs.writeFileSync(`./transcripts/${channel.name}-transcript-${channel.id}.txt`, attachment);
            attachment = new AttachmentBuilder(Buffer.from(a), { name: `${channel.name}-transcript.txt` });
    })
  }
  }
  return attachment
}



// Check for new payments
    // Stripe payment detection
    exports.checkStripePayments = async function(){
    let guild = client.guilds.cache.get(config.GuildID)
    if(!client.stripeInvoices) return
    const filtered = client.stripeInvoices.filter(p => p.status === "open")
    if(!filtered) return;
      filtered.forEach(async eachPayment => {
        let channel = guild.channels.cache.get(eachPayment.channelID);
        let user = guild.members.cache.get(eachPayment.userID);
        let seller = guild.members.cache.get(eachPayment.sellerID);
        let session;
        if(user) {
          session = await client.stripe.invoices.retrieve(eachPayment.invoiceID)
        
        if(!session || !channel) {
          client.stripeInvoices.delete(`${eachPayment.invoiceID}`)
        }

        if(session.status === 'paid') await client.stripeInvoices.set(`${session.id}`, "paid", 'status');
        await client.stripeInvoices.set(`${session.id}`, "deleted", 'status');
        }

        if(channel && user && client.stripeInvoices.get(`${session.id}`, "status") === "paid") {
          await channel.messages.fetch(eachPayment.messageID).then(async msg => {
  
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle('Link')
                    .setURL(`https://stripe.com`) 
                    .setLabel(config.Locale.PayPalPayInvoice)
                    .setDisabled(true))
  
            const embed = msg.embeds[0]
            embed.fields[0] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.PayPalSeller}** ${seller}\n> **${config.Locale.PayPalUser}** ${user}\n> **${config.Locale.PayPalPrice}** ${config.StripeSettings.CurrencySymbol}${eachPayment.price} (${config.StripeSettings.Currency})\n> **${config.Locale.suggestionStatus}** 🟢 PAID (<t:${Math.round(Date.now() / 1000)}:R>)` }
            const embedColor = EmbedBuilder.from(embed)
            embedColor.setColor("Green")
            await msg.edit({ embeds: [embedColor], components: [row] })
          })
        }
      })
    }
  

    // PayPal Payment Detection
    exports.checkPayPalPayments = async function(){
      let guild = client.guilds.cache.get(config.GuildID)
      if(!client.paypalInvoices) return
      const filtered = client.paypalInvoices.filter(p => p.status === "DRAFT")
      if(!filtered) return;
        filtered.forEach(async eachPayment => {
          let channel = guild.channels.cache.get(eachPayment.channelID);
          let user = guild.members.cache.get(eachPayment.userID);
          let seller = guild.members.cache.get(eachPayment.sellerID);
          if(user) {
            client.paypal.invoice.get(eachPayment.invoiceID, async function (error, invoice) {
              if (error) {
                  if(error.response.error === "invalid_client") {
                    console.log('\x1b[31m%s\x1b[0m', `[ERROR] The PayPal API Credentials you specified in the config are invalid! Make you sure you use the "LIVE" mode!`)
                  } else {
                    console.log(error)
                  }
              } else {
              
          if(!channel || !invoice) {
            await client.paypalInvoices.set(`${invoice.id}`, "deleted", 'status');
          }

          if(invoice.status === 'PAID') await client.paypalInvoices.set(`${invoice.id}`, "paid", 'status');
          }

          if(invoice && channel && user && client.paypalInvoices.get(`${invoice.id}`, "status") === "paid") {
            await channel.messages.fetch(eachPayment.messageID).catch(e => {}).then(async msg => {
    
              const row = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                      .setStyle('Link')
                      .setURL(`https://paypal.com`) 
                      .setLabel(config.Locale.PayPalPayInvoice)
                      .setDisabled(true))
    
              const embed = msg.embeds[0]
              embed.fields[0] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.PayPalSeller}** <@!${seller.id}>\n> **${config.Locale.PayPalUser}** <@!${user.id}>\n> **${config.Locale.PayPalPrice}** ${config.PayPalSettings.CurrencySymbol}${eachPayment.price} (${config.PayPalSettings.Currency})\n> **${config.Locale.suggestionStatus}** 🟢 PAID (<t:${Math.round(Date.now() / 1000)}:R>)` }
              const embedColor = EmbedBuilder.from(embed)
              embedColor.setColor("Green")
              await msg.edit({ embeds: [embedColor], components: [row] })
            })
          }
        })
      }
  })
}



  client.login(config.Token).catch(error => {
    if (error.message.includes("An invalid token was provided")) {
      console.log('\x1b[31m%s\x1b[0m', `[ERROR] The bot token specified in the config is incorrect!`)
      process.exit()
    } else if(error.message.includes("Privileged intent provided is not enabled or whitelisted.")){
      console.log('\x1b[31m%s\x1b[0m', `[DISALLOWED_INTENTS]: Privileged intent provided is not enabled or whitelisted.\nTo fix this, you have to enable all the privileged gateway intents in your discord developer portal, you can do this by opening the discord developer portal, go to your application, click on bot on the left side, scroll down and enable Presence Intent, Server Members Intent, and Message Content Intent`)
      process.exit()
    } else {
      console.log('\x1b[31m%s\x1b[0m', `[ERROR] An error occured while attempting to login to the bot`)
      console.log(error)
      process.exit()
    }
  })

