"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PoolManagerABI } from "../../../../utils/poolManagerABI.json";
import { motion } from "framer-motion";

const Pools = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div className="flex flex-col items-center w-[1000px]">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-2xl font-bold text-white">Pools</h1>
          <motion.button
            className="bg-cyan-900 opacity-80 text-white py-2 px-4 rounded-xl"
            onClick={() => handleNavigation("/pages/createPool")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Create Pool
          </motion.button>
        </div>

        <div className="bg-transparent border-white border-[0.05px] border-opacity-30 p-6 rounded-lg shadow-lg w-full">
          <div className="flex flex-col items-center justify-center h-48 bg-transparent rounded-lg">
            <svg
              fill="rgba(255, 255, 255, 0.8)"
              width="100px"
              height="100px"
              viewBox="-2 -4 24 24"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMinYMin"
              className="jam jam-box-f mb-4"
            >
              <path d="M20 5H0V3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2zm0 2v6a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V7h6.126a4.002 4.002 0 0 0 7.748 0H20z" />
            </svg>
            <p className="text-white">
              Your active liquidity positions will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pools;
