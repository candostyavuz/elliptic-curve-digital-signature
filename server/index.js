const express = require('express');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');

const app = express();
const cors = require('cors');
const port = 3042;
const FAUCET_NUMBER = 10;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {};

for(let i =0; i<FAUCET_NUMBER; i++){
  const key = ec.genKeyPair();  // this is cryptographically random!
  const publicKey = key.getPublic().encode('hex');

  balances[publicKey] = 50;
  console.log("Public Key: " + publicKey);
  console.log("Balance: " + balances[publicKey]);
  console.log("Private Key: " + key.getPrivate().toString(16));
  console.log("___");
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {signature, message, publicKey} = req.body;
  // Verification:
  const key = ec.keyFromPublic(publicKey, 'hex');
  const msgHash = SHA256(JSON.stringify(message)).toString();
  console.log(key.verify(msgHash, signature));

  if(key.verify(msgHash, signature))
  {
    console.log(req.body);
    balances[publicKey] -= message.amount;
    balances[message.recipient] = (balances[message.recipient] || 0) + + message.amount;
    console.log(balances[publicKey]);
    console.log(balances[message.recipient]);
  } 
  res.send({ balance: balances[publicKey] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
