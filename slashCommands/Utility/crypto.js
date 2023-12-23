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
const { Discord, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))
const fetch = require("node-fetch");

module.exports = {
    enabled: commands.Utility.Crypto.Enabled,
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription(commands.Utility.Crypto.Description)
        .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true))
        .addStringOption((option) => option.setName('currency').setDescription('Crypto Currency to pay in').addChoices(
            { name: 'BTC', value: 'BTC' }, 
            { name: 'ETH', value: 'ETH' }, 
            { name: 'USDT', value: 'USDT' },
            { name: 'LTC', value: 'LTC' },
        ).setRequired(true))
                .addIntegerOption((option) => option.setName('price').setDescription(`Price in ${config.CryptoSettings.Currency}`).setRequired(true))
                .addStringOption(option => option.setName('service').setDescription('Service').setRequired(true)),
    async execute(interaction, client) {

        if(config.CryptoSettings.Enabled === false) return interaction.reply({ content: "This command has been disabled in the config!", ephemeral: true })
        if (config.CryptoSettings.OnlyInTicketChannels && !client.tickets.has(interaction.channel.id)) return interaction.reply({ content: config.Locale.NotInTicketChannel, ephemeral: true })
    
        let doesUserHaveRole = false
        for(let i = 0; i < config.CryptoSettings.AllowedRoles.length; i++) {
            role = interaction.guild.roles.cache.get(config.CryptoSettings.AllowedRoles[i]);
            if(role && interaction.member.roles.cache.has(config.CryptoSettings.AllowedRoles[i])) doesUserHaveRole = true;
          }
        if(doesUserHaveRole === false) return interaction.reply({ content: config.Locale.NoPermsMessage, ephemeral: true })


        let user = interaction.options.getUser("user");
        let currency = interaction.options.getString("currency")
        let price = interaction.options.getInteger("price");
        let service = interaction.options.getString("service");
    
        let address = ""
        let cryptoPrice = ""
        let cryptoAmount = ""
        if(currency === "BTC") address = config.CryptoAddresses.BTC
        if(currency === "ETH") address = config.CryptoAddresses.ETH
        if(currency === "USDT") address = config.CryptoAddresses.USDT
        if(currency === "LTC") address = config.CryptoAddresses.LTC
    
        if(currency === "BTC" && !config.CryptoAddresses.BTC) return interaction.reply({ content: "BTC address has not been specified in the config!", ephemeral: true })
        if(currency === "ETH" && !config.CryptoAddresses.ETH) return interaction.reply({ content: "ETH address has not been specified in the config!", ephemeral: true })
        if(currency === "USDT" && !config.CryptoAddresses.USDT) return interaction.reply({ content:"USDT address has not been specified in the config!", ephemeral: true })
        if(currency === "LTC" && !config.CryptoAddresses.LTC) return interaction.reply({ content: "LTC address has not been specified in the config!", ephemeral: true })

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
            { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.PayPalSeller}** <@!${interaction.user.id}>\n> **${config.Locale.PayPalUser}** <@!${user.id}>\n> **${config.Locale.PayPalPrice}** ${cryptoAmount} (${price} ${config.CryptoSettings.Currency})\n> **${config.Locale.cryptoLogAddress}** || ${address} ||` },
            { name: `• ${config.Locale.PayPalService}`, value: `> \`\`\`${service}\`\`\`` },
          ])
        .setFooter({ text: `${user.tag}`, iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp()

        interaction.reply({ embeds: [embed], components: [row] });
    
        let logsChannel; 
        if(!config.cryptoPayments.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.cryptoPayments.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.cryptoPayments.ChannelID);

        const log = new EmbedBuilder()
        .setColor("Green")
        .setTitle(config.Locale.cryptoLogTitle)
        .addFields([
            { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
            { name: `• ${config.Locale.PayPalUser}`, value: `> <@!${user.id}>\n> ${user.tag}` },
            { name: `• ${config.Locale.PayPalPrice}`, value: `> ${config.CryptoSettings.CurrencySymbol}${price}\n> ${cryptoAmount} ${currency}` },
            { name: `• ${config.Locale.PayPalService}`, value: `> ${service}` },
          ])
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        if (logsChannel && config.cryptoPayments.Enabled) logsChannel.send({ embeds: [log] })
    

    }

}