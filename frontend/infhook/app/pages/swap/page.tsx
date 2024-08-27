"use client";
import React, { useState, useEffect } from "react";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { swap } from "../../../utils/functions/swapFunctions";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { config } from "../../../utils/config";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useHook } from "../../components/hookContext";
import { getAllowance } from "../../../utils/functions/allowanceFuntion";

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
  const [selectedPool, setSelectedPool] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [poolSlot, setPoolSlot] = useState<any[]>([]);
  const [lpFee, setLpFee] = useState<string | null>(null);
  const [amountOut, setAmountOut] = useState("");

  console.log("Selected Hook:", selectedHook);

  useEffect(() => {
    getTokens();
    getEvents();
  }, [selectedHook]);

  useEffect(() => {
    if (selectedPool) {
      fetchsqrtPrivceLimitX96();
      getSlot();
    }
  }, [selectedPool, zeroForOne]);

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

      const filtered = decodedEvents.filter(
        (event) => event.args.hooks.toLowerCase() === selectedHook.toLowerCase()
      );

      setEvents(decodedEvents);
      setFilteredEvents(filtered);
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

  const fetchsqrtPrivceLimitX96 = async () => {
    if (zeroForOne) {
      setSqrtPriceLimitX96(BigInt(4295128740));
    } else {
      setSqrtPriceLimitX96(
        BigInt("1461446703485210103287273052203988822378723970341")
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

  const openPoolSelectPopup = () => {
    setIsPopupVisible(true);
  };

  const handlePoolSelect = (pool: Event) => {
    setSelectedPool(pool);
    setIsPopupVisible(false);
  };

  const closePopupOnOutsideClick = (e) => {
    if (e.target.id === "popupOverlay") {
      setIsPopupVisible(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedPool) {
      alert("Please select a pool");
      return;
    }

    const swapAddress = "0xcA116c91F47E6c360E80921a83bd6971c6C8f1a4";
    try {
      const allowance1 = await getAllowance(
        selectedPool.args.currency0,
        swapAddress
      );
      const allowance2 = await getAllowance(
        selectedPool.args.currency1,
        swapAddress
      );

      let approve1 = true; // Default olarak true, çünkü eğer allowance 0 değilse approval gerekmiyor.
      let approve2 = true; // Default olarak true, çünkü eğer allowance 0 değilse approval gerekmiyor.

      // Allowance kontrolü yap
      if (BigInt(allowance1) === BigInt(0)) {
        console.log("Token 1 için onay gerekli.");
        approve1 = await Approve(selectedPool.args.currency0);
        if (!approve1) {
          console.error("Token 1 için onay işlemi başarısız oldu.");
          return;
        }
      } else {
        console.log("Token 1 için onay gerekli değil.");
      }

      if (BigInt(allowance2) === BigInt(0)) {
        console.log("Token 2 için onay gerekli.");
        approve2 = await Approve(selectedPool.args.currency1);
        if (!approve2) {
          console.error("Token 2 için onay işlemi başarısız oldu.");
          return;
        }
      } else {
        console.log("Token 2 için onay gerekli değil.");
      }

      console.log("Selected Pool:", selectedPool);
      console.log("ZeroForOne:", zeroForOne);
      console.log("SqrtPriceLimitX96:", sqrtPriceLimitX96);

      if (approve1 && approve2) {
        console.log("Approve işlemleri başarılı.");
        await swap(
          [
            selectedPool.args.currency0,
            selectedPool.args.currency1,
            selectedPool.args.fee,
            selectedPool.args.tickSpacing,
            selectedPool.args.hooks,
          ],
          [zeroForOne, BigInt(amountSpecified), sqrtPriceLimitX96]
        );
      } else {
        console.error("Approve işlemi başarısız oldu.");
      }
    } catch (error) {
      console.error("Swap işlemi sırasında hata oluştu:", error);
    }
  };

  async function getSlot() {
    if (!selectedPool) return;
    try {
      const slot = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x3635b6d0b150d438163eaf7417812febc4030f2c",
        functionName: "getSlot0",
        args: [
          [
            selectedPool.args.currency0,
            selectedPool.args.currency1,
            selectedPool.args.fee,
            selectedPool.args.tickSpacing,
            selectedPool.args.hooks,
          ],
          "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac",
        ],
      });
      console.log(slot);
      setPoolSlot([slot]);
      if (slot && slot[3]) {
        setLpFee(slot[3].toString()); // Set the lpFee state with the third index value
      }
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

  useEffect(() => {
    if (selectedPool && amountSpecified && poolSlot.length > 0) {
      // Get sqrtPrice from getSlot response
      const sqrtPriceX96 = BigInt(String(poolSlot[0][0]));

      // Normalize the sqrtPriceX96 value by dividing by 2^96
      const sqrtPrice = Number(sqrtPriceX96) / Math.pow(2, 96);

      // Calculate the price by squaring the normalized sqrtPrice
      const price = sqrtPrice * sqrtPrice;

      console.log("Calculated Price:", price);

      // Calculate the amount out based on the input amount and price
      const calculatedAmountOut = parseFloat(amountSpecified) * price;

      // Update the amountOut state
      setAmountOut(calculatedAmountOut.toFixed(6)); // Round to 6 decimal places
    }
  }, [amountSpecified, selectedPool, poolSlot]);

  return (
    <div className="flex justify-center items-center mt-28">
      <div className="bg-neutral-900 w-[500px] h-[460px] rounded-3xl flex flex-col items-center relative">
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
                  onClick={openPoolSelectPopup}
                >
                  {selectedPool
                    ? zeroForOne
                      ? `${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency0
                          )?.symbol
                        }/${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency1
                          )?.symbol
                        }`
                      : `${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency1
                          )?.symbol
                        }/${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency0
                          )?.symbol
                        }`
                    : "Select Pool"}
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
                  value={amountOut}
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
                  disabled
                >
                  {selectedPool
                    ? `${
                        tokens.find(
                          (t) => t.tokenAddress === selectedPool.args.currency1
                        )?.symbol
                      }/${
                        tokens.find(
                          (t) => t.tokenAddress === selectedPool.args.currency0
                        )?.symbol
                      }`
                    : "Select Pool"}
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
        {lpFee && (
          <div className="mt-2 text-white opacity-60 text-sm">
            LpFee = {lpFee}
          </div>
        )}

        {/* Pool Select Popup */}
        {isPopupVisible && (
          <div
            id="popupOverlay"
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            onClick={() => setIsPopupVisible(false)}
          >
            <div className="bg-neutral-900 w-[500px] h-[550px] rounded-3xl flex flex-col items-center p-4 ">
              <div className="w-full flex justify-between items-center ">
                <h1 className="text-white opacity-60 text-lg">Select a pool</h1>
                <button
                  className="text-white opacity-60 text-xl"
                  onClick={() => setIsPopupVisible(false)}
                >
                  &times;
                </button>
              </div>
              <div className="mt-4 w-full flex flex-col space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredEvents.map((pool, index) => (
                  <button
                    key={index}
                    className="w-full p-4 bg-neutral-800 rounded-3xl text-white flex justify-between items-center"
                    onClick={() => handlePoolSelect(pool)}
                  >
                    <span>
                      {
                        tokens.find(
                          (t) => t.tokenAddress === pool.args.currency0
                        )?.symbol
                      }
                      /
                      {
                        tokens.find(
                          (t) => t.tokenAddress === pool.args.currency1
                        )?.symbol
                      }
                    </span>
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
