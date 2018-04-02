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
      from: "0xA876E8D0a649cD887D6DE83eef0193CC61eB3AE1", // account from which to deploy
      gas: 4700000
     }
  }
};
