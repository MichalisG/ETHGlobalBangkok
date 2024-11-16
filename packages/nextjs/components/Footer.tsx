import React from "react";
import { Connector, useConnect, useAccount } from 'wagmi'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return connectors.map((connector) => (
    <button key={connector.uid} onClick={() => connect({ connector })}>
      {connector.name}
    </button>
  ))
}

/**
 * Site footer
 */
export const Footer = () => {

  function ConnectWallet() {
    const { isConnected, address } = useAccount()

    if (isConnected) return <p>{address}</p>
    return <WalletOptions />
  }
  

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0">
        <div className="flex">
        <ConnectWallet />

          {/* <RainbowKitCustomConnectButton /> */}
          {/* <FaucetButton /> */}
        </div>
      </div>
    </div>
  );
};
