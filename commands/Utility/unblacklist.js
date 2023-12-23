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
    if(!message.member.permissions.has("ManageChannels")) return message.reply(config.Locale.NoPermsMessage);

    let invalidusage = new Discord.EmbedBuilder()
    .setColor("Red")
    .setDescription('Too few arguments given\n\nUsage:\n``unblacklist <@user>``')

    let user = message.mentions.users.first()
    if(!user) return message.reply({ embeds: [invalidusage] })

    let alreadyBlacklistedLocale = config.Locale.notBlacklisted.replace(/{user}/g, `<@!${user.id}>`).replace(/{user-tag}/g, `${user.tag}`);
    const alreadyBlacklisted = new Discord.EmbedBuilder()
    .setColor("Red")
    .setDescription(alreadyBlacklistedLocale)

    if(client.blacklistedUsers.has(`${user.id}`) && client.blacklistedUsers.get(`${user.id}`, "blacklisted") === false) return message.channel.send({ embeds: [alreadyBlacklisted] })

    let successfullyUnblacklistedLocale = config.Locale.successfullyUnblacklisted.replace(/{user}/g, `<@!${user.id}>`).replace(/{user-tag}/g, `${user.tag}`);
    const embed = new Discord.EmbedBuilder()
    .setColor("Green")
    .setDescription(successfullyUnblacklistedLocale)

    message.channel.send({ embeds: [embed] })
    client.blacklistedUsers.set(`${user.id}`, false, "blacklisted");
}


module.exports.help = {
  name: 'unblacklist',
  enabled: commands.Utility.Unblacklist.Enabled
}
