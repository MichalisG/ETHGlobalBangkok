"use client";

import React from "react";
import { useAccount } from "wagmi";
import Balance from "~~/components/Balance";
import { WalletConnect } from "~~/components/Wallet";


/**
 * Site header
 */
export const Header = () => {
  const { address } = useAccount();

  return (
    <div className="sticky top-0 navbar bg-white min-h-20 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2 items-center">
      <div className="flex justify-between w-full">
        <div className="flex justify-start">{address && <Balance connectedAddress={address} />}</div>
        <div className="flex justify-end items-center p-2 mt-2">
          <WalletConnect />
        </div>
      </div>
    </div>
  );
};
