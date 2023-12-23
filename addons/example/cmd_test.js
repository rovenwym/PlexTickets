const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require ("discord.js")
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('././config.yml', 'utf8'))

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription(`Test command!`),
    async execute(interaction, client) {

        interaction.reply({ content: `This is a test slash command!`, ephemeral: true })
}
}