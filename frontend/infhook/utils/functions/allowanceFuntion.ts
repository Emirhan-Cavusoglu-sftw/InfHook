import { writeContract, readContract } from "@wagmi/core";
import { config } from "../config";
import { ERC20ABI } from "../ERC20ABI.json";
import { getAccount } from "@wagmi/core";

export async function getAllowance(
  tokenAddress: string,
  address: string,
) {
  const account = getAccount(config);
  if (!account || !account.address) {
    console.error("Account not found or address is invalid.");
    return;
  }
  try {
    const allowance = await readContract(config, {
      abi: ERC20ABI,
      address: tokenAddress,
      functionName: "allowance",
      args: [account.address, address],
    });
    console.log("Allowance: ", allowance);
    return allowance;
  } catch (error) {
    console.error(error);
  }
}
