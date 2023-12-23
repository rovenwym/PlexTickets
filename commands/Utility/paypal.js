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
const utils = require("../../utils.js");

exports.run = async (client, message, args) => {
    if(config.PayPalSettings.Enabled === false) return;
    if (config.PayPalSettings.OnlyInTicketChannels && !client.tickets.has(message.channel.id)) return message.channel.send(config.Locale.NotInTicketChannel).then(msg => setTimeout(() => msg.delete(), 5000));

    let doesUserHaveRole = false
    for(let i = 0; i < config.PayPalSettings.AllowedRoles.length; i++) {
        role = message.guild.roles.cache.get(config.PayPalSettings.AllowedRoles[i]);
        if(role && message.member.roles.cache.has(config.PayPalSettings.AllowedRoles[i])) doesUserHaveRole = true;
      }
    if(doesUserHaveRole === false) return message.reply(config.Locale.NoPermsMessage)

    let invalidusage = new EmbedBuilder()
    .setColor("Red")
    .setDescription('Too few arguments given\n\nUsage:\n``paypal <@user> <price> <service>``')

    let price = args[1];
    let service = args.slice(2).join(" ");
    let user = message.mentions.users.first()
    if(!user) return message.reply({ embeds: [invalidusage] })
    if(!price) return message.reply({ embeds: [invalidusage] })
    if(!service) return message.reply({ embeds: [invalidusage] })
    if((isNaN(price))) return message.reply({ embeds: [invalidusage] })

    let invoiceObject = {
      "merchant_info": {
        "email": config.PayPalSettings.Email,
        "business_name": message.guild.name,
      },
      "items": [{
        "name": service,
        "quantity": 1.0,
        "unit_price": {
          "currency": config.PayPalSettings.Currency,
          "value": price
        },
      }],
      "logo_url": message.guild.iconURL(),
      "note": "",
      "payment_term": {
        "term_type": "NET_45"
      },
      "tax_inclusive": false,
    }

    client.paypal.invoice.create(invoiceObject, (err, invoice) => {
      if (err) {
        if(err.response.error === "invalid_client") {
          console.log('\x1b[31m%s\x1b[0m', `[ERROR] The PayPal API Credentials you specified in the config are invalid! Make you sure you use the "LIVE" mode!`)
        } else {
          console.log(err)
        }
      } else {
        client.paypal.invoice.send(invoice.id, function(error, rv) {
          if (err) {
            console.log(err);
          } else {

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle('Link')
                    .setURL(`https://www.paypal.com/invoice/payerView/details/${invoice.id}`) 
                    .setLabel(config.Locale.PayPalPayInvoice))

            const embed = new EmbedBuilder()
            .setTitle(config.Locale.PayPalInvoiceTitle)
            .setColor(config.EmbedColors)
            .setThumbnail("https://www.freepnglogos.com/uploads/paypal-logo-png-7.png")
            .setDescription(config.Locale.PayPalInvoiceMsg)
            .addFields([
                { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.PayPalSeller}** <@!${message.author.id}>\n> **${config.Locale.PayPalUser}** <@!${user.id}>\n> **${config.Locale.PayPalPrice}** ${config.PayPalSettings.CurrencySymbol}${price} (${config.PayPalSettings.Currency})\n> **${config.Locale.suggestionStatus}** 🔴 UNPAID` },
                { name: `• ${config.Locale.PayPalService}`, value: `> \`\`\`${service}\`\`\`` },
              ])
            .setTimestamp()
            .setFooter({ text: `${user.tag}`, iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
            message.channel.send({ embeds: [embed], components: [row] }).then(async function(msg) {

              await client.paypalInvoices.ensure(`${invoice.id}`, {
                userID: user.id,
                sellerID: message.author.id,
                channelID: message.channel.id,
                messageID: msg.id,
                invoiceID: invoice.id,
                price: price,
                service: service,
                status: invoice.status,
              });

                let logsChannel; 
                if(!config.paypalInvoice.ChannelID) logsChannel = message.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
                if(config.paypalInvoice.ChannelID) logsChannel = message.guild.channels.cache.get(config.paypalInvoice.ChannelID);

                const log = new EmbedBuilder()
                .setColor("Green")
                .setTitle(config.Locale.PayPalLogTitle)
                .addFields([
                    { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${message.author.id}>\n> ${message.author.tag}` },
                    { name: `• ${config.Locale.PayPalUser}`, value: `> <@!${user.id}>\n> ${user.tag}` },
                    { name: `• ${config.Locale.PayPalPrice}`, value: `> ${config.PayPalSettings.CurrencySymbol}${price}` },
                    { name: `• ${config.Locale.PayPalService}`, value: `> ${service}` },
                  ])
                .setTimestamp()
                .setThumbnail(message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setFooter({ text: `${message.author.tag}`, iconURL: `${message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

                if (logsChannel && config.paypalInvoice.Enabled) logsChannel.send({ embeds: [log] })

                let checkInvoice = setInterval(async () => {
                  await utils.checkPayPalPayments()
        
                  if(await client.paypalInvoices.get(`${invoice.id}`, "status") === "paid") {
                    await clearInterval(checkInvoice);
                    await client.paypalInvoices.delete(invoice.id)
                    return
                  }

                  if(await client.paypalInvoices.get(`${invoice.id}`, "status") === "deleted") {
                    await clearInterval(checkInvoice);
                    await client.paypalInvoices.delete(invoice.id)
                    return
                  }
        
              }, 30000);

                })
              }
            })
          }
        })

}


module.exports.help = {
  name: 'paypal',
  enabled: commands.Utility.Paypal.Enabled
}