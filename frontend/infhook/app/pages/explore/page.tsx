"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { useHook } from "../../components/hookContext";
import { useRouter } from "next/navigation";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "../../../utils/config";

const eventSignature = keccak256(
  toBytes(
    "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
  )
);
console.log("Event Signature:", eventSignature);

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

const Explore = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { selectedHook } = useHook();
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [poolSlot, setPoolSlot] = useState<any[]>([]);
  const [tickPrices, setTickPrices] = useState<{ [key: string]: number }>({});

  console.log("Selected Hook:", selectedHook);

  const handleNavigationToPool = (pool) => {
    router.push(
      `/pages/addLiquidity?id=${pool.args.id}&token0=${pool.args.currency0}&token1=${pool.args.currency1}&fee=${pool.args.fee}&tickSpacing=${pool.args.tickSpacing}&sqrtPriceX96=${pool.args.sqrtPriceX96}&tick=${pool.args.tick}`
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
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  useEffect(() => {
    getTokenInfo(setTokenInfo);
  }, []);

  useEffect(() => {
    getEvents();
  }, [selectedHook]);

  useEffect(() => {
    if (events.length > 0) {
      events.forEach((event) => {
        getSlot(
          event.args.currency0,
          event.args.currency1,
          event.args.fee,
          event.args.tickSpacing,
          event.args.hooks,
          event.args.id
        );
      });
    }
  }, [events]);

  const getTokenSymbol = (tokenAddress: string) => {
    const token = tokenInfo.find((t) => t.tokenAddress === tokenAddress);
    return token ? token.symbol : "Unknown";
  };

  async function getSlot(
    currency0: string,
    currency1: string,
    fee: number,
    tickSpacing: number,
    hooks: string,
    id: string
  ) {
    try {
      const slot: any[] = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x3635b6d0b150d438163eaf7417812febc4030f2c",
        functionName: "getSlot0",
        args: [
          [currency0, currency1, fee, tickSpacing, hooks],
          "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac",
        ],
      });
      console.log(slot);
      const tick = Number(slot[1]); // Extract tick value from the slot's 0th index (1st element)
      const price = calculatePriceFromTick(tick);
      if (!isNaN(tick)) {
        const price = calculatePriceFromTick(tick);
        setTickPrices((prevPrices) => ({
          ...prevPrices,
          [id]: price,
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="relative border-2 border-gray-500 border-opacity-80 shadow-lg shadow-cyan-400 rounded-xl mt-16">
        <h2 className="absolute -top-3 left-4 bg-blue-800 w-16 text-center rounded-lg text-white px-2">
          Pools
        </h2>
        <div className="p-4 max-h-[500px] min-h-[500px] overflow-y-auto custom-scrollbar">
          {events.length > 0 ? (
            events.map((event, index) => {
              const symbol0 = getTokenSymbol(event.args.currency0);
              const symbol1 = getTokenSymbol(event.args.currency1);
              const price = tickPrices[event.args.id];
              return (
                <div
                  key={index}
                  className="bg-gray-800 hover:bg-blue-800 transition text-white rounded-lg shadow-md p-6 mb-6 mt-4 cursor-pointer"
                  onClick={() => handleNavigationToPool(event)}
                >
                  <h3 className="text-2xl font-bold mb-4">
                    {index + 1}. Pool: {symbol0}/{symbol1}
                  </h3>
                  {price !== undefined ? (
                    <p className="text-xs">
                      1 {symbol0} = {price.toFixed(6)} {symbol1}
                    </p>
                  ) : (
                    <p>Loading price...</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400">No events found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
