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
    message.delete()

    const ping = new Discord.EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setColor(config.EmbedColors)
    .addFields([
      { name: 'Ping', value: client.ws.ping +'ms' },
      { name: 'Latency', value: `${Date.now() - message.createdTimestamp}ms.` },
    ])
    .setTimestamp()
    .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: `${message.author.displayAvatarURL({ dynamic: true })}` })
    message.channel.send({ embeds: [ping] })
}


module.exports.help = {
  name: 'ping',
  enabled: commands.General.Ping.Enabled
}
