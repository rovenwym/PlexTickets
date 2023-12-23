const Discord = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))

module.exports = async (client, channel) => {
  if(!client.tickets.has(channel.id)) return

  client.globalStats.dec(channel.guild.id, "openTickets");
  client.tickets.delete(channel.id)

};