/*
 _____  _             _______ _      _        _       
|  __ \| |           |__   __(_)    | |      | |      
| |__) | | _____  __    | |   _  ___| | _____| |_ ___ 
|  ___/| |/ _ \ \/ /    | |  | |/ __| |/ / _ \ __/ __|
| |    | |  __/>  <     | |  | | (__|   <  __/ |_\__ \
|_|    |_|\___/_/\_\    |_|  |_|\___|_|\_\___|\__|___/
                                        
Thank you for purchasing Plex Tickets!
If you find any issues, need support, or have a suggestion for the bot, please join our support server and create a ticket,
https://discord.gg/eRaeJdTsPY
*/

const Discord = require ("discord.js")
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))

exports.run = async (client, message) => {
    if(!client.tickets.has(message.channel.id)) return message.channel.send(config.Locale.NotInTicketChannel).then(msg => setTimeout(() => msg.delete(), 5000));
    if(config.TicketAlert.Enabled === false) return message.channel.send("This command has been disabled in the config!")


    let supportRole = false
    let tButton = client.tickets.get(`${message.channel.id}`, "button");
    if(tButton === "TicketButton1") {
        for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
        }
    } else if(tButton === "TicketButton2") {
        for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton3") {
        for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton4") {
        for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton5") {
        for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton6") {
        for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton7") {
        for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton8") {
        for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
            if(message.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
          }
    }
    if(supportRole === false) return message.reply(config.Locale.NoPermsMessage)

    let ticketCreator = await client.users.cache.get(client.tickets.get(`${message.channel.id}`, "userID"))
    
    const ticketDeleteButton = new Discord.ButtonBuilder()
    .setCustomId('closeTicket')
    .setLabel(config.Locale.CloseTicketButton)
    .setStyle(config.ButtonColors.closeTicket)
    .setEmoji(config.ButtonEmojis.closeTicket)
    
    let row = new Discord.ActionRowBuilder().addComponents(ticketDeleteButton);

    let descLocale = config.TicketAlert.Message.replace(/{time}/g, `${config.TicketAlert.Time}`);
    const embed = new Discord.EmbedBuilder()
    .setColor(config.EmbedColors)
    .setAuthor({ name: `${config.TicketAlert.Title}`, iconURL: `https://i.imgur.com/FxQkyLb.png` })
    .setDescription(descLocale)
    .setTimestamp()
    message.channel.send({ content: `<@!${ticketCreator.id}>`, embeds: [embed], components: [row] }).then(async function(msg) {

    await client.tickets.set(message.channel.id, Date.now(), 'closeNotificationTime');
    await client.tickets.set(message.channel.id, msg.id, 'closeNotificationMsgID');
    await client.tickets.set(message.channel.id, message.author.id, 'closeNotificationUserID');
    await client.tickets.set(message.channel.id, message.channel.id, 'channelID');
    await client.tickets.set(message.channel.id, message.author.id, "closeUserID");
    await client.tickets.set(message.channel.id, "Closed automatically after time has passed with no response (Alert command)", 'closeReason');
    })
}


module.exports.help = {
  name: 'alert',
  enabled: commands.Ticket.Alert.Enabled
}
