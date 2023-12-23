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

const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require ("discord.js")
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))
const utils = require("../../utils.js");

module.exports = {
    enabled: commands.Ticket.Delete.Enabled,
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription(commands.Ticket.Delete.Description),
    async execute(interaction, client) {
        if(!client.tickets.has(interaction.channel.id)) return interaction.reply({ content: config.Locale.NotInTicketChannel, ephemeral: true })
    
        let supportRole = false
        let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
        if(tButton === "TicketButton1") {
            for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
            }
        } else if(tButton === "TicketButton2") {
            for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton3") {
            for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton4") {
            for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton5") {
            for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton6") {
            for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton7") {
            for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
              }
        } else if(tButton === "TicketButton8") {
            for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
                if(interaction.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
              }
        }
        if(supportRole === false) return interaction.reply({ content: config.Locale.NoPermsMessage, ephemeral: true })
    
        let ticketAuthor = client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "userID"))
        const logEmbed = new Discord.EmbedBuilder()
        logEmbed.setColor("Red")
        logEmbed.setTitle(config.Locale.ticketForceDeleted)
        logEmbed.addFields([
            { name: `• ${config.Locale.logsDeletedBy}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
            { name: `• ${config.Locale.logsTicketAuthor}`, value: `> <@!${ticketAuthor.id}>\n> ${ticketAuthor.tag}` },
            { name: `• ${config.Locale.logsTicket}`, value:  `> #${interaction.channel.name}\n> ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}` },
          ])
        logEmbed.setTimestamp()
        logEmbed.setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        logEmbed.setFooter({ text: `${config.Locale.totalMessagesLog} ${client.tickets.get(`${interaction.channel.id}`, "messages")}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    
        let attachment = await utils.saveTranscript(interaction)

        let logsChannel; 
        if(!config.deleteTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.deleteTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.deleteTicket.ChannelID);
    
        if(logsChannel && config.deleteTicket.Enabled && config.TicketSettings.DeleteCommandTranscript) await logsChannel.send({ embeds: [logEmbed], files: [attachment] })
        if(logsChannel && config.deleteTicket.Enabled && config.TicketSettings.DeleteCommandTranscript === false) await logsChannel.send({ embeds: [logEmbed] })

        let dTime = config.TicketSettings.DeleteTime * 1000 
        let deleteTicketCountdown = config.Locale.deletingTicketMsg.replace(/{time}/g, `${config.TicketSettings.DeleteTime}`);
        const delEmbed = new Discord.EmbedBuilder()
            .setDescription(deleteTicketCountdown)
            .setColor("Red")
        await interaction.reply({ embeds: [delEmbed] })
    
        await setTimeout(() => interaction.channel.delete(), dTime);

    }

}