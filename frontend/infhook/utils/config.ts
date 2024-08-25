import { http, createConfig } from "wagmi";
import { Chain } from "viem";

const educhain: Chain = {
  id: 656476,
  name: "EduChain",
  nativeCurrency: { name: "EduToken", symbol: "EDU", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.open-campus-codex.gelato.digital"] },
  },
  blockExplorers: {
    default: {
      name: "EduChain Explorer",
      url: "https://opencampus-codex.blockscout.com/",
    },
  },
  contracts: {},
  testnet: true,
};

export const config = createConfig({
  chains: [educhain,],
  transports: {
    [educhain.id]: http("https://rpc.open-campus-codex.gelato.digital"),
  },
});
