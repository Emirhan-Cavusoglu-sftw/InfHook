"use client";
import React from 'react'

const MyOrders = () => {
  return (
    <div className='flex flex-row justify-center items-center bg-transparent space-x-64 mt-24'>
        <div className='flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2'>
            <h1 className='text-white text-3xl'>Order</h1>
        </div>
        <div className='flex flex-col bg-neutral-800 w-[500px] h-[600px] rounded-2xl items-center pt-2'>
            <h1 className='text-white text-3xl'>Redeem</h1>
        </div>
    </div>
  )
}

export default MyOrders;