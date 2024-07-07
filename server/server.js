const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const balancesPath = path.join(__dirname, 'balances.json');
let balances = {};

if (fs.existsSync(balancesPath)) {
  balances = JSON.parse(fs.readFileSync(balancesPath, 'utf8'));
}

const saveBalances = () => {
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
};

app.use(bodyParser.json());

app.post('/callback', (req, res) => {
  const { userId, amount, confirmed } = req.body;

  if (confirmed) {
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += amount;
    saveBalances();
    console.log(`User ${userId} balance updated with amount ${amount}`);
  }

  res.status(200).send('Callback received');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
