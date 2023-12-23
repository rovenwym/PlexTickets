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

module.exports = {
    enabled: commands.Ticket.Rename.Enabled,
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription(commands.Ticket.Rename.Description)
        .addStringOption(option => option.setName('name').setDescription('name').setRequired(true)),
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

    let newName = interaction.options.getString("name");
    interaction.channel.setName(`${newName}`)

    const log = new Discord.EmbedBuilder()
    .setColor("Orange")
    .setTitle(config.Locale.ticketRenameTitle)
    .addFields([
        { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
        { name: `• ${config.Locale.logsTicket}`, value: `> <#${interaction.channel.id}>\n> #${interaction.channel.name}` },
      ])
    .setTimestamp()
    .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

    let logsChannel; 
    if(!config.renameTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.renameTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.renameTicket.ChannelID);

    let renameLocale = config.Locale.ticketRenamed.replace(/{newName}/g, `${newName}`);
    const embed = new Discord.EmbedBuilder()
    .setColor("Green")
    .setDescription(renameLocale)

    interaction.reply({ embeds: [embed] })
    if (logsChannel && config.renameTicket.Enabled) logsChannel.send({ embeds: [log] })
    }

// %%__USER__%%

}