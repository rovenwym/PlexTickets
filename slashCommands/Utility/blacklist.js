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
    enabled: commands.Utility.Blacklist.Enabled,
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription(commands.Utility.Blacklist.Description)
        .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true)),
    async execute(interaction, client) {
        if(!interaction.member.permissions.has("ManageChannels")) return interaction.reply({ content: config.Locale.NoPermsMessage, ephemeral: true });

        let user = interaction.options.getUser("user");

        let alreadyBlacklistedLocale = config.Locale.alreadyBlacklisted.replace(/{user}/g, `<@!${user.id}>`).replace(/{user-tag}/g, `${user.tag}`);
        const alreadyBlacklisted = new Discord.EmbedBuilder()
        .setColor("Red")
        .setDescription(alreadyBlacklistedLocale)
    
        if(client.blacklistedUsers.has(`${user.id}`) && client.blacklistedUsers.get(`${user.id}`, "blacklisted") === true) return interaction.reply({ embeds: [alreadyBlacklisted], ephemeral: true })
    
        let successfullyBlacklistedLocale = config.Locale.successfullyBlacklisted.replace(/{user}/g, `<@!${user.id}>`).replace(/{user-tag}/g, `${user.tag}`);
        const embed = new Discord.EmbedBuilder()
        .setColor("Green")
        .setDescription(successfullyBlacklistedLocale)
    
        interaction.reply({ embeds: [embed], ephemeral: true })
        client.blacklistedUsers.set(`${user.id}`, true, "blacklisted");

    }

}