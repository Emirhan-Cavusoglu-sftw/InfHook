"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { useHook } from "../../components/hookContext";
import { useRouter } from "next/navigation";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);

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

  const getTokenSymbol = (tokenAddress: string) => {
    const token = tokenInfo.find((t) => t.tokenAddress === tokenAddress);
    return token ? token.symbol : "Unknown";
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {events.length > 0 ? (
        events.map((event, index) => {
          const symbol0 = getTokenSymbol(event.args.currency0);
          const symbol1 = getTokenSymbol(event.args.currency1);

          return (
            <div
              key={index}
              className="bg-neutral-800 text-white rounded-lg shadow-md p-6 mb-6"
              onClick={() => handleNavigationToPool(event)}
            >
              <h3 className="text-xl font-bold mb-4">
                {index + 1}. Pool: {symbol0}/{symbol1}
              </h3>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-400">No events found</p>
      )}
    </div>
  );
};

export default Explore;
