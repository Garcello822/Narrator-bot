const Discord = require("discord.js")
const db = require("quick.db")

const cooldowns = new Discord.Collection()
const prefix = process.env.PREFIX

module.exports = (client) => {
  //When receiving a message
  client.on("message", (message) => {
    let maint = db.get("maintenance")
    if(maint && !client.botAdmin(message.author.id)) return message.channel.send("Sorry! The bot is currently in maintenance mode!")
    function yaises(x) {
      client.commands.get(x).run(message)
    }

    //let guy = message.member.nickname;
    if (message.author.bot) return //Ignore bots and dms

    if (!message.content.startsWith("+")) {
      if (message.guild.id == "472261911526768642") {
        if (db.get(`rolecmitime_${message.author.id}`)) {
          let allroles = ["Alchemist", "Grave Robber", "Fortune Teller", "Kitten Wolf", "Pacifist", "Spirit Seer", "Sheriff", "Werewolf Berserk", "Wolf Pacifist", "Cupid", "President", "Mayor", "Grumpy Grandma", "Seer Apprentice", "Tough Guy", "Loudmouth", "Sorcerer", "Flower Child", "Guardian Wolf", "Beast Hunter", "Avenger", "Witch", "Detective", "Forger", "Cursed", "Marksman", "Red Lady", "Junior Werewolf", "Nightmare Werewolf", "Shadow Wolf", "Random Regular Villager", "Random Strong Villager", "Random Werewolf", "Random Killer", "Random Voting", "Random", "Arsonist", "Sect Leader", "Bomber", "Zombie", "Corruptor", "Cannibal", "Illusionist", "Bandit"]

          let rolesPlayerHas = ["Villager", "Gunner", "Doctor", "Bodyguard", "Seer", "Jailer", "Priest", "Aura Seer", "Medium", "Werewolf", "Alpha Werewolf", "Wolf Shaman", "Wolf Seer", "Fool", "Headhunter", "Serial Killer"]

          let boughtroles = db.get(`boughtroles_${message.author.id}`) || []

          boughtroles.forEach((role) => {
            rolesPlayerHas.push(role)
          })

          if (!allroles.includes(`${message.content[0].toUpperCase()}${message.content.slice(1).toLowerCase()}`)) return message.channel.send("Role not found!")
          if (!rolesPlayerHas.includes(`${message.content[0].toUpperCase()}${message.content.slice(1).toLowerCase()}`)) return message.channel.send("You did not buy this role!")
        }
      }
    }

    // blacklists
    let blacklists = db.get(`blacklistss`) || []
    //console.log(blacklists)
    if (message.channel.type != "dm") {
      if (message.guild.id == "472261911526768642" && message.channel.name == "day-chat") {
        if ((message.content.includes("#priv") || message.content.includes("<#")) && !message.member.permissions.has(["MANAGE_ROLES"])) {
          message.delete()
          message.channel.send(`${message.author} This is a warning! Do not mention your channel!`)
        }
      }
      if ((message.content.includes("fuck") || message.content.includes("fúck")) && (message.channel.name == "enter-game" || message.channel.name == "player-commands")) {
        message.member.addRole("607926461726457879")
        message.delete()
        message.reply("WATCH YOUR LANG! ")
        let ch = message.guild.channels.find((m) => m.name === "game-lobby")
        ch.overwritePermissions(message.author.id, { SEND_MESSAGES: false })
      }
      if (message.content == "-pls snipe") {
        message.delete()
        message.channel.send(`We're no strangers to love
  You know the rules and so do I
  A full commitment's what I'm thinking of
  You wouldn't get this from any other guy
  
  I just wanna tell you how I'm feeling
  Gotta make you understand
  `)
      }

      if (message.guild.id == "472261911526768642" && message.channel.name == "day-chat" && message.member.roles.cache.has("606140092213624859") && message.content.length > 140) {
        message.delete()
        return message.channel.send("Maximum length for messages are 140 characters!")
      }
      if (message.guild.id == "472261911526768642" && message.channel.name == "day-chat" && message.member.roles.cache.has("606140092213624859") && message.content.includes("\n")) {
        message.delete()
        return message.channel.send("You can only send one line per message!")
      }
    }

    //If user mentions bot
    if (message.content === "<@!549402544066002955>") return message.author.send(`Hey! My prefix is ${prefix}, you can ask for \`${prefix}help\` if you ever need.`)

    if (!message.content.startsWith(prefix)) return
    if (blacklists.includes(`/${message.author.id}/`) && message.author.id != "552814709963751425") return message.channel.send("Blacklisted users can't use any command!")

    const args = message.content.slice(prefix.length).split(/ +/)
    const commandName = args.shift().toLowerCase()
    const command =
      client.commands.get(commandName) || //DO NOT PUT ;
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
    if (!command) return //If such command doesn't exist, ignore it

    //Ignore guild-only commands inside DMs
    if (command.guildOnly && message.channel.type !== "text") {
      return message.reply("I can't execute that command in DMs!")
    }

    if (command.gameOnly && message.guild.id != "472261911526768642") return message.channel.send("That command can only be used in the game server!")

    //Check if that command needs arguments

    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`
      if (command.usage) {
        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``
      }
      return message.channel.send(reply)
    }

    //Check if command is in cooldown
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection())
    }
    const now = Date.now()
    const timestamps = cooldowns.get(command.name)
    const cooldownAmount = (command.cooldown || 0) * 1000
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000
        return message.reply(`please wait ${Math.ceil(timeLeft.toFixed(1))} more seconds before reusing the \`${command.name}\` command.`)
      }
    }
    timestamps.set(message.author.id, now)
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)

    //Execute command if everything is ok
    try {
      client.channels.cache.get("783013534560419880").send(`Command ran: **${commandName}**\nArguments: **${args.join(" ") || "None"}**\nAuthor: ${message.author.tag} (${message.author.id})`)
      command.run(message, args, client)
    } catch (error) {
      console.error(error)
      message.reply("Something went wrong...")
    }
  })
}