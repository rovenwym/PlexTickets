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
    enabled: commands.Ticket.Add.Enabled,
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription(commands.Ticket.Add.Description)
        .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true)),
    async execute(interaction, client) {
        if(!client.tickets.has(interaction.channel.id)) return interaction.reply({ content: config.Locale.NotInTicketChannel, ephemeral: true })

        let user = interaction.options.getUser("user");

        interaction.channel.permissionOverwrites.create(user, {
            SendMessages: true,
            ViewChannel: true,
            ReadMessageHistory: true
        });

        let logsChannel; 
        if(!config.userAdd.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.userAdd.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.userAdd.ChannelID);
    
        const log = new Discord.EmbedBuilder()
        .setColor("Green")
        .setTitle(config.Locale.userAddTitle)
        .addFields([
            { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
            { name: `• ${config.Locale.logsUser}`, value: `> <@!${user.id}>\n> ${user.tag}` },
            { name: `• ${config.Locale.logsTicket}`, value: `> <#${interaction.channel.id}>\n> #${interaction.channel.name}` },
          ])
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

        let addLocale = config.Locale.ticketUserAdd.replace(/{user}/g, `<@!${user.id}>`).replace(/{user-tag}/g, `${user.tag}`);
        const embed = new Discord.EmbedBuilder()
        .setColor("Green")
        .setDescription(addLocale)
    
        interaction.reply({ embeds: [embed] })
        if (logsChannel && config.userAdd.Enabled) logsChannel.send({ embeds: [log] })

    }

}