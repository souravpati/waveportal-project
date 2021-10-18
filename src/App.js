import React, {useEffect, useState, Component} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';


const App = () => {

  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalCount, setTotalCount] = useState("");
  const [loading, setLoading] = useState(false);

  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0xE2f5B185635E306F4e37DfaDb5CAeB805D176739";

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      // First make sure we have access to window.ethereum
      const { ethereum } = window;
      
      if (!ethereum) {
        //alert("Make sure you have MetaMask")
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      getAllWaves();
      
      /*
      Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        var message = document.getElementById("message").value

        //console.log("message:", message);

        if(message === "") {
          message = "No Message";
        }

        console.log("message:", message);

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setLoading(false);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalCount(count.toNumber())
        getAllWaves();
        /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!");
        alert("Connect Etherium Wallet!");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hello my friend!
        </div>

        <div className="bio">
        I am Sourav and welcome to my first Ethereum project. I have worked on parallel computing, media streaming, AI, IoT. So that's pretty cool, right? Connect your Ethereum wallet and wave at me! and drop me a message!
        </div>

        <input type="text" id="message" className="advancedMessageTextBox" />
        

        {!loading && (
          <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        )}
        {loading && (
          <button className="waveButton" onClick={null}>
          Adding your wave to Ethereum ...
        </button>
        )}
        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {totalCount && (
          <div className="totalCount">
        Total Wave count: [{totalCount}]
        </div>
        )}
        {!totalCount && (
          <div className="totalCount">
        Click "Wave at me" to see total count
        </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
        
      </div>
    </div>
  );
}

export default App