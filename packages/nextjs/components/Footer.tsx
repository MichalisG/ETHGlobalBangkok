import React from "react";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Site footer
 */
export const Footer = () => {

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
        <div className="flex">
          <RainbowKitCustomConnectButton />
          <FaucetButton />
        </div>
      </div>
    </div>
  );
};
