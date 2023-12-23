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
    enabled: commands.General.Ping.Enabled,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(commands.General.Ping.Description),
    async execute(interaction, client) {

        const ping = new Discord.EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setColor(config.EmbedColors)
        .addFields([
            { name: 'Ping', value: client.ws.ping +'ms' },
            { name: 'Latency', value: `${Date.now() - interaction.createdTimestamp}ms.` },
          ])
        .setTimestamp()
        .setFooter({ text: `Requested by: ${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
        interaction.reply({ embeds: [ping] })

    }

}