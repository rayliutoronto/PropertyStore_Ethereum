module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "4", // Rinkeby ID 4
      from: "0xdF6E800401dC176c4D21722A38718d8A5086b7F5", // account from which to deploy
      gas: 4700000
     },
     ropsten: {
      host: "localhost",
      port: 8545,
      network_id: "3", // Ropsten ID 3
      from: "0x000a4cD1E4D38eC15eF798BB7604330944974eff", // account from which to deploy
      gas: 4700000
     }
  }
};
