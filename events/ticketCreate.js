const { Discord, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder, ModalBuilder } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))

module.exports = async (client, interaction) => {

    // Add 1 to globalStats.totalTickets when a new ticket gets created
    client.globalStats.inc(interaction.guild.id, "totalTickets");
    //

    // Sync globalStats.openTickets
        let openNow = 0
        let openInDb = client.globalStats.get(`${interaction.guild.id}`, "openTickets")
        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
                openNow = openNow + 1
        }
    })
    if(openInDb !== openNow) {
        client.globalStats.set(interaction.guild.id, openNow, "openTickets");
    }
    //

};

// %%__FILEHASH__%%
// %%__NONCE__%%