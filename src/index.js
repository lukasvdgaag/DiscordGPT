const {Client, Events, GatewayIntentBits, SlashCommandBuilder, SlashCommandStringOption, EmbedBuilder} = require('discord.js');
const GptMessenger = require("./GptMessenger");
require('dotenv').config();

const messenger = new GptMessenger();

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
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const {commandName, options} = interaction;

    if (commandName === 'aggressiveness') {
        const message = options.getString('message');

        await interaction.deferReply();

        let response = await messenger.measureAggressiveness(message);
        if (response == null) {
            await interaction.editReply("I couldn't connect to the OpenAI API, sorry.");
            return;
        }

        try {
            response = JSON.parse(response);
            if (!response?.rating || !response?.explanation) {
                await interaction.editReply("I couldn't understand ChatGPT's response. Please try again.");
                return;
            }

            console.log('Rating:', response.rating);
            console.log('Explanation:', response.explanation);

            const embed = new EmbedBuilder()
                .setTitle('Aggressiveness Analysis')
                .setDescription(`An analysis of the aggressiveness of the message that was submitted by <@${interaction.user.id}>.`)
                .setColor(generateColor(response.rating))
                .addFields(
                    {name: 'Score', value: `${parseFloat(response.rating).toFixed(1)}`},
                    {name: 'Message', value: getOriginalMessage(message)},
                    {name: 'Explanation', value: response.explanation}
                );

            await interaction.editReply({embeds: [embed]});
        } catch (e) {
            console.log(e)
            await interaction.editReply(`I did not receive a valid response from ChatGPT. Here is the response I received: \`\`\`\n${response}\n\`\`\``);
        }
    }
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
            )
    ];

    client.application.commands.set(commands)
        .catch(console.error);
}

function getOriginalMessage(message) {
    const len = message.length;
    if (len >= 1500) {
        return message.substring(0, 1500) + '...';
    }

    return message;
}

function generateColor(aggressiveness) {
    const colors = [
        "#05ff00",
        "#2cff00",
        "#73ff00",
        "#cdff00",
        "#ffbc00",
        "#ff6e00",
        "#ff4000",
        "#ff1e00",
        "#ff0500",
        "#ff000d",
    ];

    const index = Math.max(Math.min(aggressiveness - 1, colors.length - 1), 0);
    return colors[index];
}

client.login(process.env.DISCORD_BOT_TOKEN);