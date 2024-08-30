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
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";

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
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [tickPrices, setTickPrices] = useState<{ [key: string]: number }>({});
  const [poolInfoPopup, setPoolInfoPopup] = useState(false);

  useEffect(() => {
    fetchTokenInfo();
  }, []);

  useEffect(() => {
    if (selectedHook && tokenInfo.length > 0) {
      getEvents(); // `selectedHook` değeri ve token bilgileri hazır olduğunda havuzları çek
    }
  }, [selectedHook, tokenInfo]);

  console.log("Selected Hook:", selectedHook);

  const handleNavigationToPool = (pool) => {
    const token0 = tokenInfo.find(
      (token) => token.tokenAddress === pool.args.currency0
    );
    const token1 = tokenInfo.find(
      (token) => token.tokenAddress === pool.args.currency1
    );

    const tokenSymbol1 = token0 ? token0.symbol : "Unknown";
    const tokenSymbol2 = token1 ? token1.symbol : "Unknown";
    router.push(
      `/pages/addLiquidity?id=${pool.args.id}&token0=${pool.args.currency0}&token1=${pool.args.currency1}&fee=${pool.args.fee}&tickSpacing=${pool.args.tickSpacing}&sqrtPriceX96=${pool.args.sqrtPriceX96}&tick=${pool.args.tick}&price=${tickPrices}&hooks=${pool.args.hooks}&tokenSymbol1=${tokenSymbol1}&tokenSymbol2=${tokenSymbol2}`
    );
  };

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
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const fetchTokenInfo = async () => {
    const tokens = await getTokenInfo(setTokenInfo);
    getEvents();
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

    // Fetch and calculate the price for each filtered pool
    for (let pool of filtered) {
      getSlotAndCalculatePrice(pool);
    }
  };

  async function getSlotAndCalculatePrice(events: Event[]) {
    try {
      const slot: any[] = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x3635b6d0b150d438163eaf7417812febc4030f2c",
        functionName: "getSlot0",
        args: [
          [
            events.args.currency0,
            events.args.currency1,
            events.args.fee,
            events.args.tickSpacing,
            events.args.hooks,
          ],
          "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac",
        ],
      });
      const tick = Number(slot[1]); // Ensure tick is a number
      if (!isNaN(tick)) {
        const price = calculatePriceFromTick(tick);
        setTickPrices((prevPrices) => ({
          ...prevPrices,
          [events.args.id]: price,
        }));
      } else {
        console.error("Tick is not a number:", tick);
      }
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const calculatePriceFromTick = (tick: number) => {
    return Math.pow(1.0001, tick);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col justify-center items-center w-[1000px] mt-44">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-2xl font-bold text-white">Pools</h1>
          <div>
            <motion.button
              className="bg-blue-800 hover:bg-blue-950 w-36 opacity-80 text-white py-2 px-4 rounded-xl"
              onClick={() => handleNavigation("/pages/createPool")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Create Pool
            </motion.button>
            <button
              onClick={() => setPoolInfoPopup(true)}
              className="ml-2 text-white opacity-60 text-lg"
            >
              ?
            </button>
          </div>
        </div>

        <div className="bg-transparent border-gray-500 border-opacity-80 border-2 p-6 rounded-lg shadow-lg shadow-cyan-400 w-full overflow-y-auto custom-scrollbar max-h-[400px]">
          {filteredPools.length > 0 ? (
            <ul className="space-y-2">
              {filteredPools.map((events, index) => {
                const token0 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency0
                );
                const token1 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency1
                );
                const price = tickPrices[events.args.id];

                return (
                  <li
                    key={index}
                    className="text-white text-xl bg-gray-800 hover:bg-blue-800 transition p-4 rounded-lg cursor-pointer flex flex-row justify-between "
                    onClick={() => handleNavigationToPool(events)}
                  >
                    <div>
                      <p>
                        {token0?.name}/{token1?.name} ({token0?.symbol}/
                        {token1?.symbol})
                      </p>
                      {price !== undefined ? (
                        <p className="text-xs mt-2">
                          1 {token0?.symbol} = {price.toFixed(6)}{" "}
                          {token1?.symbol}
                        </p>
                      ) : (
                        <p>Loading price...</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : isDataFetched ? (
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
          ) : (
            <p className="text-center text-white">Loading...</p>
          )}
        </div>
        {poolInfoPopup && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            id="popupOverlay"
            onClick={() => setPoolInfoPopup(false)}
          >
            <div className=" bg-blue-800 w-[600px] text-white p-4 rounded-lg z-50 text-xl space-y-4">
              <p>
                If you navigate to the <strong>“My Positions”</strong> section
                and then to the <strong>“Create Pool”</strong> tab, you can
                create a pool tailored to your preferences. In this section, you
                can:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Select the Tokens:</strong> Choose the tokens you want
                  to pair in the pool.
                </li>
                <li>
                  <strong>Set the Initial Price Ratio:</strong> Determine the
                  starting price of the tokens in the pool by setting the
                  initial price ratio.
                </li>
                <li>
                  <strong>Adjust Other Parameters:</strong> Configure additional
                  parameters like the fee and tick spacing.
                </li>
              </ul>
              <p>
                If the site is in <strong>Nezlobin mode</strong>, the dynamic
                fee field will automatically populate with a value. This value
                signifies that the pool carries the dynamic fee flag, essential
                for pools utilizing the Nezlobin hook.
              </p>
              <p>
                You also have the flexibility to customize the price ratios to
                establish the initial trading conditions for your pool.
                Additionally, you have full control over selecting the tokens
                you want to use, enabling you to create pools that align with
                your trading or liquidity provision strategies—whether in
                standard Uniswap v4 mode or when using specialized hooks like{" "}
                <strong>Nezlobin</strong>
                {" "}or <strong>Limit Order</strong>.
              </p>
            </div>{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pools;
