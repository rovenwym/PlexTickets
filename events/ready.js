const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const color = require('ansi-colors');
const botVersion = require('../package.json');
const utils = require("../utils.js");
const Discord = require("discord.js");

module.exports = async client => {
    let guild = client.guilds.cache.get(config.GuildID)
    if(!guild) {
        console.log('\x1b[31m%s\x1b[0m', `[ERROR] The guild ID specified in the config is invalid or the bot is not in the server!\nYou can use the link below to invite the bot to your server:\nhttps://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
        process.exit()
    } 

    await client.globalStats.ensure(`${guild.id}`, {
        totalTickets: 0,
        openTickets: 0,
        totalClaims: 0,
        totalMessages: 0,
        totalSuggestions: 0,
        totalSuggestionUpvotes: 0,
        totalSuggestionDownvotes: 0,
        totalReviews: 0
      });

      await client.reviews.ensure(`${guild.id}`, {
        guildID: guild.id,
        ratings: []
    });


    // Sync globalStats.openTickets
    let openNow = 0
    let openInDb = client.globalStats.get(`${guild.id}`, "openTickets")
    await guild.channels.cache.forEach(c => {
        if(client.tickets.has(c.id)) {
            openNow = openNow + 1
    }
})
if(openInDb !== openNow) {
    client.globalStats.set(guild.id, openNow, "openTickets");
}
//

// bot activity

let activType;
if(config.BotActivitySettings.Type === "WATCHING") activType = Discord.ActivityType.Watching
if(config.BotActivitySettings.Type === "PLAYING") activType = Discord.ActivityType.Playing
if(config.BotActivitySettings.Type === "COMPETING") activType = Discord.ActivityType.Competing

if(config.BotActivitySettings.Enabled && config.BotActivitySettings.Statuses && config.BotActivitySettings.Statuses?.length > 1) {
    let index = 0
    client.user.setActivity(config.BotActivitySettings.Statuses[0].replace(/{total-users}/g, `${guild.memberCount.toLocaleString('en-US')}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${guild.id}`, "totalTickets").toLocaleString('en-US')}`).replace(/{total-channels}/g, `${client.channels.cache.size}`).replace(/{open-tickets}/g, `${client.globalStats.get(`${guild.id}`, "openTickets").toLocaleString('en-US')}`).replace(/{total-messages}/g, `${client.globalStats.get(`${guild.id}`, "totalMessages").toLocaleString('en-US')}`).replace(/{average-rating}/g, `${utils.averageRating(client)}`), { type: activType });
    setInterval(() => {
        if(index === config.BotActivitySettings.Statuses.length) index = 0
        client.user.setActivity(config.BotActivitySettings.Statuses[index].replace(/{total-users}/g, `${guild.memberCount.toLocaleString('en-US')}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${guild.id}`, "totalTickets").toLocaleString('en-US')}`).replace(/{total-channels}/g, `${client.channels.cache.size}`).replace(/{open-tickets}/g, `${client.globalStats.get(`${guild.id}`, "openTickets").toLocaleString('en-US')}`).replace(/{total-messages}/g, `${client.globalStats.get(`${guild.id}`, "totalMessages").toLocaleString('en-US')}`).replace(/{average-rating}/g, `${utils.averageRating(client)}`), { type: activType });
        index++;
    }, config.BotActivitySettings.Interval * 1000);
} else if(config.BotActivitySettings.Enabled && config.BotActivitySettings.Statuses && config.BotActivitySettings.Statuses?.length <= 1) {
client.user.setActivity(config.BotActivitySettings.Statuses[0].replace(/{total-users}/g, `${guild.memberCount}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${guild.id}`, "totalTickets")}`).replace(/{total-channels}/g, `${client.channels.cache.size}`).replace(/{open-tickets}/g, `${client.globalStats.get(`${guild.id}`, "openTickets")}`).replace(/{total-messages}/g, `${client.globalStats.get(`${guild.id}`, "totalMessages")}`).replace(/{average-rating}/g, `${utils.averageRating(client)}`), { type: activType });
}
//

    client.guilds.cache.forEach(guild => {
        if(!config.GuildID.includes(guild.id)) {
        guild.leave();
        console.log('\x1b[31m%s\x1b[0m', `[INFO] Someone tried to invite the bot to another server! I automatically left it (${guild.name})`)
        }
    })
    if (guild && !guild.members.me.permissions.has("Administrator")) {
        console.log('\x1b[31m%s\x1b[0m', `[ERROR] The bot doesn't have enough permissions! Please give the bot ADMINISTRATOR permissions in your server or it won't function properly!`)
    }

    await console.log("――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――");
    await console.log("                                                                          ");
    if(config.LicenseKey) await console.log(`${color.green.bold(`Plex Tickets v${botVersion.version} is now Online!`)} (${color.gray(`${config.LicenseKey.slice(0, -10)}`)})`);
    if(!config.LicenseKey) await console.log(`${color.green.bold(`Plex Tickets v${botVersion.version} is now Online! `)}`);
    await console.log("                                                                          ");
    await console.log(`• Join our discord server for support, ${color.cyan(`discord.gg/dW9EpJk`)}`);
    await console.log(`• By using this bot you agree to all terms located here, ${color.yellow(`plexdevelopment.net/tos`)}`);
    await console.log(`• Addons for the bot can be found here, ${color.yellow(`plexdevelopment.net/store`)}`);
    if(config.LicenseKey) await console.log("                                                                          ");
    if(config.LicenseKey) await console.log(`• You can buy the full source code at ${color.yellow(`plexdevelopment.net/store/ptsourcecode`)}`);
    if(config.LicenseKey) await console.log(`• Use code ${color.green.bold.underline(`PLEX`)} for 10% OFF!`);
    await console.log("                                                                          ");
    await console.log("――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――");
    if(config.OwnerID && config.OwnerID !== "303894627994566656") await console.log(`${color.yellow.bold(`• NOTICE:\nMessage commands will be removed from the bot soon!`)}`)
    if(config.OwnerID && config.OwnerID !== "303894627994566656") await console.log("                                                                          ");
    await utils.checkConfig(client)

    let logMsg = `\n\n[${new Date().toLocaleString()}] [READY] Bot is now ready!`;
    fs.appendFile("./logs.txt", logMsg, (e) => { 
      if(e) console.log(e);
    });

