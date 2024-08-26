"use client";
import React, { useState, useEffect, use } from "react";
import { getTokenInfo } from "../../../../utils/functions/createTokenFunctions";
import { swap } from "../../../../utils/functions/swapFunctions";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { config } from "../../../../utils/config";
import { PoolManagerABI } from "../../../../utils/poolManagerABI.json";
import { LiquidiytDeltaABI } from "../../../../utils/readerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../../utils/ERC20ABI.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import LimitOrder from "../../../components/LimitOrder";

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

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

const eventSignature = keccak256(
  toBytes(
    "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
  )
);
console.log("Event Signature:", eventSignature);

const Swap = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedToken1, setSelectedToken1] = useState("");
  const [selectedToken2, setSelectedToken2] = useState("");
  const [activeTokenInput, setActiveTokenInput] = useState(1);
  const [amountSpecified, setAmountIn] = useState("");
  const [token1Address, setToken1Address] = useState("");
  const [token2Address, setToken2Address] = useState("");
  const [tokens, setTokenInfo] = useState<TokenInfo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [zeroForOne, setZeroForOne] = useState(true);
  const [sqrtPriceLimitX96, setSqrtPriceLimitX96] = useState<BigInt>(BigInt(0));

  useEffect(() => {
    getTokens();
    getEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      getSlot();
    }
  }, [events]);

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

  const getTokens = async () => {
    await getTokenInfo(setTokenInfo);
  };

  const handleTokenSelect = (token) => {
    const selectedToken = tokens.find((t) => t.symbol === token);
    if (activeTokenInput === 1) {
      setSelectedToken1(token);
      setToken1Address(selectedToken?.tokenAddress || "");
    } else {
      setSelectedToken2(token);
      setToken2Address(selectedToken?.tokenAddress || "");
    }
    setIsPopupVisible(false);
  };

  useEffect(() => {
    fetchsqrtPrivceLimitX96();
  }, [zeroForOne]);

  const fetchsqrtPrivceLimitX96 = async () => {
    if (zeroForOne) {
      setSqrtPriceLimitX96(BigInt(4295128740));
    } else {
      setSqrtPriceLimitX96(
        BigInt("1461446703485210103287273052203988822378723970341")
        // 1461446703485210175993845903335784348927318294528
      );
    }
  };

  const swapTokens = () => {
    setSelectedToken1(selectedToken2);
    setSelectedToken2(selectedToken1);
    setToken1Address(token2Address);
    setToken2Address(token1Address);
    setZeroForOne(!zeroForOne);
  };
  console.log("ZeroForOne:", zeroForOne);
  console.log("SqrtPriceLimitX96:", sqrtPriceLimitX96);

  const openTokenSelectPopup = (inputIndex: number) => {
    setActiveTokenInput(inputIndex);
    setIsPopupVisible(true);
  };

  const closePopupOnOutsideClick = (e) => {
    if (e.target.id === "popupOverlay") {
      setIsPopupVisible(false);
    }
  };

  const handleSwap = async () => {
    if (token1Address === "" || token2Address === "") {
      alert("Please select tokens");
      return;
    }

    // const approve1 = await Approve(token1Address);
    // const approve2 = await Approve(token2Address);

    // async function transactionReceipt(approve1: any, approve2: any) {
    //   const transactionReceipt = await waitForTransactionReceipt(config, {
    //     hash: approve1,
    //   });

    //   const transactionReceipt2 = await waitForTransactionReceipt(config, {
    //     hash: approve2,
    //   });
    // }

    // await transactionReceipt(approve1, approve2);

    await swap(
      [
        events[0]?.args.currency0,
        events[0]?.args.currency1,
        events[0]?.args.fee,
        events[0]?.args.tickSpacing,
        events[0]?.args.hooks,
      ],
      [zeroForOne, BigInt(amountSpecified), sqrtPriceLimitX96]
    );
  };

  async function getSlot() {
    try {
      const slot = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x3635b6d0b150d438163eaf7417812febc4030f2c",
        functionName: "getSlot0",
        args: [
          [
            events[0]?.args.currency0,
            events[0]?.args.currency1,
            events[0]?.args.fee,
            events[0]?.args.tickSpacing,
            events[0]?.args.hooks,
          ],
          "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac",
        ],
      });
      console.log(slot);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
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
        args: ["0xca116c91f47e6c360e80921a83bd6971c6c8f1a4", uintMax],
      });
      console.log("Approve " + approve);
      return approve;
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="flex justify-center items-center mt-28">
      <div className="bg-neutral-900 w-[500px] h-[440px] rounded-3xl flex flex-col items-center relative">
        <h1 className="p-4 text-lg text-white opacity-60 absolute top-0 left-4">
          Swap
        </h1>
        <div className="flex flex-col space-y-2 mt-16">
          <div className="flex flex-row w-[470px] h-32 p-2 bg-neutral-800 rounded-3xl">
            <div className="flex flex-col w-[470px] h-32">
              <h1 className="p-2 text-xs text-white opacity-60">You Pay</h1>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent w-[200px] h-12 p-2 text-white text-3xl appearance-none focus:outline-none"
                  placeholder="0"
                  value={amountSpecified}
                  onChange={(e) => setAmountIn(e.target.value)}
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
                <button
                  className="ml-auto bg-cyan-900 opacity-80 rounded-3xl text-white text-xl px-4 py-2"
                  onClick={() => openTokenSelectPopup(1)}
                >
                  {selectedToken1 || "Select Token"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <button
              className="text-white opacity-60 text-2xl transform rotate-0"
              onClick={swapTokens}
            >
              &darr;
            </button>
          </div>

          <div className="flex flex-row w-[470px] h-32 p-2 bg-neutral-800 rounded-3xl">
            <div className="flex flex-col w-[470px] h-32">
              <h1 className="p-2 text-xs text-white opacity-60">You Receive</h1>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent w-[200px] h-12 p-2 text-white text-3xl appearance-none focus:outline-none"
                  placeholder="0"
                  readOnly
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
                <button
                  className="ml-auto bg-cyan-900 opacity-80 rounded-3xl text-white text-xl px-4 py-2"
                  onClick={() => openTokenSelectPopup(2)}
                >
                  {selectedToken2 || "Select Token"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-[470px] h-12 bg-cyan-900 opacity-80 rounded-3xl text-white text-lg mt-2"
          onClick={() => handleSwap()}
        >
          Swap
        </button>

        {/* Token Select Popup */}
        {isPopupVisible && (
          <div
            id="popupOverlay"
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            onClick={closePopupOnOutsideClick}
          >
            <div className="bg-neutral-900 w-[500px] h-[550px] rounded-3xl flex flex-col items-center p-4 ">
              <div className="w-full flex justify-between items-center ">
                <h1 className="text-white opacity-60 text-lg">
                  Select a token
                </h1>
                <button
                  className="text-white opacity-60 text-xl"
                  onClick={() => setIsPopupVisible(false)}
                >
                  &times;
                </button>
              </div>
              <input
                type="text"
                className="w-full mt-4 p-2 rounded bg-neutral-800 text-white"
                placeholder="Search name or paste address"
              />
              <div className="mt-4 w-full flex flex-col space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {tokens.map((token, index) => (
                  <button
                    key={index}
                    className="w-full p-4 bg-neutral-800 rounded-3xl text-white flex justify-between items-center"
                    onClick={() => handleTokenSelect(token.symbol)}
                  >
                    <span>{token.name}</span>
                    <span className="opacity-60 text-sm">{token.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;
