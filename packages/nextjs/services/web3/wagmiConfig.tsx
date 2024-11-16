import { wagmiConnectors } from "./wagmiConnectors";
import { injectedWithSapphire, sapphireHttpTransport } from "@oasisprotocol/sapphire-wagmi-v2";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet, sapphire, sapphireTestnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

export const wagmiConfig = createConfig({
  multiInjectedProviderDiscovery: false,
  ssr: true,
  chains: [sapphireTestnet],
  connectors: [injectedWithSapphire()],
  transports: {
    [sapphireTestnet.id]: sapphireHttpTransport(),
  },
});
