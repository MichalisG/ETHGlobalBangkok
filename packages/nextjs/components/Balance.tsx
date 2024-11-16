import { FC, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useEIP712SignIn } from "~~/hooks/useEIP712SignIn";

const Balance: FC<{ connectedAddress: string }> = ({ connectedAddress }) => {
  const [amount, setAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { signIn } = useEIP712SignIn();

  useEffect(() => {
    if (connectedAddress) {
      signIn({ connectedAddress, time: new Date().getTime() });
    }
  }, [signIn, connectedAddress]);


  const { data: balance, isPending: isBalanceLoading, error: balanceError } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPersonalBalance",
  });

  const { data: allowance } = useReadContract({
    address: deployedContracts[23295].USDC.address,
    abi: deployedContracts[23295].USDC.abi,
    functionName: "allowance",
    args: [connectedAddress, deployedContracts[23295].LUBA.address],
  });

  const { writeContract: withdraw, error: withdrawError, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: deposit, error: depositError, isPending: isDepositing } = useWriteContract();

  const { writeContract: approve, isPending: isApproving, error: approveError } = useWriteContract();

  const approveAllowance = async () => {
    approve({
      address: deployedContracts[23295].USDC.address,
      abi: deployedContracts[23295].USDC.abi,
      functionName: "approve",
      args: [deployedContracts[23295].LUBA.address, parseEther("1000000000000000000")],
      __mode: "prepared",
    });
  };

  const handleWithdraw = async () => {
    await withdraw({
      address: deployedContracts[23295].LUBA.address,
      abi: deployedContracts[23295].LUBA.abi,
      functionName: "withdrawBalance",
      __mode: "prepared",
    });
  };

  const handleDeposit = async () => {
    if (!allowance) {
      await approveAllowance();
    } else {
      await deposit({
        address: deployedContracts[23295].LUBA.address,
        abi: deployedContracts[23295].LUBA.abi,
        functionName: "addBalance",
        args: [parseEther(amount.toString())],
        __mode: "prepared",
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      Balance: {balance !== undefined ? formatEther(balance) : "loading..."}
      <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
        Deposit
      </button>
      <button className="btn btn-primary" onClick={handleWithdraw}>
        Withdraw
      </button>
      <dialog id="my_modal_1" className="modal" open={isModalOpen}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Enter Amount</h3>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="input input-bordered w-full max-w-xs"
          />
          <div className="modal-action">
            <button className="btn" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
            <button className="btn" onClick={handleDeposit} disabled={isApproving || isDepositing}>
              Deposit
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Balance;
