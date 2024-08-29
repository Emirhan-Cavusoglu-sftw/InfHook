"use client";
import React, { use, useEffect, useState } from "react";
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
import { getAllowance } from "../../../utils/functions/allowanceFuntion";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

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

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const MyOrders = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const [zeroForOne, setZeroForOne] = useState<boolean>(false);
  const [amountIn, setAmountIn] = useState<string>("");
  const [tickToSellAt, setTickToSellAt] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [price, setPrice] = useState<string>("");
  const [usePrice, setUsePrice] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const router = useRouter();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [symbolData, setSymbolData] = useState([]);

  console.log("Selected Hook:", selectedHook);

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const events = await getEvents();
      return {
        events,
      };
    },
  });

  const {
    data: data2,
    isLoading: isLoading2,
    refetch: refetch2,
    isFetched: isFetched2,
  } = useQuery({
    enabled: false,
    queryKey: ["orders"],
    queryFn: async () => {
      const orders = await getOrders();
      return {
        orders,
      };
    },
  });

  const {
    data: data3,
    isLoading: isLoading3,
    refetch: refetch3,
    isFetched: isFetched3,
  } = useQuery({
    enabled: false,
    queryKey: ["tokenSymbols"],
    queryFn: async () => {},
  });

  useEffect(() => {
    if (isFetched) {  
      refetch2();
    }
  }, [isFetched]);

  useEffect(() => {
    if (isFetched2) {
      refetch3();
    }
  }, [isFetched2]);

  useEffect(() => {
    const fetchSymbols = async () => {
      const data = await Promise.all(
        events.map(async (event) => {
          const symbol0 = await getSymbols(event.args.currency0);
          const symbol1 = await getSymbols(event.args.currency1);
          return { symbol0, symbol1, fee: event.args.fee };
        })
      );
      setSymbolData(data);
    };

    fetchSymbols();
  }, [events]);

  useEffect(() => {
    if (selectedHook !== "0x6D26250775ca993269B7AB4DB71c944432aA5040") {
      router.push("/");
    }
  }, [selectedHook]);

  console.log("isloading: " + isLoading);

  async function getEvents() {
    try {
      const response = await fetch(
        "https://opencampus-codex.blockscout.com/api/v2/addresses/0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac/logs"
      );
      const data = await response.json();

      const decodedEvents: Event[] = [];

      for (let item of data.items) {
        if (item.topics[0].toLowerCase() === eventSignature.toLowerCase()) {
          const decodedEvent = decodeEventLog({
            abi: PoolManagerABI,
            data: item.data,
            topics: item.topics.slice(0, 8),
          });

          if (
            decodedEvent.args.hooks.toLowerCase() === selectedHook.toLowerCase()
          ) {
            const currency0Symbol =
              tokenInfo.find(
                (token) =>
                  token.tokenAddress.toLowerCase() ===
                  decodedEvent.args.currency0.toLowerCase()
              )?.symbol || decodedEvent.args.currency0;

            const currency1Symbol =
              tokenInfo.find(
                (token) =>
                  token.tokenAddress.toLowerCase() ===
                  decodedEvent.args.currency1.toLowerCase()
              )?.symbol || decodedEvent.args.currency1;

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
        "https://opencampus-codex.blockscout.com/api/v2/addresses/0x6D26250775ca993269B7AB4DB71c944432aA5040/logs"
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

  function convertPriceToTick(price: string): number {
    const priceValue = parseFloat(price);

    // Fiyatı sqrtPrice'a çevir
    const sqrtPrice = Math.sqrt(priceValue) * Math.pow(2, 96);

    // Tick hesaplama (gerçek değeri almak için)
    const tick = Math.floor(
      Math.log(sqrtPrice / Math.pow(2, 96)) / Math.log(Math.sqrt(1.0001))
    );

    return tick;
  }

  console.log("Price to Tick: ", convertPriceToTick(price));

  async function handlePlaceOrder() {
    if (selectedEvent) {
      const tick = usePrice ? convertPriceToTick(price) : tickToSellAt;
      const argsArray = [
        selectedEvent.args.currency0,
        selectedEvent.args.currency1,
        selectedEvent.args.fee,
        selectedEvent.args.tickSpacing,
        selectedEvent.args.hooks,
      ];

      const hookAddress = "0x6D26250775ca993269B7AB4DB71c944432aA5040";

      // Token 0 için allowance kontrolü
      const allowance1 = await getAllowance(
        selectedEvent.args.currency0,
        hookAddress
      );

      // Token 1 için allowance kontrolü
      const allowance2 = await getAllowance(
        selectedEvent.args.currency1,
        hookAddress
      );

      console.log("Selected Event", selectedEvent);

      let approve1hash, approve2hash;

      // Allowance kontrolü yap, 0 ise approve yap
      if (BigInt(allowance1) === BigInt(0)) {
        console.log("Token 0 için onay gerekli.");
        approve1hash = await Approve(selectedEvent.args.currency0);
        await waitForTransactionReceipt(config, { hash: approve1hash });
      } else {
        console.log("Token 0 için onay gerekli değil.");
      }

      if (BigInt(allowance2) === BigInt(0)) {
        console.log("Token 1 için onay gerekli.");
        approve2hash = await Approve(selectedEvent.args.currency1);
        await waitForTransactionReceipt(config, { hash: approve2hash });
      } else {
        console.log("Token 1 için onay gerekli değil.");
      }

      try {
        const result = await placeOrder(
          [
            selectedEvent.args.currency0,
            selectedEvent.args.currency1,
            selectedEvent.args.fee,
            selectedEvent.args.tickSpacing,
            selectedEvent.args.hooks,
          ],
          tick,
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
        args: ["0x6D26250775ca993269B7AB4DB71c944432aA5040", uintMax],
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

  function truncateString(str: string, maxLength: number) {
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + "...";
    }
    return str;
  }

  function getLowerUsableTick(tick, orders) {
    let tickSpacing = Number(orders.args.tickSpacing);

    // Eğer tick negatifse:
    if (tick < 0) {
      let intervals = Math.ceil(tick / tickSpacing);
      if (tick % tickSpacing !== 0) {
        intervals--;
      }
      return intervals * tickSpacing;
    }

    // Eğer tick pozitifse:
    if (tick > 0) {
      let intervals = Math.floor(tick / tickSpacing);
      return intervals * tickSpacing;
    }

    // tick 0 ise, doğrudan 0 döndür
    return 0;
  }

  async function getSymbols(address: string) {
    try {
      const symbol = await readContract(config, {
        abi: ERC20ABI,
        address: address,
        functionName: "symbol",
      });
      return symbol;
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  return (
    <div className="flex flex-row justify-center items-center bg-transparent space-x-48 mt-24">
      <div className="flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2 px-6 border-2 border-gray-500 border-opacity-80 shadow-lg shadow-cyan-400">
        <h1 className="text-white text-3xl mb-8">Place Order</h1>

        <div className="w-full">
          <h1 className="text-white text-lg mb-2">Select Pool</h1>
          <select
            onChange={(e) => {
              const selectedIndex = e.target.value;
              setSelectedEvent(events[parseInt(selectedIndex)]);
            }}
            className="mb-4 p-3 rounded bg-neutral-700 text-white w-full"
          >
            <option value="">Select a Pool</option>
            {symbolData.map((data, index) => (
              <option key={index} value={index}>
                {`Pool: ${data.symbol0} / ${data.symbol1} - Fee: ${data.fee}`}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full mb-4">
          <h1 className="text-white text-lg mb-2">Tick or Price</h1>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setUsePrice(false)}
              className={`p-3 rounded-lg text-white w-full ${
                !usePrice ? "bg-blue-800" : "bg-neutral-700"
              }`}
            >
              Tick
            </button>
            <button
              onClick={() => setUsePrice(true)}
              className={`p-3 rounded-lg text-white w-full ${
                usePrice ? "bg-blue-800" : "bg-neutral-700"
              }`}
            >
              Price
            </button>
          </div>
          {!usePrice ? (
            <>
              <input
                type="number"
                placeholder="Enter Tick"
                onChange={(e) =>
                  setTickToSellAt(
                    Number(getLowerUsableTick(e.target.value, selectedEvent))
                  )
                }
                className="p-3 rounded bg-neutral-700 text-white w-full"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
              />
              <style jsx>{`
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
              `}</style>
            </>
          ) : (
            <input
              type="text"
              placeholder="Enter Price"
              value={price}
              onChange={(e) => {
                const inputPrice = e.target.value;
                if (parseFloat(inputPrice) >= 0 || inputPrice === "") {
                  setPrice(inputPrice);
                }
              }}
              className="p-3 rounded bg-neutral-700 text-white w-full"
            />
          )}
        </div>

        <div className="w-full mb-4">
          <h1 className="text-white text-lg mb-2">Amount</h1>
          <input
            type="text"
            placeholder="Enter Amount"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="p-3 rounded bg-neutral-700 text-white w-full"
          />
        </div>

        <div className="w-full flex space-x-4 mb-8">
          <button
            onClick={() => setZeroForOne(false)}
            className={`p-3 rounded-lg text-white w-full ${
              !zeroForOne ? "bg-green-500" : "bg-neutral-700"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setZeroForOne(true)}
            className={`p-3 rounded-lg text-white w-full ${
              zeroForOne ? "bg-red-500" : "bg-neutral-700"
            }`}
          >
            Sell
          </button>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="p-3 rounded-lg bg-blue-800 hover:bg-blue-950 transition text-white w-full"
        >
          Place Order
        </button>
      </div>

      <div className="flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2 border-2 border-gray-500 border-opacity-80 shadow-lg shadow-cyan-400">
        <h1 className="text-white text-3xl mb-4">Orders</h1>
        <ul className="text-white w-full px-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[600px]">
          {orders
            .filter((order) => order.balance > 0) // Balance 0'dan büyük olan order'ları filtreleme
            .map((order, index) => (
              <li
                key={index}
                className="mb-4 p-4 bg-gray-800 rounded-xl space-x-2 "
              >
                <p className="mb-2">
                  {`${index + 1}. Order ID: ${truncateString(
                    String(order.positionId),
                    10
                  )}, Balance: ${truncateString(String(order.balance), 10)}`}
                </p>
                <button
                  onClick={() => handleRedeem(order)}
                  disabled={order.claimableTokens <= 0}
                  className={`mt-2 p-2 rounded-lg text-white w-48 ${
                    order.claimableTokens > 0
                      ? "bg-green-500"
                      : "bg-neutral-800 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
                <button
                  onClick={() => handleCancelOrder(order)}
                  className="mt-2 p-2 rounded-lg bg-red-500 text-white w-48"
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
