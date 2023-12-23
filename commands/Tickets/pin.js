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

    if(message.channel.name.startsWith("📌")) return message.reply(config.Locale.ticketAlreadyPinned)

    message.channel.setPosition(1)
    message.channel.setName(`📌${message.channel.name}`)

    const embed = new Discord.EmbedBuilder()
    .setColor("Green")
    .setDescription(config.Locale.ticketPinned)
    message.channel.send({ embeds: [embed] })
    message.delete()

}


module.exports.help = {
  name: 'pin',
  enabled: commands.Ticket.Pin.Enabled
}
