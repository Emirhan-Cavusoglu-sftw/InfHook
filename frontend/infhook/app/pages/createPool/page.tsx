"use client";
import React, { useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "../../../utils/config";

const hookData = "0x";

const CreatePool = () => {
  const [currency0, setCurrency0] = useState("0x0FaD14145B671Aeb00E2De75D86c6719123d3187");
  const [currency1, setCurrency1] = useState("0x9b3ea3121F69cEe5aC645a5C4bC0db71F28Dd0BC");
  const [fee, setFee] = useState(0);
  const [tickSpacing, setTickSpacing] = useState(0);
  const [hooks, setHooks] = useState("");
  const [sqrtPriceX96, setSqrtPriceX96] = useState("");

  const sqrtPriceOptions = [
    { value: "79228162514264337593543950336", label: "1:1" },
    { value: "56022770974786139918731938227", label: "1:2" },
    { value: "39614081257132168796771975168", label: "1:4" },
    { value: "112045541949572279837463876454", label: "2:1" },
    { value: "158456325028528675187087900672", label: "4:1" },
    { value: "87150978765690771352898345369", label: "121:100" },
  ];

  const handleSubmit = () => {
    const poolData = {
      currency0: "0x0FaD14145B671Aeb00E2De75D86c6719123d3187",
      currency1: "0x9b3ea3121F69cEe5aC645a5C4bC0db71F28Dd0BC",
      fee: fee,
      tickSpacing: tickSpacing,
      hooks: hooks,
      sqrtPriceX96: sqrtPriceX96,
      hookDat: hookData,
    };
    console.log("Pool Data:", poolData);
    createPool();
  };

  async function createPool() {
    try {
      const newPool = await writeContract(config, {
        abi: PoolManagerABI,
        address: "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac",
        functionName: "initialize",
        args: [
          [currency0, currency1, fee, tickSpacing, hooks],
          sqrtPriceX96,
          hookData,
        ],
      });
      console.log(newPool);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex justify-center items-center text-center">
      <div className="flex flex-col bg-transparent border-2 border-white border-opacity-80 w-[850px] h-[650px] mt-16 rounded-xl p-8">
        <h2 className="text-white text-2xl mb-6">Create a New Pool</h2>

        <input
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          type="text"
          placeholder="Currency0 Address"
          value={currency0}
          onChange={(e) => setCurrency0(e.target.value)}
        />

        <input
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          type="text"
          placeholder="Currency1 Address"
          value={currency1}
          onChange={(e) => setCurrency1(e.target.value)}
        />

        <input
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          type="text"
          placeholder="Fee"
          value={fee}
          onChange={(e) => setFee(parseFloat(e.target.value))}
        />

        <input
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          type="text"
          placeholder="Tick Spacing"
          value={tickSpacing}
          onChange={(e) => setTickSpacing(parseFloat(e.target.value))}
        />

        <input
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          type="text"
          placeholder="Hooks"
          value={hooks}
          onChange={(e) => setHooks(e.target.value)}
        />

        <select
          className="mb-4 p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
          value={sqrtPriceX96}
          onChange={(e) => setSqrtPriceX96(e.target.value)}
        >
          <option value="">Select sqrtPriceX96</option>
          {sqrtPriceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          className="mt-4 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={handleSubmit}
        >
          Create Pool
        </button>
      </div>
    </div>
  );
};

export default CreatePool;
