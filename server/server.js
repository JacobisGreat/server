const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, Intents } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ['CHANNEL'] });

const balancesPath = path.join(__dirname, 'balances.json');
let balances = {};

if (fs.existsSync(balancesPath)) {
  balances = JSON.parse(fs.readFileSync(balancesPath, 'utf8'));
}

const saveBalances = () => {
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
};

app.use(bodyParser.json());

app.post('/callback', async (req, res) => {
  const { userId, amount, confirmed } = req.body;

  if (confirmed) {
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += amount;
    saveBalances();
    console.log(`User ${userId} balance updated with amount ${amount}`);

    try {
      const user = await client.users.fetch(userId);
      await user.send(`Your transaction of ${amount} BTC has been confirmed and your balance has been updated.`);
    } catch (error) {
      console.error(`Error sending DM to user ${userId}:`, error);
    }
  }

  res.status(200).send('Callback received');
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login('YOUR_DISCORD_BOT_TOKEN');

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
