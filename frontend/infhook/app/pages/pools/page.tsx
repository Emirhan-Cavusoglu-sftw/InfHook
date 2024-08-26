"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { motion } from "framer-motion";
import { useHook } from "../../components/hookContext";
import { getAccount, readContract } from "@wagmi/core";
import { keccak256, toBytes } from "viem";
import { decodeEventLog } from "viem";
import { config } from "../../../utils/config";
import {
  getUserTokens,
  getBalance,
  getTokenInfo,
} from "../../../utils/functions/createTokenFunctions";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";

const eventSignature = keccak256(
  toBytes(
    "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
  )
);

interface Event {
  args: {
    currency0: string;
    currency1: string;
    fee: number;
    hooks: string;
    id: string;
    sqrtPriceX96: bigint;
    tick: number;
    tickSpacing: number;
  };
  eventName: string;
}

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const Pools = () => {
  const router = useRouter();
  const { selectedHook } = useHook();
  const account = getAccount(config);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredPools, setFilteredPools] = useState<Event[]>([]);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [userTokens, setUserTokens] = useState<
    { name: string; symbol: string }[]
  >([]);

  useEffect(() => {
    getEvents();
    fetchTokenInfo();
  }, [selectedHook]);

  console.log("Selected Hook:", selectedHook);

  async function getEvents() {
    try {
      const response = await fetch(
        "https://opencampus-codex.blockscout.com/api/v2/addresses/0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac/logs"
      );
      const data = await response.json();

      const decodedEvents: Event[] = [];

      for (let item of data.items) {
        // Filter events by the specific topic
        if (item.topics[0].toLowerCase() === eventSignature.toLowerCase()) {
          const decodedEvent = decodeEventLog({
            abi: PoolManagerABI,
            data: item.data,
            topics: item.topics.slice(0, 8),
          });
          console.log(decodedEvent);

          if (
            decodedEvent.args.hooks.toLowerCase() === selectedHook.toLowerCase()
          ) {
            decodedEvents.push({
              args: {
                currency0: decodedEvent.args.currency0,
                currency1: decodedEvent.args.currency1,
                fee: decodedEvent.args.fee,
                hooks: decodedEvent.args.hooks,
                id: decodedEvent.args.id,
                sqrtPriceX96: BigInt(decodedEvent.args.sqrtPriceX96),
                tick: decodedEvent.args.tick,
                tickSpacing: decodedEvent.args.tickSpacing,
              },
              eventName: decodedEvent.eventName,
            });
          }
        }
      }
      setEvents(decodedEvents);
      handleGetBalance(decodedEvents);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const fetchTokenInfo = async () => {
    const tokens = await getTokenInfo(setTokenInfo);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleGetBalance = async (pools: Event[]) => {
    const userTokens: string[] = [];

    for (let token of tokenInfo) {
      const balance = await getBalance(token.tokenAddress);
      if (Number(balance) > 0) {
        userTokens.push(token.tokenAddress);
      }
    }

    setUserTokens(userTokens);

    const filtered = pools.filter(
      (pool) =>
        userTokens.includes(pool.args.currency0) ||
        userTokens.includes(pool.args.currency1)
    );

    setFilteredPools(filtered);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col justify-center items-center w-[1000px] mt-44">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-2xl font-bold text-white">Pools</h1>
          <motion.button
            className="bg-cyan-900 opacity-80 text-white py-2 px-4 rounded-xl"
            onClick={() => handleNavigation("/pages/createPool")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Create Pool
          </motion.button>
        </div>

        <div className="bg-transparent border-white border-[0.05px] border-opacity-30 p-6 rounded-lg shadow-lg w-full">
          {filteredPools.length > 0 ? (
            <ul className="space-y-2">
              {filteredPools.map((events, index) => {
                const token0 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency0
                );
                const token1 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency1
                );

                return (
                  <li
                    key={index}
                    className="text-white text-lg bg-neutral-800 p-4 rounded-lg"
                  >
                    {token0?.symbol}/{token1?.symbol}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-transparent rounded-lg">
              <svg
                fill="rgba(255, 255, 255, 0.8)"
                width="100px"
                height="100px"
                viewBox="-2 -4 24 24"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMinYMin"
                className="jam jam-box-f mb-4"
              >
                <path d="M20 5H0V3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2zm0 2v6a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V7h6.126a4.002 4.002 0 0 0 7.748 0H20z" />
              </svg>
              <p className="text-white">
                Your active liquidity positions will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pools;
