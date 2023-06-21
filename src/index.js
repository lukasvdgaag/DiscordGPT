const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    SlashCommandStringOption,
    ContextMenuCommandBuilder,
    ApplicationCommandType
} = require('discord.js');
const {GptMessenger} = require("./GptMessenger");
const InteractionsHandler = require("./InteractionsHandler");
const CooldownManager = require("./CooldownManager");
require('dotenv').config({path: __dirname.replace('\\src', '') + "/.env"});

const messenger = new GptMessenger();
const cooldownManager = new CooldownManager();
const interactionsHandler = new InteractionsHandler(cooldownManager, messenger);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ]
});

client.on('ready', () => {
    console.log(`Bot is ready. Logged in as ${client.user.tag}`);
    createCommands();

    setTimeout(cooldownManager.flushExpiredCooldowns, 1000 * 60 * 5); // 5 minutes
});

client.on('interactionCreate', async interaction => {
    await interactionsHandler.handleInteraction(interaction);
});

function createCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('aggressiveness')
            .setDescription('Analyzes the aggressiveness of a message')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('message')
                    .setDescription('The message to analyze')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('analyze')
            .setDescription('Analyzes the entire message on tone, sentiment, and intent')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('message')
                    .setDescription('The message to analyze')
                    .setRequired(true)
            ),
        new ContextMenuCommandBuilder()
            .setName('Check Aggression')
            .setType(ApplicationCommandType.Message),
        new ContextMenuCommandBuilder()
            .setName('Analyze Message')
            .setType(ApplicationCommandType.Message)
    ];

    client.application.commands.set(commands)
        .catch(console.error);
}

client.login(process.env.DISCORD_BOT_TOKEN);