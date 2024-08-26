"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  createToken,
  getTokenInfo,
  getUserTokens,
  mintToken,
  getBalance,
} from "../../../utils/functions/createTokenFunctions";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "../../../utils/config";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const CreateToken = () => {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [userTokens, setUserTokens] = useState<
    { name: string; symbol: string }[]
  >([]);

  const handleCreateToken = async () => {
    await createToken(tokenName, tokenSymbol);
    await getTokenInfo(setTokenInfo);

    await getUserTokens(setUserTokens);
  };

  useEffect(() => {
    getTokenInfo(setTokenInfo);
    getUserTokens(setUserTokens);
  }, []);

  const handleMintToken = async (tokenAddress: string) => {
    await mintToken(tokenAddress);
    await handleGetBalance(tokenAddress);
  };

  const handleGetBalance = async (tokenAddress: string) => {
    const balance = await getBalance(tokenAddress);
    if (Number(balance) > 0) {
      const token = tokenInfo.find((t) => t.tokenAddress === tokenAddress);
      if (token) {
        setUserTokens((prevTokens) => [
          ...prevTokens,
          { name: token.name, symbol: token.symbol },
        ]);
      }
    }
  };

  async function getAllawances() {
    try {
      const allowance = await readContract(config, {
        abi: ERC20ABI,
        address: tokenInfo[0].tokenAddress,
        functionName: "allowance",
        args: [
          "0x5167e9746264C5820f5B5741461EC2c2f1FdDA0f",
          "0x7b1d96AadFD510B24D46f3371e9b2dFA1963BB11",
        ],
      });
      console.log("Allowance: ", allowance);
    } catch (error) {
      console.error(error);
    }
  }
  
  return (
    <div className="flex justify-center items-center mt-8">
      <div className="flex border-2 border-white border-opacity-80 rounded-xl w-[850px] h-[700px]">
        <div className="flex flex-col w-full p-8">
          <h1 className="text-2xl font-bold text-white">Create Token</h1>
          <div className="flex flex-col mt-4">
            <input
              type="text"
              placeholder="Token Name"
              className="bg-transparent text-white p-2"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Token Symbol"
              className="bg-transparent text-white p-2 mt-4"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
            />
            <motion.button
              className="bg-cyan-900 opacity-80 text-white py-2 px-4 rounded-xl mt-4"
              onClick={handleCreateToken}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Create Token
            </motion.button>
            <button className="text-white" onClick={() => getAllawances()}>get allowance</button>
          </div>
          <div className="flex flex-col mt-8">
            <h1 className="text-2xl font-bold text-white">All Tokens</h1>
            {tokenInfo.map((token) => (
              <div
                key={token.tokenAddress}
                className="flex flex-row space-x-4 mt-4"
              >
                <p className="text-white">{token.name}</p>
                <p className="text-white">({token.symbol})</p>
                <button
                  className="text-cyan-400"
                  onClick={() => handleMintToken(token.tokenAddress)}
                >
                  Mint
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col mt-8">
            <h1 className="text-2xl font-bold text-white">Your Tokens</h1>
            {userTokens.map((token) => (
              <div key={token.name} className="flex justify-between mt-4">
                <p className="text-white">{token.name}</p>
                <p className="text-white">{token.symbol}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateToken;
