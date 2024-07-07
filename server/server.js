require('dotenv').config();  // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, Intents } = require('discord.js');

// Set up Discord bot client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });
const token = process.env.DISCORD_BOT_TOKEN; // Access the token from environment variables

client.login(token);

const app = express();
const port = 3000;

// Paths to store data
const balancesPath = path.join(__dirname, 'balances.json');
let balances = {};

// Load existing balances if any
if (fs.existsSync(balancesPath)) {
  balances = JSON.parse(fs.readFileSync(balancesPath, 'utf8'));
}

// Function to save balances to a file
const saveBalances = () => {
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
};

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Callback endpoint
app.post('/callback', async (req, res) => {
  const { value, input_address, confirmations, data, currency } = req.body;

  // Log the received data for debugging
  console.log('Received callback:', req.body);

  if (confirmations >= 1) {  // Process only if the transaction has at least 1 confirmation
    const userId = data.userId;

    // Update the user's balance
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += value;
    saveBalances();

    console.log(`User ${userId} balance updated with amount ${value} ${currency}`);

    // Notify the user via Discord
    try {
      const user = await client.users.fetch(userId);
      user.send(`Your transaction of ${value} ${currency.toUpperCase()} has been confirmed and your balance has been updated.`);
    } catch (error) {
      console.error('Error sending Discord message:', error);
    }

    // Respond with 'ok' to stop further callbacks
    res.status(200).send('ok');
  } else {
    // Respond with a 200 status but do not acknowledge to keep receiving updates
    res.status(200).send('Transaction not confirmed yet');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
