"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  const id = "0x000000000000000000";
  return (
    <header className="w-full flex justify-between items-center py-4 px-8 bg-transparent">
      <div className="flex space-x-4">
        <button
          onClick={() => handleNavigation(`/pages/swap/${id}`)}
          className="text-white hover:text-gray-300 transition"
        >
          Swap
        </button>
        <button
          onClick={() => handleNavigation('/pages/explore')}
          className="text-white hover:text-gray-300 transition"
        >
          Explorer
        </button>
        <button
          onClick={() => handleNavigation(`/pages/pools/${id}`)}
          className="text-white hover:text-gray-300 transition"
        >
          My Positions
        </button>
      </div>
      <div className="flex space-x-4 items-center">
        <button className="text-white hover:text-gray-300 transition">
          Nezlobin
        </button>
        <button className="text-white hover:text-gray-300 transition">
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
