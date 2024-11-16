import { useState } from "react";
import { signTypedData } from "@wagmi/core";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import deployedContracts from "~~/contracts/deployedContracts";

export const useEIP712SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async ({ connectedAddress, time }: { connectedAddress: string; time: number }) => {
    const result = await signTypedData(wagmiConfig, {
      account: connectedAddress,
      name: "LUBA.SignIn",
      version: "1",
      verifyingContract: deployedContracts[23295].LUBA.address,
      chainId: 23295,
      types: {
        SignIn: [
          { name: "name", type: "string" },
          { name: "user", type: "address" },
          { name: "time", type: "uint32" },
        ],
      },
      primaryType: "SignIn",
      message: {
        name: "LUBA.SignIn",
        user: connectedAddress,
        time: time,
      },
    });

    console.log("🚀 ~ signIn ~ result:", result);
  };

  return {
    isLoading,
    error,
    signIn,
  };
};
