import { Connector, useAccount, useConnect } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "~~/components/ui/avatar";
import { Button } from "~~/components/ui/button";

export function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map(connector => (
    <Button key={connector.uid} onClick={() => connect({ connector })}>
      Connect Wallet
    </Button>
  ));
}

export const WalletConnect = () => {
  const { isConnected, address } = useAccount();

  if (isConnected)
    return (
      <div className="flex justify-end items-center w-12 cursor-pointer">
        <p className="mr-2 text-xs">{address?.slice(0,6)}...{address?.slice(-4)}</p>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    );

  return (
    <div className="flex justify-end items-center">
      <WalletOptions />
    </div>
  );
};
