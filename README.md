# Educhain Uniswap v4 Hook Project

Welcome to the **Educhain Uniswap v4 Hook Project**! This repository contains the implementation of two innovative hooks designed to enhance liquidity management and trading efficiency on Uniswap v4. Our project takes full advantage of Uniswap v4’s advanced features, including custom hooks, concentrated liquidity, and dynamic fee structures.

## Features

### 1. Nezlobin Dynamic Fee Hook
Inspired by Alex Nezlobin’s dynamic fee concept, this hook dynamically adjusts swap fees based on real-time market conditions.

- **Dynamic Fee Adjustment:** The hook evaluates the price impact and direction before each swap.
- **Reduced Impermanent Loss:** Higher fees are applied to arbitrageurs, while lower fees attract uninformed traders, reducing impermanent loss for liquidity providers.
- **Real-Time Market Response:** Fees are adjusted dynamically to ensure that liquidity providers are better protected during volatile market conditions.

### 2. Limit Order Hook
This hook allows users to create and execute trades based on specific price conditions, similar to order books in centralized exchanges (CEXs).

- **Customizable Orders:** Users can set precise price points for buy or sell orders, which execute automatically when market conditions are met.
- **Gas Optimization:** A unique redemption mechanism minimizes gas costs by having the swapper pay the initial transaction gas, with the token transfer redeemed separately.
- **Improved Trading Flexibility:** Provides greater control and reduces slippage, making it easier to optimize trading strategies.

## Setup and Simulation with Foundry

To get started with the local simulation of the Nezlobin hook using Foundry, follow the steps below:

1. **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2. **Install dependencies using Foundry:**
    ```bash
    forge install
    ```

3. **Run Anvil in a separate terminal:**
    ```bash
    anvil
    ```

4. **Execute the simulation scripts:**

    - **Step 1: Deploy the pool manager, router, and hooks:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/01_Deploy.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```
        After running the deploy script, a console will display the addresses of the deployed contracts. Make sure to update these addresses in the subsequent scripts before proceeding.

    - **Step 2: Initialize the pool:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/02_Initialize.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 3: Add liquidity (you can modify the values as needed):**
        ```bash
        forge script script/Test/Nezlobin_Simulation/03_AddLiq.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 4: Perform a swap:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/04_Swap.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 5: Check values like swap fee and current tick:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/05_Check.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```





## Acknowledgments

- **Alex Nezlobin:** For the dynamic fee concept that inspired the Nezlobin Dynamic Fee Hook.
- **Educhain Team:** For providing the platform and support for developing this project.



We hope you find this project as exciting as we do! Thank you for your interest.