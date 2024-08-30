// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/Test/PoolModifyLiquidityTest.sol";

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
contract DeployLiq is Script {
    IPoolManager public poolManager;
    function run() external {
        vm.startBroadcast();
        
        PoolModifyLiquidityTest poolLiq = new PoolModifyLiquidityTest(IPoolManager(0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac));
        console.log("PoolSwapTest deployed at:", address(poolLiq));
        
        vm.stopBroadcast();
    }
}