// Update channel stats
setInterval(function() {
if(config.TotalTickets.Enabled) {
  let channel = guild.channels.cache.get(config.TotalTickets.ChannelID)
  let totalTicketsCountMsg = config.TotalTickets.ChannelName.replace(/{total-tickets}/g, `${client.globalStats.get(`${guild.id}`, "totalTickets").toLocaleString('en-US')}`)
  if (channel) channel.setName(totalTicketsCountMsg).catch(error => console.log(error));
}

if(config.OpenTickets.Enabled) {
  let channel = guild.channels.cache.get(config.OpenTickets.ChannelID)
  let openTicketsCountMsg = config.OpenTickets.ChannelName.replace(/{open-tickets}/g, `${client.globalStats.get(`${guild.id}`, "openTickets").toLocaleString('en-US')}`)
  if (channel) channel.setName(openTicketsCountMsg).catch(error => console.log(error));
}

if(config.AverageRating.Enabled) {
  let channel = guild.channels.cache.get(config.AverageRating.ChannelID)
  let averageRatingMsg = config.AverageRating.ChannelName.replace(/{average-rating}/g, `${utils.averageRating(client)}`)
  if (channel) channel.setName(averageRatingMsg).catch(error => console.log(error));
}

// Alert Command notification automatically close ticket
if(config.TicketAlert.Enabled) {
const filtered = client.tickets.filter(p => p.closeNotificationTime)
if(!filtered) return
filtered.forEach(async time => {
  if(!time) return;

let date1 = time.closeNotificationTime
let date2 = Date.now()

let hours = Math.abs(date1 - date2) / 36e5;

if(hours > config.TicketAlert.Time) {

  let ticketAuthor = await client.users.cache.get(time.userID)
  let closeUserID = await client.users.cache.get(time.closeUserID)
  let claimUser = await client.users.cache.get(time.claimUser)
  let totalMessages = await time.messages
  let ticketCloseReason = await time.closeReason
  let channel = await guild.channels.cache.get(time.channelID)

  let attachment = await utils.saveTranscriptAlertCmd(channel)

    const logEmbed = new Discord.EmbedBuilder()
    logEmbed.setColor("Red")
    logEmbed.setTitle(config.Locale.ticketCloseTitle)

    if(closeUserID) logEmbed.addFields([
      { name: `• ${config.Locale.logsClosedBy}`, value: `> <@!${closeUserID.id}>\n> ${closeUserID.tag}` },
    ])

    logEmbed.addFields([
      { name: `• ${config.Locale.logsTicketAuthor}`, value: `> <@!${ticketAuthor.id}>\n> ${ticketAuthor.tag}` },
    ])

    if(claimUser && config.ClaimingSystem.Enabled) logEmbed.addFields([
      { name: `• ${config.Locale.ticketClaimedBy}`, value: `> <@!${claimUser.id}>\n> ${claimUser.tag}` },
    ])

    logEmbed.addFields([
      { name: `• ${config.Locale.logsTicket}`, value: `> #${channel.name}\n> ${time.ticketType}` },
    ])

    if(config.TicketSettings.TicketCloseReason && ticketCloseReason) logEmbed.addFields([
      { name: `• ${config.Locale.reason}`, value: `> ${ticketCloseReason}` },
    ])

    logEmbed.setTimestamp()
    logEmbed.setThumbnail(closeUserID.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    logEmbed.setFooter({ text: `${config.Locale.totalMessagesLog} ${totalMessages}`, iconURL: `${closeUserID.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

    let logsChannel; 
    if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

    if(logsChannel && config.ticketClose.Enabled && totalMessages < config.TicketTranscriptSettings.MessagesRequirement) await logsChannel.send({ embeds: [logEmbed] })
    if(logsChannel && config.ticketClose.Enabled && totalMessages >= config.TicketTranscriptSettings.MessagesRequirement) await logsChannel.send({ embeds: [logEmbed], files: [attachment] })

    await channel.delete().catch(e => {})

}
})
}

}, 300000);


//setInterval(async() => {
  //for (const [key,value] of Object.entries(process.memoryUsage())){
    //console.log(`Memory usage by ${key}, ${value/1000000}MB `)
  //}
//}, 5000);

// Sync select menu with config
    const options = [];
    options.push({
      label: config.TicketButton1.TicketName,
      value: "button1",
      description: config.TicketButton1.Description,
      emoji: config.TicketButton1.ButtonEmoji,
    });

    if(config.TicketButton2.Enabled) options.push({
      label: config.TicketButton2.TicketName,
      value: "button2", 
      description: config.TicketButton2.Description,
      emoji: config.TicketButton2.ButtonEmoji,
    });

    if(config.TicketButton3.Enabled) options.push({
      label: config.TicketButton3.TicketName,
      value: "button3",
      description: config.TicketButton3.Description,
      emoji: config.TicketButton3.ButtonEmoji,
    });

    if(config.TicketButton4.Enabled) options.push({
      label: config.TicketButton4.TicketName,
      value: "button4",
      description: config.TicketButton4.Description,
      emoji: config.TicketButton4.ButtonEmoji,
    });

    if(config.TicketButton5.Enabled) options.push({
      label: config.TicketButton5.TicketName,
      value: "button5",
      description: config.TicketButton5.Description,
      emoji: config.TicketButton5.ButtonEmoji,
    });

    if(config.TicketButton6.Enabled) options.push({
      label: config.TicketButton6.TicketName,
      value: "button6",
      description: config.TicketButton6.Description,
      emoji: config.TicketButton6.ButtonEmoji,
    });

    if(config.TicketButton7.Enabled) options.push({
      label: config.TicketButton7.TicketName,
      value: "button7",
      description: config.TicketButton7.Description,
      emoji: config.TicketButton7.ButtonEmoji,
    });
    
    if(config.TicketButton8.Enabled) options.push({
      label: config.TicketButton8.TicketName,
      value: "button8",
      description: config.TicketButton8.Description,
      emoji: config.TicketButton8.ButtonEmoji,
    });

    await options.map((item) => {
      if(!item.emoji) delete item.emoji
      if(!item.description) delete item.description
    });

    client.ticketPanel.set(config.GuildID, options, 'selectMenuOptions');
}