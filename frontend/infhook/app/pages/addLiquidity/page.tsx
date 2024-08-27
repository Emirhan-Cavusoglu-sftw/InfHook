"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHook } from "../../components/hookContext";

const AddLiquidity = () => {
  const searchParams = useSearchParams();
  const { selectedHook } = useHook();

  // Pool bilgilerini URL parametrelerinden alıyoruz
  const poolId = searchParams.get("id");
  const token0 = searchParams.get("token0");
  const token1 = searchParams.get("token1");
  const fee = searchParams.get("fee");
  const tickSpacing = searchParams.get("tickSpacing");
  const sqrtPriceX96 = searchParams.get("sqrtPriceX96");
  const tick = searchParams.get("tick");

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
        <motion.button
          className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Liquidity
        </motion.button>
      </div>
    </div>
  );
};

export default AddLiquidity;
