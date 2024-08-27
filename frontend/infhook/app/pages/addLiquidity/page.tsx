"use client";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHook } from "../../components/hookContext";
import {
  addLiquidity,
  getLiquidityDelta,
  Approve,
} from "../../../utils/functions/addLiquidityFunctions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../../utils/config";
import { getAllowance } from "../../../utils/functions/allowanceFuntion";

const AddLiquidity = () => {
  const searchParams = useSearchParams();
  const { selectedHook } = useHook();
  const [token0Amount, setToken0Amount] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [lowerPrice, setLowerPrice] = useState("");
  const [upperPrice, setUpperPrice] = useState("");

  // Pool bilgilerini URL parametrelerinden alıyoruz
  const poolId = searchParams.get("id");
  const token0 = searchParams.get("token0");
  const token1 = searchParams.get("token1");
  const fee = searchParams.get("fee");
  const tickSpacing = searchParams.get("tickSpacing");
  const sqrtPriceX96 = searchParams.get("sqrtPriceX96");
  const tick = searchParams.get("tick");

  const calculateTick = (
    price: number,
    tickSpacing: number,
    roundUp: boolean
  ) => {
    const tick = Math.log(price) / Math.log(1.0001);
    if (roundUp) {
      return Math.ceil(tick / tickSpacing) * tickSpacing;
    } else {
      return Math.floor(tick / tickSpacing) * tickSpacing;
    }
  };

  const handleAddLiquidity = async () => {
  const lowerTick = calculateTick(Number(lowerPrice), Number(tickSpacing), false);
  const upperTick = calculateTick(Number(upperPrice), Number(tickSpacing), true);

  console.log("Lower Tick:", lowerTick);
  console.log("Upper Tick:", upperTick);

  const poolModifyLiquidityAddress = "0x7b1d96AadFD510B24D46f3371e9b2dFA1963BB11";

  // Token 0 için allowance kontrolü
  const allowance1 = await getAllowance(String(token0), poolModifyLiquidityAddress);
  
  // Token 1 için allowance kontrolü
  const allowance2 = await getAllowance(String(token1), poolModifyLiquidityAddress);

  let approve1hash, approve2hash;

  // Allowance kontrolü yap, 0 ise approve yap
  if (BigInt(allowance1) === BigInt(0)) {
    console.log("Token 0 için onay gerekli.");
    approve1hash = await Approve(String(token0), poolModifyLiquidityAddress);
    await waitForTransactionReceipt(config, { hash: approve1hash });
  } else {
    console.log("Token 0 için onay gerekli değil.");
  }

  if (BigInt(allowance2) === BigInt(0)) {
    console.log("Token 1 için onay gerekli.");
    approve2hash = await Approve(String(token1), poolModifyLiquidityAddress);
    await waitForTransactionReceipt(config, { hash: approve2hash });
  } else {
    console.log("Token 1 için onay gerekli değil.");
  }

  // Likidite delta değerini hesapla
  const liquidityDelta = await getLiquidityDelta(
    [String(token0), String(token1), Number(fee), Number(tickSpacing), selectedHook],
    lowerTick,
    upperTick,
    token0Amount,
    token1Amount
  );

  // Likidite ekle
  await addLiquidity(
    [String(token0), String(token1), Number(fee), Number(tickSpacing), selectedHook],
    [lowerTick, upperTick, liquidityDelta]
  );
};


  return (
    <div className="flex justify-center items-center bg-transparent mt-16">
      <div className="bg-neutral-800 p-6 rounded-lg shadow-lg w-[800px]">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Pool Information
        </h1>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Pool ID:</h2>
          <p className="text-lg text-white">{poolId}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Token 0:</h2>
          <p className="text-lg text-white">{token0}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Token 1:</h2>
          <p className="text-lg text-white">{token1}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Fee:</h2>
          <p className="text-lg text-white">{fee}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Tick Spacing:</h2>
          <p className="text-lg text-white">{tickSpacing}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-300">
            Sqrt Price X96:
          </h2>
          <p className="text-lg text-white">{sqrtPriceX96}</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-300">Tick:</h2>
          <p className="text-lg text-white">{tick}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-300">Token 0 Amount</label>
          <input
            type="text"
            value={token0Amount}
            onChange={(e) => setToken0Amount(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300">Token 1 Amount</label>
          <input
            type="text"
            value={token1Amount}
            onChange={(e) => setToken1Amount(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300">Lower Price</label>
          <input
            type="text"
            value={lowerPrice}
            onChange={(e) => setLowerPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300">Upper Price</label>
          <input
            type="text"
            value={upperPrice}
            onChange={(e) => setUpperPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <motion.button
          className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddLiquidity}
        >
          Add Liquidity
        </motion.button>
      </div>
    </div>
  );
};

export default AddLiquidity;
