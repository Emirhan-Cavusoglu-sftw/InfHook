"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";

keccak256(toBytes("hello world"));

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

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <div>
      {events.length > 0 ? (
        events.map((event, index) => (
          <div key={index}>
            <h3>Event Name: {event.eventName}</h3>
            <p>Currency 0: {event.args.currency0}</p>
            <p>Currency 1: {event.args.currency1}</p>
            <p>Fee: {event.args.fee}</p>
            <p>Sqrt Price X96: {event.args.sqrtPriceX96.toString()}</p>
            <p>Tick: {event.args.tick}</p>
            <p>Tick Spacing: {event.args.tickSpacing}</p>
            {/* Burada diğer argümanlar da eklenebilir */}
          </div>
        ))
      ) : (
        <p>No events found</p>
      )}
    </div>
  );
};

export default Explore;
