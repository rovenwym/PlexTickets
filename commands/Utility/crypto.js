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

const { Discord, ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageSelectMenu } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))
const fetch = require("node-fetch");

exports.run = async (client, message, args) => {
    if(config.CryptoSettings.Enabled === false) return;
    if (config.CryptoSettings.OnlyInTicketChannels && !client.tickets.has(message.channel.id)) return message.channel.send(config.Locale.NotInTicketChannel).then(msg => setTimeout(() => msg.delete(), 5000));

    let doesUserHaveRole = false
    for(let i = 0; i < config.CryptoSettings.AllowedRoles.length; i++) {
        role = message.guild.roles.cache.get(config.CryptoSettings.AllowedRoles[i]);
        if(role && message.member.roles.cache.has(config.CryptoSettings.AllowedRoles[i])) doesUserHaveRole = true;
      }

    if(doesUserHaveRole === false) return message.reply(config.Locale.NoPermsMessage)

    let invalidusage = new EmbedBuilder()
    .setColor("Red")
    .setDescription(`Too few arguments given\n\nUsage:\n\`\`crypto <@user> <crypto currency> <price in ${config.CryptoSettings.Currency}> <service>\`\``)

    let invalidcurrency = new EmbedBuilder()
    .setColor("Red")
    .setDescription(`Invalid currency!\n\nValid currencies:\n\`\`BTC\`\`, \`\`ETH\`\`, \`\`USDT\`\`, \`\`LTC\`\`\nUsage:\n\`\`crypto <@user> <crypto currency> <price in ${config.CryptoSettings.Currency}> <service>\`\``)

    let price = args[2];
    let service = args.slice(3).join(" ");
    let user = message.mentions.users.first()
    if(!user) return message.reply({ embeds: [invalidusage] })

    let currency = args[1];
    if(!currency) return message.reply({ embeds: [invalidcurrency] })
    currency.toUpperCase()
    if(!["BTC", "ETH", "USDT", "LTC"].includes(currency)) return message.reply({ embeds: [invalidcurrency] })

    if(!price) return message.reply({ embeds: [invalidusage] })
    if((isNaN(price))) return message.reply({ embeds: [invalidusage] })
    if(!service) return message.reply({ embeds: [invalidusage] })

    let address = ""
    let cryptoPrice = ""
    let cryptoAmount = ""
    if(currency === "BTC") address = config.CryptoAddresses.BTC
    if(currency === "ETH") address = config.CryptoAddresses.ETH
    if(currency === "USDT") address = config.CryptoAddresses.USDT
    if(currency === "LTC") address = config.CryptoAddresses.LTC

    if(currency === "BTC" && !config.CryptoAddresses.BTC) return message.reply("BTC address has not been specified in the config!")
    if(currency === "ETH" && !config.CryptoAddresses.ETH) return message.reply("ETH address has not been specified in the config!")
    if(currency === "USDT" && !config.CryptoAddresses.USDT) return message.reply("USDT address has not been specified in the config!")
    if(currency === "LTC" && !config.CryptoAddresses.LTC) return message.reply("LTC address has not been specified in the config!")

    let convert = await fetch(`https://api.coinconvert.net/convert/${config.CryptoSettings.Currency}/${currency}?amount=${price}`);
    let converted = await convert.json();
    cryptoAmount = Object.values(converted)[2];

    if(currency === "BTC") cryptoFullName = "bitcoin"
    if(currency === "ETH") cryptoFullName = "ethereum"
    if(currency === "USDT") cryptoFullName = "tether"
    if(currency === "LTC") cryptoFullName = "litecoin"

    const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setStyle('Link')
            .setURL(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${cryptoFullName.toLowerCase()}:${address}?amount=${cryptoAmount}`) 
            .setLabel(config.Locale.cryptoQRCode))

    const embed = new EmbedBuilder()
    .setTitle(`${config.Locale.cryptoTitle} (${currency.toUpperCase()})`)
    .setColor(config.EmbedColors)
    .setThumbnail("https://i.imgur.com/ASvkLsG.png")
    .setDescription(config.Locale.cryptoMessage)
    .addFields([
      { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.PayPalSeller}** <@!${message.author.id}>\n> **${config.Locale.PayPalUser}** <@!${user.id}>\n> **${config.Locale.PayPalPrice}** ${cryptoAmount} (${price} ${config.CryptoSettings.Currency})\n> **${config.Locale.cryptoLogAddress}** || ${address} ||` },
      { name: `• ${config.Locale.PayPalService}`, value: `> \`\`\`${service}\`\`\`` },
    ])
    .setFooter({ text: `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp()
    message.channel.send({ embeds: [embed], components: [row] });

    let logsChannel; 
    if(!config.cryptoPayments.ChannelID) logsChannel = message.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.cryptoPayments.ChannelID) logsChannel = message.guild.channels.cache.get(config.cryptoPayments.ChannelID);

    const log = new EmbedBuilder()
    .setColor("Green")
    .setTitle(config.Locale.cryptoLogTitle)
    .addFields([
      { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${message.author.id}>\n> ${message.author.tag}` },
      { name: `• ${config.Locale.PayPalUser}`, value: `> <@!${user.id}>\n> ${user.tag}` },
      { name: `• ${config.Locale.PayPalPrice}`, value: `> ${config.CryptoSettings.CurrencySymbol}${price}\n> ${cryptoAmount} ${currency}` },
      { name: `• ${config.Locale.PayPalService}`, value: `> ${service}` },
    ])
    .setTimestamp()
    .setThumbnail(message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    .setFooter({ text: `${message.author.tag}`, iconURL: `${message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    if (logsChannel && config.cryptoPayments.Enabled) logsChannel.send({ embeds: [log] })

}


module.exports.help = {
  name: 'crypto',
  enabled: commands.Utility.Crypto.Enabled
}
