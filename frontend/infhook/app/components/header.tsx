"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useHook } from "./hookContext";

const Header = () => {
  const router = useRouter();
  const { selectedHook, setSelectedHook, selectedColor, setSelectedColor } =
    useHook();
  const [isLimitOrderSelected, setIsLimitOrderSelected] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  const handleHookSelection = (
    hook: string,
    color: string,
    isLimitOrder: boolean
  ) => {
    setSelectedHook(hook);
    setSelectedColor(color);
    setIsLimitOrderSelected(isLimitOrder);
  };

  const nezlobinHook = "0x7Ce503FC8c2E2531D5aF549bf77f040Ad9c36080"; // Nezlobin
  const limitOrderHook = "0xcaa83ba2be15bdcb00c908a5c50d62f4f47b5040"; // Limit Order
  const defaultHook = "0x0000000000000000000000000000000000000000"; //UniswapV4

  return (
    <header className="w-full flex justify-between items-center py-4 px-8 bg-transparent">
      <div className="flex space-x-4">
        <button
          onClick={() => handleNavigation(`/pages/swap/`)}
          className={`text-white hover:text-gray-400 transition`}
        >
          Swap
        </button>
        <button
          onClick={() => handleNavigation("/pages/explore")}
          className="text-white hover:text-gray-400 transition"
        >
          Explorer
        </button>
        <button
          onClick={() => handleNavigation(`/pages/pools`)}
          className="text-white hover:text-gray-400 transition"
        >
          My Positions
        </button>
        <button
          className="text-white hover:text-gray-400 transition"
          onClick={() => handleNavigation(`/pages/createToken`)}
        >
          Create Token
        </button>
        {isLimitOrderSelected && (
          <button
            onClick={() => handleNavigation("/pages/myOrders")}
            className="text-white  hover:text-gray-400 transition"
          >
            My Orders
          </button>
        )}
      </div>
      <div className="flex space-x-4 items-center">
        <button
          className={`transition ${
            selectedHook === defaultHook
              ? "text-pink-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(defaultHook, "pink", false)}
        >
          UniswapV4
        </button>
        <button
          className={`transition ${
            selectedHook === nezlobinHook
              ? "text-cyan-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(nezlobinHook, "cyan", false)}
        >
          Nezlobin
        </button>
        <button
          className={`transition ${
            selectedHook === limitOrderHook
              ? "text-lime-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(limitOrderHook, "lime", true)}
        >
          Limit Order
        </button>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {!mounted || !account || !chain ? (
                <button
                  className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                  onClick={openConnectModal}
                  type="button"
                >
                  Connect Wallet
                </button>
              ) : chain.unsupported ? (
                <button
                  className="px-4 py-2 bg-transparent text-red-500 border border-gray-500 rounded-xl opacity-80 hover:text-gray-500 hover:opacity-80 transition-colors duration-300"
                  onClick={openChainModal}
                  type="button"
                >
                  Wrong network
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                    onClick={openChainModal}
                    type="button"
                  >
                    {chain.name}
                  </button>

                  <button
                    className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                    onClick={openAccountModal}
                    type="button"
                  >
                    {account.displayName}
                    {account.displayBalance && ` (${account.displayBalance})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </ConnectButton.Custom>
      </div>
    </header>
  );
};

export default Header;
