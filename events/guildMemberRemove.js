const Discord = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))

module.exports = async (client, member) => {
    await member.guild.channels.cache.forEach(c => {
        if(client.tickets.has(c.id)) {
        let ticketData = client.tickets.get(`${c.id}`, "userID");
        if(ticketData && ticketData === member.id) {
            let logsChannel = member.guild.channels.cache.get(c.id);

            const ticketDeleteButton = new Discord.ButtonBuilder()
            .setCustomId('deleteTicket')
            .setLabel(config.Locale.deleteTicketButton)
            .setEmoji(config.ButtonEmojis.deleteTicket)
            .setStyle(config.ButtonColors.deleteTicket)
            
            let row = new Discord.ActionRowBuilder().addComponents(ticketDeleteButton);

            client.tickets.set(c.id, "User left the server", 'closeReason');

            let userLeftDescLocale = config.Locale.userLeftDescription.replace(/{user-tag}/g, `${member.user.tag}`);
            const embed = new Discord.EmbedBuilder()
            .setColor(config.EmbedColors)
            .setTitle(config.Locale.userLeftTitle)
            .setDescription(userLeftDescLocale)
            .setFooter({ text: `${member.user.tag}`, iconURL: `${member.user.displayAvatarURL({ dynamic: true })}` })
            .setTimestamp()
            logsChannel.send({ embeds: [embed], components: [row] })
        }
      }
    });
};