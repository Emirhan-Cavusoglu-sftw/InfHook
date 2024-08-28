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

  return (
    <div className="flex justify-center items-start mt-8 space-x-8">
      {/* All Tokens Section */}
      <div className="flex flex-col bg-transparent border-2 border-gray-500 border-opacity-80 shadow-lg shadow-cyan-400 w-[500px] h-[700px] rounded-xl p-4">
        <h1 className="text-2xl font-bold text-white mb-4">All Tokens</h1>
        <div className="flex flex-col space-y-2 overflow-y-auto custom-scrollbar h-full">
          {tokenInfo.map((token) => (
            <div
              key={token.tokenAddress}
              className="flex flex-row justify-between items-center bg-gray-800 text-white p-2 rounded-lg"
            >
              <div>
                <p>{token.name}</p>
                <p className="text-gray-400">({token.symbol})</p>
              </div>
              <button
                className="text-white w-16 h-8 bg-blue-800 hover:bg-blue-950 transition rounded-lg"
                onClick={() => handleMintToken(token.tokenAddress)}
              >
                Mint
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Token and Your Tokens Section */}
      <div className="flex flex-col bg-transparent border-2 border-gray-500 border-opacity-80 shadow-lg shadow-cyan-400 w-[500px] h-[700px] rounded-xl p-8">
        <h1 className="text-2xl font-bold text-white">Create Token</h1>
        <div className="flex flex-col mt-4">
          <input
            type="text"
            placeholder="Token Name"
            className="bg-transparent text-white p-2 border-b border-gray-600"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Token Symbol"
            className="bg-transparent text-white p-2 mt-4 border-b border-gray-600"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
          />
          <motion.button
            className="bg-blue-800 hover:bg-blue-950 opacity-80 text-white py-2 px-4 rounded-xl mt-4"
            onClick={handleCreateToken}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.7 }}
          >
            Create Token
          </motion.button>
        </div>

        <div className="flex flex-col mt-8 h-full">
          <h1 className="text-2xl font-bold text-white mb-4">Your Tokens</h1>
          <div className="flex flex-col space-y-2 overflow-y-auto custom-scrollbar h-full">
            {userTokens.map((token) => (
              <div
                key={token.name}
                className="flex justify-between items-center bg-gray-800 text-white p-2 rounded-lg"
              >
                <p>{token.name}</p>
                <p className="text-gray-400">({token.symbol})</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateToken;
