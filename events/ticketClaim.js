const Discord = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))

module.exports = async (client, interaction) => {

    // Add 1 to globalStats.totalClaims everytime a ticket gets claimed
    client.globalStats.inc(interaction.guild.id, "totalClaims");
    //
};