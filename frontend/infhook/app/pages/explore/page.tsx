"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import {
  addLiquidity,
  getLiquidityDelta,
  Approve,
} from "../../../utils/functions/addLiquidityFunctions";
import { waitForTransactionReceipt } from "@wagmi/core";
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

const Explore = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [token0Amount, setToken0Amount] = useState<string>("");
  const [token1Amount, setToken1Amount] = useState<string>("");
  const [lowerPrice, setLowerPrice] = useState<string>("");
  const [upperPrice, setUpperPrice] = useState<string>("");

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
      setEvents(decodedEvents);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const calculateTick = (price: number, tickSpacing: number): number => {
    const tick = Math.log(price) / Math.log(1.0001);
    return Math.ceil(tick / tickSpacing) * tickSpacing;
  };

  const handleAddLiquidity = async () => {
    if (!selectedEvent) return;

    const lowerTick = calculateTick(
      Number(lowerPrice),
      selectedEvent.args.tickSpacing
    );
    const upperTick = calculateTick(
      Number(upperPrice),
      selectedEvent.args.tickSpacing
    );

    const approve1hash = await Approve(selectedEvent.args.currency0);
    const approve2hash = await Approve(selectedEvent.args.currency1);

    const transactionReceipt = await waitForTransactionReceipt(config, {
      hash: approve1hash,
    });
    const transactionReceipt2 = await waitForTransactionReceipt(config, {
      hash: approve2hash,
    });

    const liquidityDelta = await getLiquidityDelta(
      [
        selectedEvent.args.currency0,
        selectedEvent.args.currency1,
        selectedEvent.args.fee,
        selectedEvent.args.tickSpacing,
        selectedEvent.args.hooks,
      ],
      lowerTick,
      upperTick,
      token0Amount,
      token1Amount
    );

    await addLiquidity(
      [
        selectedEvent.args.currency0,
        selectedEvent.args.currency1,
        selectedEvent.args.fee,
        selectedEvent.args.tickSpacing,
        selectedEvent.args.hooks,
      ],
      [lowerTick, upperTick, liquidityDelta]
    );

    setIsPopupOpen(false); // Close the popup after adding liquidity
  };

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {events.length > 0 ? (
        events.map((event, index) => (
          <div
            key={index}
            className="bg-neutral-800 text-white rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-xl font-bold mb-4">
              Event Name: {event.eventName}
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Currency 0:</span>{" "}
                {event.args.currency0}
              </p>
              <p>
                <span className="font-semibold">Currency 1:</span>{" "}
                {event.args.currency1}
              </p>
              <p>
                <span className="font-semibold">Fee:</span> {event.args.fee}
              </p>
              <p>
                <span className="font-semibold">Sqrt Price X96:</span>{" "}
                {event.args.sqrtPriceX96.toString()}
              </p>
              <p>
                <span className="font-semibold">Tick:</span> {event.args.tick}
              </p>
              <p>
                <span className="font-semibold">Tick Spacing:</span>{" "}
                {event.args.tickSpacing}
              </p>
            </div>
            <button
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              onClick={() => {
                setSelectedEvent(event);
                setIsPopupOpen(true);
              }}
            >
              Add Liquidity
            </button>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-400">No events found</p>
      )}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add Liquidity</h3>
            <div className="mb-4">
              <label className="block text-gray-700">Token 0 Amount</label>
              <input
                type="text"
                value={token0Amount}
                onChange={(e) => setToken0Amount(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Token 1 Amount</label>
              <input
                type="text"
                value={token1Amount}
                onChange={(e) => setToken1Amount(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Lower Price</label>
              <input
                type="text"
                value={lowerPrice}
                onChange={(e) => setLowerPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Upper Price</label>
              <input
                type="text"
                value={upperPrice}
                onChange={(e) => setUpperPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mr-2"
                onClick={handleAddLiquidity}
              >
                Confirm
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
