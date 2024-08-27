"use client";
import React, { useEffect, useState } from "react";
import { useHook } from "../../components/hookContext";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../../utils/config";
import { LimitOrderHookABI } from "../../../utils/limitOrderHookABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import {
  placeOrder,
  redeem,
  balanceOf,
  claimableOutputTokens,
  getPositionId,
  cancelOrder,
} from "../../../utils/functions/placeOrderFunctions";

const eventSignature = keccak256(
  toBytes(
    "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
  )
);
console.log("Event Signature:", eventSignature);

const eventSignature2 = keccak256(
  toBytes(
    "OrderPlaced(address,address,uint24,int24,address,int24,bool,uint256,address)"
  )
);
console.log("Event Signature:", eventSignature2);

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

interface Order {
  args: {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
    tickToSellAt: number;
    zeroForOne: boolean;
    inputAmount: number;
    sender: string;
  };
  eventName: string;
  positionId: number;
  balance: number;
  claimableTokens: number;
}

const MyOrders = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const [zeroForOne, setZeroForOne] = useState<boolean>(false);
  const [amountIn, setAmountIn] = useState<string>("");
  const [tickToSellAt, setTickToSellAt] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);

  console.log("Selected Hook:", selectedHook);

  useEffect(() => {
    getEvents();
    getOrders();
  }, [selectedHook]);

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

  async function getOrders() {
    try {
      const response = await fetch(
        "https://opencampus-codex.blockscout.com/api/v2/addresses/0xcaa83ba2be15bdcb00c908a5c50d62f4f47b5040/logs"
      );
      const data = await response.json();
      const decodedEvents2: Order[] = [];

      for (let item of data.items) {
        if (item.topics[0].toLowerCase() === eventSignature2.toLowerCase()) {
          const decodedEvent = decodeEventLog({
            abi: LimitOrderHookABI,
            data: item.data,
            topics: item.topics,
          });

          console.log("Decoded Event:", decodedEvent);

          if (
            decodedEvent.args.hooks.toLowerCase() === selectedHook.toLowerCase()
          ) {
            const positionId = await getPositionId(
              decodedEvent.args.currency0,
              decodedEvent.args.currency1,
              decodedEvent.args.fee,
              decodedEvent.args.tickSpacing,
              decodedEvent.args.tickToSellAt,
              decodedEvent.args.zeroForOne
            );
            console.log("Position ID:", positionId);

            const balance = await balanceOf(String(positionId));
            const claimableTokens = await claimableOutputTokens(
              String(positionId)
            );

            decodedEvents2.push({
              args: {
                currency0: decodedEvent.args.currency0,
                currency1: decodedEvent.args.currency1,
                fee: decodedEvent.args.fee,
                tickSpacing: decodedEvent.args.tickSpacing,
                hooks: decodedEvent.args.hooks,
                tickToSellAt: decodedEvent.args.tickToSellAt,
                zeroForOne: decodedEvent.args.zeroForOne,
                inputAmount: decodedEvent.args.inputAmount,
                sender: decodedEvent.args.sender,
              },
              eventName: decodedEvent.eventName,
              positionId: Number(positionId),
              balance: Number(balance),
              claimableTokens: Number(claimableTokens),
            });
          }
        }
      }

      decodedEvents2.sort((a, b) => b.balance - a.balance);
      setOrders(decodedEvents2);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  async function handlePlaceOrder() {
    if (selectedEvent) {
      const argsArray = [
        selectedEvent.args.currency0,
        selectedEvent.args.currency1,
        selectedEvent.args.fee,
        selectedEvent.args.tickSpacing,
        selectedEvent.args.hooks,
      ];

      const approve1 = await Approve(selectedEvent.args.currency0);
      const approve2 = await Approve(selectedEvent.args.currency1);

      try {
        const result = await placeOrder(
          [
            selectedEvent.args.currency0,
            selectedEvent.args.currency1,
            selectedEvent.args.fee,
            selectedEvent.args.tickSpacing,
            selectedEvent.args.hooks,
          ],
          tickToSellAt,
          zeroForOne,
          amountIn
        );
        console.log("Order Placed:", result);
      } catch (error) {
        console.error("Error placing order:", error);
      }
    } else {
      console.error("No event selected");
    }
  }

  async function Approve(tokenAddress: string) {
    const uintMax = 200000000000000000;

    async function isValidAddress(tokenAddress: string) {
      return /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
    }

    if (!isValidAddress(tokenAddress)) {
      alert("Invalid Token Address");
      return;
    }

    try {
      const approve = await writeContract(config, {
        abi: ERC20ABI,
        address: tokenAddress,
        functionName: "approve",
        args: ["0xcaa83ba2be15bdcb00c908a5c50d62f4f47b5040", uintMax],
      });
      return approve;
    } catch (error) {
      console.error("Error approving token:", error);
    }
  }

  async function handleRedeem(order: Order) {
    try {
      await redeem(
        [
          order.args.currency0,
          order.args.currency1,
          order.args.fee,
          order.args.tickSpacing,
          order.args.hooks,
        ],
        order.args.tickToSellAt,
        order.args.zeroForOne,
        String(order.args.inputAmount)
      );
    } catch (error) {
      console.error("Error redeeming order:", error);
    }
  }

  async function handleCancelOrder(order: Order) {
    try {
      await cancelOrder(
        [
          order.args.currency0,
          order.args.currency1,
          order.args.fee,
          order.args.tickSpacing,
          order.args.hooks,
        ],
        order.args.tickToSellAt,
        order.args.zeroForOne
      );
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  }

  return (
    <div className="flex flex-row justify-center items-center bg-transparent space-x-64 mt-24">
      <div className="flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2">
        <h1 className="text-white text-3xl">Place Order</h1>
        <h1 className="text-white text-lg pt-8">Select Pool</h1>
        <select
          onChange={(e) => {
            const selectedIndex = e.target.value;
            setSelectedEvent(events[parseInt(selectedIndex)]);
          }}
          className="mt-4 p-2 rounded bg-neutral-700 text-white w-[250px]"
        >
          <option value="">Select a Pool</option>
          {events.map((event, index) => (
            <option key={index} value={index}>
              {`Pool: ${event.args.currency0} / ${event.args.currency1} - Fee: ${event.args.fee}`}
            </option>
          ))}
        </select>
        <h1 className="text-white text-lg pt-8">Tick</h1>
        <input
          type="number"
          placeholder="Enter Tick"
          value={tickToSellAt}
          onChange={(e) => setTickToSellAt(Number(e.target.value))}
          className="mt-4 p-2 rounded bg-neutral-700 text-white"
        />
        <h1 className="text-white text-lg pt-8">Amount</h1>
        <input
          type="text"
          placeholder="Enter Amount"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          className="mt-4 p-2 rounded bg-neutral-700 text-white"
        />
        <div className="flex mt-4 space-x-4">
          <button
            onClick={() => setZeroForOne(false)}
            className={`p-2 rounded ${
              !zeroForOne ? "bg-blue-500" : "bg-neutral-700"
            } text-white`}
          >
            Buy
          </button>
          <button
            onClick={() => setZeroForOne(true)}
            className={`p-2 rounded ${
              zeroForOne ? "bg-blue-500" : "bg-neutral-700"
            } text-white`}
          >
            Sell
          </button>
        </div>
        <button
          onClick={handlePlaceOrder}
          className="mt-4 p-2 rounded bg-green-500 text-white"
        >
          Place Order
        </button>
      </div>
      <div className="flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2">
        <h1 className="text-white text-3xl">Orders</h1>
        <ul className="text-white">
          {orders.map((order, index) => (
            <li key={index} className="mb-4">
              <p>
                {`Order ID: ${order.positionId}, Balance: ${order.balance}, Claimable: ${order.claimableTokens}`}
              </p>
              <button
                onClick={() => handleRedeem(order)}
                disabled={order.claimableTokens <= 0}
                className={`mt-2 p-2 rounded ${
                  order.claimableTokens > 0
                    ? "bg-green-500"
                    : "bg-neutral-700 cursor-not-allowed"
                } text-white`}
              >
                Redeem
              </button>
              <button
                onClick={() => handleCancelOrder(order)}
                className="mt-2 p-2 rounded bg-red-500 text-white"
              >
                Cancel Order
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MyOrders;
