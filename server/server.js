const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const walletsPath = path.join(__dirname, '../../wallets.json');
const balancesPath = path.join(__dirname, '../../balances.json');

let wallets = {};
let balances = {};

if (fs.existsSync(walletsPath)) {
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
}

if (fs.existsSync(balancesPath)) {
  balances = JSON.parse(fs.readFileSync(balancesPath, 'utf8'));
}

const saveWallets = () => {
  fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
};

const saveBalances = () => {
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
};

module.exports = {
  data: {
    name: 'deposit',
    description: 'Deposit cryptocurrency',
    options: [
      {
        name: 'type',
        type: 3, // STRING type
        description: 'The type of cryptocurrency (BTC, LTC, TBTC)',
        required: true,
        choices: [
          { name: 'Bitcoin', value: 'BTC' },
          { name: 'Litecoin', value: 'LTC' },
          { name: 'Testnet Bitcoin', value: 'TBTC' }
        ]
      }
    ]
  },
  async execute(interaction) {
    const userId = interaction.user.id;
    const cryptoType = interaction.options.getString('type').toLowerCase();

    if (!wallets[userId]) {
      wallets[userId] = {};
    }

    if (!wallets[userId][cryptoType]) {
      try {
        // Create a new wallet address
        const response = await axios.post(`https://apirone.com/api/v2/accounts/apr-140204c00ea0b4866588b650713a7680/addresses`, {
          currency: cryptoType,
          callback: {
            method: 'POST',
            url: 'https://your-app-name.onrender.com/callback', // Your callback URL from Render
            data: { userId }
          }
        });

        const walletAddress = response.data.address;

        // Save wallet details
        wallets[userId][cryptoType] = { address: walletAddress };
        saveWallets();

      } catch (error) {
        console.error('Error creating wallet address:', error.response ? error.response.data : error.message);
        return interaction.reply({ content: `Error creating wallet address: ${error.response ? error.response.data.message : error.message}`, ephemeral: true });
      }
    }

    const walletAddress = wallets[userId][cryptoType].address;

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Deposit Address')
      .setDescription(`Your ${cryptoType.toUpperCase()} deposit address is:\n\`${walletAddress}\``)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
