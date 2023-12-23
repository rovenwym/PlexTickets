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

exports.run = async (client, message, args) => {
    if(!client.tickets.has(message.channel.id)) return message.channel.send(config.Locale.NotInTicketChannel).then(msg => setTimeout(() => msg.delete(), 5000));
    
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

    let newName = args.join(" ")
    if(!newName) return message.reply(config.Locale.ticketRenameSpecifyName)
    message.channel.setName(`${newName}`)

    const log = new Discord.EmbedBuilder()
    .setColor("Orange")
    .setTitle(config.Locale.ticketRenameTitle)
    .addFields([
        { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${message.author.id}>\n> ${message.author.tag}` },
        { name: `• ${config.Locale.logsTicket}`, value: `> <#${message.channel.id}>\n>\n> #${message.channel.name}` },
      ])
    .setTimestamp()
    .setThumbnail(message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    .setFooter({ text: `${message.author.tag}`, iconURL: `${message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

    let logsChannel; 
    if(!config.renameTicket.ChannelID) logsChannel = message.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.renameTicket.ChannelID) logsChannel = message.guild.channels.cache.get(config.renameTicket.ChannelID);

    let renameLocale = config.Locale.ticketRenamed.replace(/{newName}/g, `${newName}`);
    const embed = new Discord.EmbedBuilder()
    .setColor("Green")
    .setDescription(renameLocale)

    message.channel.send({ embeds: [embed] })
    if (logsChannel && config.renameTicket.Enabled) logsChannel.send({ embeds: [log] })

}


module.exports.help = {
  name: 'rename',
  enabled: commands.Ticket.Rename.Enabled
}
